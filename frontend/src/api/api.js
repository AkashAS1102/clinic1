import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

// ─── Response interceptor for error logging ───────────────────────────────────
api.interceptors.response.use(
  res => res,
  err => {
    console.error('[API Error]', err.config?.url, err.message);
    return Promise.reject(err);
  }
);

const parsePatient = p => {
  const parsed = { ...p };
  if (typeof parsed.allergies === 'string') {
    try { parsed.allergies = JSON.parse(parsed.allergies); } catch { parsed.allergies = []; }
  } else if (!parsed.allergies) { parsed.allergies = []; }
  return parsed;
};

const preparePatient = p => {
  const payload = { ...p };
  // The backend expects a List<String>, which Jackson parses from a JSON array.
  // We should NOT stringify it.
  return payload;
};

const parseDoctor = d => {
  const parsed = { ...d };
  if (typeof parsed.availableDays === 'string') {
    try { parsed.availableDays = JSON.parse(parsed.availableDays); } catch { parsed.availableDays = []; }
  } else if (!parsed.availableDays) { parsed.availableDays = []; }
  return parsed;
};

const prepareDoctor = d => {
  const payload = { ...d };
  // The backend expects a List<String>, which Jackson parses from a JSON array.
  // We should NOT stringify it.
  return payload;
};
const parseNurse = n => {
  const parsed = { ...n };
  if (typeof parsed.availableDays === 'string') {
    try { parsed.availableDays = JSON.parse(parsed.availableDays); } catch { parsed.availableDays = []; }
  } else if (!parsed.availableDays) { parsed.availableDays = []; }
  return parsed;
};

