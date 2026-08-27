import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../api/api';
import { 
  mockPatients, mockDoctors, mockNurses, mockNurseQueue, mockAppointments, 
  mockPastConsultations, mockStaffs, mockRooms, mockPayroll, mockShifts,
  mockPharmacyInventory, mockPharmacyQueue, mockPharmacyBills,
  departments as mockDepartments, designations as mockDesignations,
  blocks as mockBlocks, floors as mockFloors, roomTypes as mockRoomTypes
} from '../mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [nurseQueue, setNurseQueue] = useState([]);
  const [pastConsultations, setPastConsultations] = useState(mockPastConsultations);
  const [staffs, setStaffs] = useState(mockStaffs);
  const [rooms, setRooms] = useState(mockRooms);
  const [payrolls, setPayrolls] = useState(mockPayroll);
  const [shifts, setShifts] = useState(mockShifts);
  const [pharmacyInventory, setPharmacyInventory] = useState(mockPharmacyInventory);
  const [pharmacyQueue, setPharmacyQueue] = useState(mockPharmacyQueue);
  const [pharmacyBills, setPharmacyBills] = useState(mockPharmacyBills);
  const [blocks, setBlocks] = useState(mockBlocks);
  const [floors, setFloors] = useState(mockFloors);
  const [departmentsState, setDepartmentsState] = useState(mockDepartments);
  const setDepartments = (action) => {
    setDepartmentsState(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (backendOnline) apiService.updateAppSetting('departments', next).catch(() => {});
      return next;
    });
  };

  const [designationsState, setDesignationsState] = useState(mockDesignations);
  const setDesignations = (action) => {
    setDesignationsState(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (backendOnline) apiService.updateAppSetting('designations', next).catch(() => {});
      return next;
    });
  };

  const [roomTypes, setRoomTypes] = useState(mockRoomTypes);
  const [ipPatients, setIpPatients] = useState([]);
  
  // New IP Module State
  const [admissions, setAdmissions] = useState([]);
  const [beds, setBeds] = useState([]);
  const [billingLedger, setBillingLedger] = useState([]);
  const [housekeepingQueue, setHousekeepingQueue] = useState([]);

  const cachedClinicInfo = JSON.parse(localStorage.getItem('clinicInfo') || 'null');
  const defaultClinicInfo = { 
    name: 'Aarogya Hospital', 
    regNo: 'MH/2024/8829',
    address: '12, Healthcare Lane, Bengaluru - 560001', 
    phone: '+91 80 1234 5678', 
    gstin: '29AAACA1234A1Z8', 
    email: 'info@aarogya.in' 
  };
  const [clinicInfoState, setClinicInfoState] = useState(cachedClinicInfo || defaultClinicInfo);
  
  const setClinicInfo = (action) => {
    setClinicInfoState(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      localStorage.setItem('clinicInfo', JSON.stringify(next));
      if (backendOnline) apiService.updateClinicInfo(next).catch(() => {});
      return next;
    });
  };
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);
  // Tracks which patient token is currently open in consultation
  const [selectedConsultationToken, setSelectedConsultationToken] = useState(null);

  const formatPatientsWithRegNo = (list) => {
    return (list || []).map((p, idx) => {
      if (!p) return p;
      const numPart = (p.id || '').replace(/\D/g, '') || (882000 + idx);
      const regNo = p.regNo || `PRN-2026-${numPart}`;
      return { ...p, regNo };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const safeLoad = async (fn, fallback, setter) => {
          try { const data = await fn(); setter(data && data.length >= 0 ? data : fallback); }
          catch { setter(fallback); }
        };

        const safeLoadPatients = async () => {
          try { const pts = await apiService.getPatients(); setPatients(formatPatientsWithRegNo(pts)); }
          catch { setPatients(formatPatientsWithRegNo(mockPatients)); }
        };

        await Promise.all([
          safeLoadPatients(),
          safeLoad(apiService.getDoctors,      mockDoctors,      setDoctors),
          safeLoad(apiService.getNurses,       mockNurses,       setNurses),
          safeLoad(apiService.getAppointments, mockAppointments, setAppointments),
          safeLoad(apiService.getNurseQueue,   mockNurseQueue,   setNurseQueue),
        ]);
        setBackendOnline(true);

        // ── Extended modules — load in parallel, fall back individually on failure
        await Promise.all([
          safeLoad(apiService.getStaffs,               mockStaffs,            setStaffs),
          // Use mockRooms as there's no DB seed for rooms yet
          // safeLoad(apiService.getRooms, mockRooms, setRooms),
          safeLoad(apiService.getPayroll,               mockPayroll,           setPayrolls),
          safeLoad(apiService.getShifts,                mockShifts,            setShifts),
          safeLoad(apiService.getPharmacyInventory,     mockPharmacyInventory, setPharmacyInventory),
          safeLoad(apiService.getPharmacyPrescriptions, mockPharmacyQueue,     setPharmacyQueue),
          safeLoad(apiService.getPharmacyBills,         mockPharmacyBills,     setPharmacyBills),
          safeLoad(
            apiService.getIpPatients,
            JSON.parse(localStorage.getItem('offlineIpPatients') || '[]'),
            (data) => {
              setIpPatients(data);
              localStorage.setItem('offlineIpPatients', JSON.stringify(data));
            }
          ),
          safeLoad(apiService.getConsultations,         mockPastConsultations, setPastConsultations),
        ]);
        
        try {
          const info = await apiService.getClinicInfo();
          if (info && info.name) setClinicInfo(info);
        } catch (e) { console.warn('Offline: Clinic Info'); }

        const safeLoadSetting = async (key, fallback, setter) => {
          try {
            const res = await apiService.getAppSetting(key);
            if (res && res.settingValue) setter(JSON.parse(res.settingValue));
          } catch { setter(fallback); }
        };
        
        await Promise.all([
          safeLoadSetting('departments', mockDepartments, setDepartments),
          safeLoadSetting('designations', mockDesignations, setDesignations)
        ]);

      } catch (err) {
        console.warn('Backend completely offline.', err.message);
        setBackendOnline(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addPatient = async (patient) => {
    // Clean phone to 10 digits
    let phone = (patient.phone || '').replace(/\D/g, '');
    if (phone.startsWith('91') && phone.length > 10) phone = phone.slice(2);
    const cleanPatient = { ...patient, phone };

    let newPatient;
    try {
      newPatient = await apiService.createPatient(cleanPatient);
      if (newPatient && !newPatient.regNo) {
        const num = (newPatient.id || '').replace(/\D/g, '') || Math.floor(100000 + Math.random() * 899999);
        newPatient.regNo = `PRN-2026-${num}`;
      }
    } catch (err) {
      // Offline fallback
      const idNum = Math.floor(100000 + Math.random() * 899999);
      const id = `P-${idNum}`;
      const regNo = `PRN-2026-${idNum}`;
      newPatient = { ...cleanPatient, id, regNo };
    }
    setPatients(prev => formatPatientsWithRegNo([...prev, newPatient]));

    // Calculate age from dob
    const calcAge = (dob) => {
      if (!dob) return 0;
      const d = new Date(dob);
      return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    };

    // Auto-add newly registered patient to nurse queue (without doctor assignment yet)
    const tokenNum = Math.floor(Math.random() * 900) + 100;
    const token = `REG-${tokenNum}`;
    const queueEntry = {
      patientId: newPatient.id,
      patientName: newPatient.fullName,
      gender: newPatient.gender === 'Male' ? 'M' : newPatient.gender === 'Female' ? 'F' : 'O',
      age: calcAge(newPatient.dob),
      doctorName: newPatient.referringDoctor || 'Not Assigned',
      token: token,
      status: 'Pending',
      vitals: { bp: '', pulse: '', temp: '', weight: '', height: '', bmi: '', spo2: '', rbs: '' },
      chiefComplaint: '',
      nurseNotes: '',
      sentToDoctor: false,
    };
    try {
      const newQueue = await apiService.addToQueue(queueEntry);
      setNurseQueue(prev => [...prev, newQueue]);
    } catch (err) {
      // Offline: add locally
      setNurseQueue(prev => [...prev, queueEntry]);
    }

    return newPatient.id;
  };

  const updatePatient = async (id, data) => {
    try {
      const updated = await apiService.updatePatient(id, data);
      setPatients(prev => formatPatientsWithRegNo(prev.map(p => p.id === id ? { ...p, ...updated } : p)));
    } catch (err) {
      // Offline fallback
      setPatients(prev => formatPatientsWithRegNo(prev.map(p => p.id === id ? { ...p, ...data } : p)));
    }
  };

  const deletePatient = async (id) => {
    try {
      await apiService.deletePatient(id);
    } catch (err) {
      console.warn('Delete API not available, removing locally', err);
    }
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  const addToNurseQueue = async (patient) => {
    const calcAge = (dob) => {
      if (!dob) return 0;
      const d = new Date(dob);
      return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    };

    const tokenNum = Math.floor(Math.random() * 900) + 100;
    const token = `REG-${tokenNum}`;
    const queueEntry = {
      patientId: patient.id,
      patientName: patient.fullName,
      gender: patient.gender === 'Male' ? 'M' : patient.gender === 'Female' ? 'F' : 'O',
      age: calcAge(patient.dob),
      doctorName: patient.referringDoctor || 'Not Assigned',
      token: token,
      status: 'Pending',
      vitals: { bp: '', pulse: '', temp: '', weight: '', height: '', bmi: '', spo2: '', rbs: '' },
      chiefComplaint: '',
      nurseNotes: '',
      sentToDoctor: false,
    };
    
    try {
      const newQueue = await apiService.addToQueue(queueEntry);
      setNurseQueue(prev => [...prev, newQueue]);
      return newQueue.token;
    } catch (err) {
      setNurseQueue(prev => [...prev, queueEntry]);
      return queueEntry.token;
    }
  };

  const addDoctor = async (doctor) => {
    let newDoctor;
    try {
      newDoctor = await apiService.createDoctor(doctor);
    } catch (err) {
      newDoctor = { ...doctor, id: `DOC-${Math.floor(1000 + Math.random() * 8999)}` };
    }
    setDoctors(prev => [...prev, newDoctor]);
    return newDoctor.id;
  };

  const updateDoctor = async (id, data) => {
    try {
      const updated = await apiService.updateDoctor(id, data);
      setDoctors(prev => prev.map(d => d.id === id ? updated : d));
    } catch (err) {
      setDoctors(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    }
  };

  const deleteDoctor = async (id) => {
    try {
      await apiService.deleteDoctor(id);
    } catch (err) {
      console.warn('Delete API not available, removing locally', err);
    }
    setDoctors(prev => prev.filter(d => d.id !== id));
  };

  const addAppointment = async (apt) => {
    let newApt;
    try {
      newApt = await apiService.createAppointment(apt);
    } catch (err) {
      // Offline fallback with local token
      const tokenNum = Math.floor(Math.random() * 900) + 100;
      const token = `TKN-${String(tokenNum).padStart(3, '0')}`;
      const id = `APT-${Date.now()}`;
      newApt = { ...apt, id, token };
    }
    setAppointments(prev => [...prev, newApt]);

    // Find the patient for age/gender info
    const patient = patients.find(p => p.id === newApt.patientId);
    const calcAge = (dob) => {
      if (!dob) return 0;
      const d = new Date(dob);
      return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    };

    // Auto-add to nurse queue
    const queueEntry = {
      patientId: newApt.patientId,
      patientName: newApt.patientName,
      gender: patient?.gender === 'Male' ? 'M' : patient?.gender === 'Female' ? 'F' : 'O',
      age: patient ? calcAge(patient.dob) : 0,
      doctorName: newApt.doctorName,
      token: newApt.token,
      status: 'Pending',
      vitals: { bp: '', pulse: '', temp: '', weight: '', height: '', bmi: '', spo2: '', rbs: '' },
      chiefComplaint: '',
      nurseNotes: '',
      sentToDoctor: false,
    };
    try {
      const newQueue = await apiService.addToQueue(queueEntry);
      setNurseQueue(prev => [...prev, newQueue]);
    } catch (err) {
      setNurseQueue(prev => [...prev, queueEntry]);
    }

    return { id: newApt.id, token: newApt.token };
  };

  const updateNurseQueue = async (token, data) => {
    // Optimistic update — merge vitals object properly
    setNurseQueue(prev => prev.map(q => {
      if (q.token !== token) return q;
      const merged = { ...q, ...data };
      if (data.vitals) {
        merged.vitals = { ...q.vitals, ...data.vitals };
        // Also mirror vitals fields flat (for API)
        Object.assign(merged, data.vitals);
      }
      return merged;
    }));

    try {
      // Flatten vitals into top-level fields for the API
      const payload = { ...data };
      if (payload.vitals) {
        Object.assign(payload, payload.vitals);
        delete payload.vitals;
      }
      await apiService.updateQueueEntry(token, payload);
    } catch (err) {
      console.warn('Failed to update queue (offline?)', err.message);
    }
  };

  const markPatientDone = async (token) => {
    // Optimistic update
    setNurseQueue(prev => prev.map(q => q.token === token ? { ...q, status: 'Done' } : q));
    try {
      await apiService.updateQueueEntry(token, { status: 'Done' });
    } catch (err) {
      console.warn('Failed to mark done (offline?)', err.message);
    }
  };

  const addNurse = async (nurse) => {
    let newNurse;
    try {
      newNurse = await apiService.createNurse(nurse);
    } catch (err) {
      newNurse = { ...nurse, id: `NUR-${Math.floor(1000 + Math.random() * 8999)}` };
    }
    setNurses(prev => [...prev, newNurse]);
    return newNurse;
  };

  const updateNurse = async (id, updates) => {
    let updated;
    try {
      updated = await apiService.updateNurse(id, updates);
      setNurses(prev => prev.map(n => n.id === id ? updated : n));
    } catch (err) {
      updated = { ...nurses.find(n => n.id === id), ...updates };
      setNurses(prev => prev.map(n => n.id === id ? updated : n));
    }
    return updated;
  };

  const deleteNurse = async (id) => {
    try {
      await apiService.deleteNurse(id);
    } catch (err) {
      console.warn('Delete API not available, removing locally', err);
    }
    setNurses(prev => prev.filter(n => n.id !== id));
  };

  const addStaff = async (stf) => {
    let newStf;
    try {
      newStf = await apiService.createStaff(stf);
    } catch {
      newStf = { ...stf, id: `STF-${Math.floor(100 + Math.random() * 899)}` };
    }
    setStaffs(prev => [...prev, newStf]);
    return newStf;
  };

  const updateStaff = async (id, updates) => {
    try {
      const updated = await apiService.updateStaff(id, updates);
      setStaffs(prev => prev.map(s => s.id === id ? updated : s));
    } catch {
      setStaffs(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const deleteStaff = async (id) => {
    try { await apiService.deleteStaff(id); } catch { console.warn('deleteStaff offline'); }
    setStaffs(prev => prev.filter(s => s.id !== id));
  };

  const updateRoom = async (id, updates) => {
    try {
      const updated = await apiService.updateRoom(id, updates);
      setRooms(prev => prev.map(r => r.id === id ? updated : r));
    } catch {
      setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    }
  };

  const addWard = (wardName) => {
    if (!wardName || wards.includes(wardName)) return;
    setWards(prev => [...prev, wardName]);
  };

  const addRoom = async (room) => {
    let newRoom;
    try {
      newRoom = await apiService.createRoom(room);
    } catch {
      newRoom = { ...room, id: `RM-${Math.floor(100 + Math.random() * 899)}`, status: room.status || 'Available', patientId: null, patientName: null, assignedDoctor: null, assignedNurse: null, admissionDate: null };
    }
    setRooms(prev => [...prev, newRoom]);
    return newRoom;
  };

  const deleteRoom = async (id) => {
    try { await apiService.deleteRoom(id); } catch { console.warn('deleteRoom offline'); }
    setRooms(prev => prev.filter(r => r.id !== id));
  };

  const updatePayroll = async (id, updates) => {
    try {
      const updated = await apiService.updatePayroll(id, updates);
      setPayrolls(prev => prev.map(p => p.id === id ? updated : p));
    } catch {
      setPayrolls(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  };

  const addPayroll = async (payroll) => {
    let newPay;
    try {
      newPay = await apiService.createPayroll(payroll);
    } catch {
      newPay = { ...payroll, id: `PAY-${Date.now()}` };
    }
    setPayrolls(prev => [...prev, newPay]);
    return newPay;
  };

  const updateShift = async (id, updates) => {
    try {
      const updated = await apiService.updateShift(id, updates);
      setShifts(prev => prev.map(s => s.id === id ? updated : s));
    } catch {
      setShifts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const addShift = async (shift) => {
    let newShf;
    try {
      newShf = await apiService.createShift(shift);
    } catch {
      newShf = { ...shift, id: `SHF-${Date.now()}` };
    }
    setShifts(prev => [...prev, newShf]);
    return newShf;
  };

  const addPharmacyMedication = async (med) => {
    let newMed;
    try {
      newMed = await apiService.createPharmacyMed(med);
    } catch {
      newMed = { ...med, id: `MED-${Date.now()}`, lastRestocked: new Date().toISOString().slice(0, 10) };
    }
    setPharmacyInventory(prev => [newMed, ...prev]);
    return newMed;
  };

  const updatePharmacyMedication = async (id, updates) => {
    try {
      const updated = await apiService.updatePharmacyMed(id, updates);
      setPharmacyInventory(prev => prev.map(m => m.id === id ? updated : m));
    } catch {
      setPharmacyInventory(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    }
  };

  const deletePharmacyMedication = async (id) => {
    try { await apiService.deletePharmacyMed(id); } catch { console.warn('deletePharmacyMed offline'); }
    setPharmacyInventory(prev => prev.filter(m => m.id !== id));
  };

  const addPharmacyQueueItem = async (rx) => {
    let newRx;
    try {
      newRx = await apiService.createPharmacyRx(rx);
    } catch {
      newRx = { ...rx, id: rx.id || `RX-${Date.now()}`, date: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, status: 'Ready to Dispense' };
    }
    setPharmacyQueue(prev => [newRx, ...prev]);
    return newRx;
  };

  const dispensePrescription = async (rxId, paymentMethod = 'UPI / GPay') => {
    const rx = pharmacyQueue.find(q => q.id === rxId);
    if (!rx) return null;

    try {
      // Backend atomic transaction: stock deduct + mark dispensed + create bill
      const result = await apiService.dispensePharmacyRx(rxId, paymentMethod);
      if (result.rx) setPharmacyQueue(prev => prev.map(q => q.id === rxId ? result.rx : q));
      if (result.bill) {
        setPharmacyBills(prev => [result.bill, ...prev]);
        // Reload inventory to get accurate stock
        apiService.getPharmacyInventory().then(inv => setPharmacyInventory(inv)).catch(() => {});
        return result.bill;
      }
    } catch {
      // Offline fallback — local state only
    }

    // Local fallback (offline or backend failed)
    if (rx.items && rx.items.length > 0) {
      setPharmacyInventory(prev => prev.map(med => {
        const itemMatch = rx.items.find(i => i.medId === med.id || i.name === med.name);
        if (itemMatch) return { ...med, stock: Math.max(0, med.stock - (itemMatch.qty || 1)) };
        return med;
      }));
    }
    setPharmacyQueue(prev => prev.map(q => q.id === rxId ? { ...q, status: 'Dispensed' } : q));
    const sub = rx.totalAmount || rx.items?.reduce((a, b) => a + ((b.price || 50) * (b.qty || 1)), 0) || 200;
    const gstVal = Number((sub * 0.12).toFixed(2));
    const discVal = Number((sub * 0.05).toFixed(2));
    const totVal = Math.round(sub + gstVal - discVal);
    const newBill = {
      id: `INV-${Date.now()}`,
      rxId: rx.id, patientName: rx.patientName, patientId: rx.patientId,
      date: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      itemsCount: rx.items?.length || 1, subtotal: sub, gst: gstVal, discount: discVal, total: totVal,
      paymentMethod: `${paymentMethod} (TXN-${Math.floor(100000 + Math.random() * 899999)})`,
      status: 'Paid', items: rx.items || [],
    };
    setPharmacyBills(prev => [newBill, ...prev]);
    return newBill;
  };

  const createPharmacyBill = (bill) => {
    const newB = { ...bill, id: `INV-2026-${Math.floor(100 + Math.random() * 899)}` };
    setPharmacyBills(prev => [newB, ...prev]);
    return newB;
  };

  const returnPharmacyBill = async (billId, returnReason) => {
    const bill = pharmacyBills.find(b => b.id === billId);
    if (!bill) return;

    try {
      // Backend atomic: restore stock + mark returned
      await apiService.returnPharmacyBill(billId, returnReason);
      // Reload inventory for accurate stock count
      apiService.getPharmacyInventory().then(inv => setPharmacyInventory(inv)).catch(() => {});
    } catch {
      // Offline fallback — restore stock locally
      if (bill.items && bill.items.length > 0) {
        setPharmacyInventory(prev => prev.map(med => {
          const itemMatch = bill.items.find(i => (i.medId && i.medId === med.id) || (i.name && med.name.includes(i.name)) || (i.name && i.name.includes(med.name)));
          if (itemMatch) return { ...med, stock: med.stock + (itemMatch.qty || 1) };
          return med;
        }));
      }
    }
    setPharmacyBills(prev => prev.map(b => b.id === billId ? { ...b, status: 'Returned & Refunded', returnReason } : b));
  };

  // ── IP Patients (Admissions) ──────────────────────────────────────────────
  const addIpPatient = async (record) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
    const timeStr = today.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
    const newRecord = {
      admissionDate: `${dateStr}, ${timeStr}`,
      status: 'Pending',
      ...record,
    };
    
    let savedRecord;
    try {
      savedRecord = await apiService.createIpPatient(newRecord);
    } catch {
      savedRecord = { ...newRecord, id: `IP-${Date.now()}` };
    }
    setIpPatients(prev => {
      const next = [savedRecord, ...prev];
      localStorage.setItem('offlineIpPatients', JSON.stringify(next));
      return next;
    });
    return savedRecord;
  };

  const addAdmission = (admission) => {
    setAdmissions(prev => [admission, ...prev]);
  };

  const updateIpPatientStatus = async (id, status) => {
    try {
      const ip = ipPatients.find(p => p.id === id);
      if (ip) {
        await apiService.updateIpPatient(id, { ...ip, status });
      }
    } catch (e) { console.warn('Offline fallback for status update'); }
    
    setIpPatients(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const dischargeIpPatient = async (id) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = today.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    try {
      const ip = ipPatients.find(p => p.id === id);
      if (ip) {
        await apiService.updateIpPatient(id, { ...ip, status: 'Discharged', dischargeDate: `${dateStr}, ${timeStr}` });
      }
    } catch (e) { console.warn('Offline fallback for discharge'); }

    setIpPatients(prev => prev.map(p => p.id === id ? { ...p, status: 'Discharged', dischargeDate: `${dateStr}, ${timeStr}` } : p));
    // Free the room on discharge
    setIpPatients(prev => {
      const patient = prev.find(p => p.id === id);
      if (patient?.allocatedRoomId) {
        const roomId = patient.allocatedRoomId;
        const oldRoom = rooms.find(rm => rm.id === roomId);
        if (oldRoom) {
          const freedRoom = { ...oldRoom, status: 'Cleaning / Maintenance', patientId: null, patientName: null, assignedDoctor: null, admissionDate: null };
          apiService.updateRoom(roomId, freedRoom).catch(e => console.warn('Offline: freeing room on discharge'));
          setRooms(r => r.map(rm => rm.id === roomId ? freedRoom : rm));
        }
      }
      return prev.map(p => p.id === id ? { ...p, status: 'Discharged', dischargeDate: `${dateStr}, ${timeStr}`, allocatedRoomId: null, allocatedRoomNo: null } : p);
    });
  };

  // Allocate a room to an IP patient (marks room Occupied, links room to patient)
  const allocateRoomToIpPatient = async (ipPatientId, roomId, meta = {}) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const ip = ipPatients.find(p => p.id === ipPatientId);
    if (!ip) return;

    // If already had a room, free the old one first
    if (ip.allocatedRoomId && ip.allocatedRoomId !== roomId) {
      const oldRoom = rooms.find(r => r.id === ip.allocatedRoomId);
      if (oldRoom) {
        const freedRoom = { ...oldRoom, status: 'Available', patientId: null, patientName: null, assignedDoctor: null, admissionDate: null };
        try { await apiService.updateRoom(oldRoom.id, freedRoom); } catch (e) { console.warn('Offline: freeing old room'); }
        setRooms(prev => prev.map(r => r.id === oldRoom.id ? freedRoom : r));
      }
    }

    // Mark new room as Occupied
    const today = (meta.admissionDateTime || new Date().toISOString()).slice(0, 10);
    const newRoomState = { ...room, status: 'Occupied', patientId: ip.patientId, patientName: ip.patientName, assignedDoctor: meta.admittingDoctor || ip.doctorName, admissionDate: today };
    try { await apiService.updateRoom(roomId, newRoomState); } catch (e) { console.warn('Offline: allocating room'); }
    setRooms(prev => prev.map(r => r.id === roomId ? newRoomState : r));

    // Link room + metadata to IP patient
    const ipRecord = ipPatients.find(p => p.id === ipPatientId);
    if (!ipRecord) return;

    try {
      const admission = admissions.find(a => a.patientId === ipRecord.patientId && a.admissionStatus === 'TRIAGE_PENDING');
      if (admission) {
         await apiService.allocateBed(admission.id, { bedId: roomId });
         setAdmissions(prev => prev.map(a => a.id === admission.id ? { ...a, admissionStatus: 'ADMITTED' } : a));
      }
    } catch (e) {
      console.warn("New admission API fallback", e);
    }

    const roomLabel = [room.roomNo, room.bedNo].filter(Boolean).join('-');
    const updatedPatient = {
      ...ipRecord,
      status: 'Admitted',
      allocatedRoomId: roomId,
      allocatedRoomNo: roomLabel,
      allocatedRoomType: room.type,
      allocatedBlock: room.block || room.ward || '',
      allocatedFloor: room.floor || '',
      allocatedRoomPrice: room.price || '',
      // Allocation metadata
      admissionDateTime: meta.admissionDateTime || new Date().toISOString().slice(0, 16),
      expectedDischarge: meta.expectedDischarge || '',
      allocatedBy: meta.allocatedBy || '',
      allocationNotes: meta.allocationNotes || '',
      department: meta.department || ip.department || '',
      admittingDoctor: meta.admittingDoctor || ip.doctorName || '',
      careLevel: meta.careLevel || ip.careLevel || 'General',
    };

    try {
      apiService.updateIpPatient(ipPatientId, updatedPatient);
    } catch (e) { console.warn('Offline fallback for room allocation sync'); }

    setIpPatients(prev => prev.map(p => p.id === ipPatientId ? updatedPatient : p));
  };

  const addConsultation = (record) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
    const timeStr = today.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const newRecord = {
      id: `CON-${Date.now()}`,
      date: `${dateStr} ${timeStr}`,
      ...record,
    };
    setPastConsultations(prev => [newRecord, ...prev]);
    return newRecord;
  };

  return (
    <AppContext.Provider value={{
      patients, doctors, nurses, appointments, nurseQueue, pastConsultations, setPastConsultations,
      staffs, setStaffs, rooms, setRooms, blocks, setBlocks, floors, setFloors,
      departments: departmentsState, setDepartments, 
      designations: designationsState, setDesignations,
      payrolls, setPayrolls, shifts, setShifts,
      pharmacyInventory, setPharmacyInventory, pharmacyQueue, setPharmacyQueue, pharmacyBills, setPharmacyBills,
      loading,
      backendOnline,
      selectedConsultationToken, setSelectedConsultationToken,
      addPatient, updatePatient, deletePatient,
      addDoctor, updateDoctor, deleteDoctor,
      addNurse, updateNurse, deleteNurse,
      addStaff, updateStaff, deleteStaff,
      addRoom, updateRoom, deleteRoom, addWard,
      updatePayroll, addPayroll, updateShift, addShift,
      addPharmacyMedication, updatePharmacyMedication, deletePharmacyMedication,
      addPharmacyQueueItem, dispensePrescription, createPharmacyBill, returnPharmacyBill,
      addConsultation,
      addAppointment,
      updateNurseQueue, markPatientDone, addToNurseQueue,
      setPatients, // exposed for inline registration in Appointments
      roomTypes, setRoomTypes,
      clinicInfo: clinicInfoState, setClinicInfo,
      ipPatients, addIpPatient, updateIpPatientStatus, dischargeIpPatient, allocateRoomToIpPatient,
      // Alias for clarity when performing bed transfers (re-uses allocateRoomToIpPatient logic)
      transferBed: allocateRoomToIpPatient,
      admissions, setAdmissions, addAdmission,
      beds, setBeds,
      billingLedger, setBillingLedger,
      housekeepingQueue, setHousekeepingQueue,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