export const apiService = {
  // ── Patients ──────────────────────────────────────────────────────────────
  getPatients: () => api.get('/patients').then(r => r.data.map(parsePatient)),
  getPatientsByPhone: (phone) => api.get(`/patients/phone/${phone}`).then(r => r.data.map(parsePatient)),
  getPatient: (id) => api.get(`/patients/${id}`).then(r => parsePatient(r.data)),
  createPatient: (patient) => api.post('/patients', preparePatient(patient)).then(r => parsePatient(r.data)),
  updatePatient: (id, patient) => api.put(`/patients/${id}`, preparePatient(patient)).then(r => parsePatient(r.data)),
  deletePatient: (id) => api.delete(`/patients/${id}`).then(r => r.data),

  // ── Doctors ───────────────────────────────────────────────────────────────
  getDoctors: () => api.get('/doctors').then(r => r.data.map(parseDoctor)),
  createDoctor: (doctor) => api.post('/doctors', prepareDoctor(doctor)).then(r => parseDoctor(r.data)),
  updateDoctor: (id, doctor) => api.put(`/doctors/${id}`, prepareDoctor(doctor)).then(r => parseDoctor(r.data)),
  deleteDoctor: (id) => api.delete(`/doctors/${id}`).then(r => r.data),

  // ── Nurses ───────────────────────────────────────────────────────────────
  getNurses: () => api.get('/nurses').then(r => r.data.map(parseNurse)),
  createNurse: (nurse) => api.post('/nurses', nurse).then(r => parseNurse(r.data)),
  updateNurse: (id, nurse) => api.put(`/nurses/${id}`, nurse).then(r => parseNurse(r.data)),
  deleteNurse: (id) => api.delete(`/nurses/${id}`).then(r => r.data),

  // ── IP Patients ──────────────────────────────────────────────────────────
  getIpPatients: () => api.get('/ip-patients').then(r => r.data),
  createIpPatient: (data) => api.post('/ip-patients', data).then(r => r.data),
  updateIpPatient: (id, data) => api.put(`/ip-patients/${id}`, data).then(r => r.data),
  deleteIpPatient: (id) => api.delete(`/ip-patients/${id}`).then(r => r.data),

  // ── Appointments ──────────────────────────────────────────────────────────
  getAppointments: () => api.get('/appointments').then(r => r.data),
  createAppointment: (appointment) => api.post('/appointments', appointment).then(r => r.data),
  updateAppointment: (id, data) => api.put(`/appointments/${id}`, data).then(r => r.data),
  checkAppointmentConflict: (doctorId, date, timeSlot) =>
    api.post('/appointments/check-conflict', { doctorId, date, timeSlot })
      .then(r => r.data)
      .catch(err => {
        if (err.response?.status === 409) return { conflict: true, message: err.response.data.message };
        throw err;
      }),

  // ── Nurse Queue ───────────────────────────────────────────────────────────
  getNurseQueue: () => api.get('/nurse-queue').then(r => r.data.map(entry => ({
    ...entry,
    vitals: {
      bp: entry.bp || entry.vitals?.bp || '',
      pulse: entry.pulse || entry.vitals?.pulse || '',
      temp: entry.temp || entry.vitals?.temp || '',
      weight: entry.weight || entry.vitals?.weight || '',
      height: entry.height || entry.vitals?.height || '',
      bmi: entry.bmi || entry.vitals?.bmi || '',
      spo2: entry.spo2 || entry.vitals?.spo2 || '',
      rbs: entry.rbs || entry.vitals?.rbs || '',
    }
  }))),
  addToQueue: (entry) => api.post('/nurse-queue', entry).then(r => r.data),
  updateQueueEntry: (token, updates) => {
    // Flatten vitals object into top-level fields before sending to backend
    const payload = { ...updates };
    if (payload.vitals) {
      Object.assign(payload, payload.vitals);
      delete payload.vitals;
    }
    return api.put(`/nurse-queue/${token}`, payload).then(r => r.data);
  },

  // ── Consultations ─────────────────────────────────────────────────────────
  getConsultations: () => api.get('/consultations').then(r => r.data),
  getConsultationsByPatient: (patientId) => api.get(`/consultations/patient/${patientId}`).then(r => r.data),
  createConsultation: (data) => api.post('/consultations', data).then(r => r.data),
  saveConsultation: (consultation) => api.post('/consultations', consultation).then(r => r.data),
  completeConsultation: (id) => api.put(`/consultations/${id}/complete`).then(r => r.data),

  // ── Staffs ────────────────────────────────────────────────────────────────
  getStaffs: () => api.get('/staffs').then(r => r.data),
  createStaff: (staff) => api.post('/staffs', staff).then(r => r.data),
  updateStaff: (id, staff) => api.put(`/staffs/${id}`, staff).then(r => r.data),
  deleteStaff: (id) => api.delete(`/staffs/${id}`).then(r => r.data),

  // ── Rooms ─────────────────────────────────────────────────────────────────
  getRooms: () => api.get('/rooms').then(r => r.data),
  createRoom: (room) => api.post('/rooms', room).then(r => r.data),
  updateRoom: async (id, data) => (await api.put(`/rooms/${id}`, data)).data,
  deleteRoom: async (id) => (await api.delete(`/rooms/${id}`)).data,

  // --- IP MODULE NEW ENDPOINTS ---
  getTriageQueue: async () => (await api.get('/ip/triage-queue')).data,
  allocateBed: async (admissionId, payload) => (await api.post(`/ip/admissions/${admissionId}/allocate-bed`, payload)).data,
  recordVitals: async (admissionId, payload) => (await api.post(`/ip/admissions/${admissionId}/vitals`, payload)).data,
  administerEmar: async (admissionId, payload) => (await api.post(`/ip/admissions/${admissionId}/emar/administer`, payload)).data,
  getLedgerSummary: async (admissionId) => (await api.get(`/ip/admissions/${admissionId}/ledger-summary`)).data,
  initiateDischarge: async (admissionId) => (await api.post(`/ip/admissions/${admissionId}/initiate-discharge`)).data,
  finalizeDischarge: async (admissionId) => (await api.post(`/ip/admissions/${admissionId}/finalize-discharge`)).data,
  getBedsMatrix: async () => (await api.get('/beds/matrix')).data,
  bulkGenerateWards: async (payload) => (await api.post('/wards/bulk-generate', payload)).data,
  admitToIp: async (consultationId, payload) => (await api.post(`/consultations/${consultationId}/admit-to-ip`, payload)).data,

  // ── Settings ──────────────────────────────────────────────────────────────
  getClinicInfo: () => api.get('/settings/clinic-info').then(r => r.data),
  updateClinicInfo: (data) => api.put('/settings/clinic-info', data).then(r => r.data),
  
  getAppSetting: (key) => api.get(`/settings/${key}`).then(r => r.data),
  saveAppSetting: (key, value) => api.post(`/settings`, { settingKey: key, settingValue: JSON.stringify(value) }).then(r => r.data),
  updateAppSetting: (key, value) => api.put(`/settings/${key}`, { settingValue: JSON.stringify(value) }).then(r => r.data),

  // ── Payroll ───────────────────────────────────────────────────────────────
  getPayroll: () => api.get('/hr/payroll').then(r => r.data),
  createPayroll: (record) => api.post('/hr/payroll', record).then(r => r.data),
  updatePayroll: (id, record) => api.put(`/hr/payroll/${id}`, record).then(r => r.data),

  // ── Shifts / Working Hours ────────────────────────────────────────────────
  getShifts: () => api.get('/hr/shifts').then(r => r.data),
  createShift: (shift) => api.post('/hr/shifts', shift).then(r => r.data),
  updateShift: (id, shift) => api.put(`/hr/shifts/${id}`, shift).then(r => r.data),

  // ── Pharmacy — Inventory ──────────────────────────────────────────────────
  getPharmacyInventory: () => api.get('/pharmacy/inventory').then(r => r.data),
  createPharmacyMed: (med) => api.post('/pharmacy/inventory', med).then(r => r.data),
  updatePharmacyMed: (id, med) => api.put(`/pharmacy/inventory/${id}`, med).then(r => r.data),
  deletePharmacyMed: (id) => api.delete(`/pharmacy/inventory/${id}`).then(r => r.data),

  // ── Pharmacy — Prescriptions Queue ────────────────────────────────────────
  getPharmacyPrescriptions: () => api.get('/pharmacy/prescriptions').then(r => r.data),
  createPharmacyRx: (rx) => api.post('/pharmacy/prescriptions', rx).then(r => r.data),
  // Atomic dispense: deducts stock, marks dispensed, creates invoice
  dispensePharmacyRx: (id, paymentMethod) =>
    api.put(`/pharmacy/prescriptions/${id}/dispense`, { paymentMethod }).then(r => r.data),

  // ── Pharmacy — Bills ──────────────────────────────────────────────────────
  getPharmacyBills: () => api.get('/pharmacy/bills').then(r => r.data),
  returnPharmacyBill: (id, returnReason) =>
    api.put(`/pharmacy/bills/${id}/return`, { returnReason }).then(r => r.data),

  // ── Health ────────────────────────────────────────────────────────────────
  checkHealth: () => api.get('/health').then(r => r.data),
};
