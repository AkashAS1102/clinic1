import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, FileText, CheckCircle2, User, Send, ArrowLeft, Clock, Stethoscope, Pill, Image as ImageIcon, TestTubes, History as HistoryIcon, Calendar, Activity, Heart, Thermometer, Wind, Scale, AlertTriangle, Printer, X, ShieldAlert, BedDouble } from 'lucide-react';
import { diagnoses, medicines as defaultMedicines, labTests, labTestsGroups, mockPastConsultations } from '../../mockData';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../api/api';
import { stockApi } from '../../api/stockApi';
import styles from './Consultation.module.css';

const departments = [
  'General Medicine', 'Cardiology', 'Neurology', 'Pediatrics',
  'Orthopedics', 'Dermatology', 'ENT', 'Ophthalmology', 'Gynecology'
];

const TABS = ['Diagnosis', 'Prescription', 'SCAN', 'Lab Tests', 'History', 'Next Visit'];

const emptyRx = { type: 'Tablet', medicine: '', dosage: '', frequency: '', duration: '', instruction: 'AF', timing: '' };

function VitalChip({ label, value, unit, alert, icon: Icon }) {
  return (
    <div className={styles.vitalChip}>
      <div className={styles.vitalLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {Icon && <Icon size={10} color={alert ? 'var(--danger)' : '#64748b'} />}
        {label}
      </div>
      <div className={`${styles.vitalValue} ${alert ? styles.vitalAlert : ''}`}>{value || '—'}</div>
      <div className={styles.vitalUnit}>{unit}</div>
    </div>
  );
}

function SearchableDropdown({ options, value, onChange, placeholder, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = isOpen ? search : value;
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        className="form-input"
        value={displayValue}
        onChange={e => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setSearch('');
          setIsOpen(true);
        }}
        placeholder={value || placeholder}
        disabled={disabled}
      />
      {isOpen && !disabled && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'white', border: '1px solid var(--border)', 
          borderRadius: 6, zIndex: 100,
          maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {filtered.length > 0 ? filtered.map(opt => (
            <div 
              key={opt}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', fontSize: 13, color: 'var(--text-primary)' }}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--primary-light)'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              {opt}
            </div>
          )) : (
            <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-muted)' }}>No matches</div>
          )}
        </div>
      )}
    </div>
  );
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function Consultation() {
  const { nurseQueue, patients, markPatientDone, selectedConsultationToken, setSelectedConsultationToken, addPharmacyQueueItem, addConsultation, pastConsultations, addIpPatient, addAdmission, clinicInfo } = useApp();
  const navigate = useNavigate();

  // Get the active patient from nurse queue
  const activeQueueEntry = useMemo(() => {
    if (selectedConsultationToken) {
      return (nurseQueue || []).find(q => q && q.token === selectedConsultationToken) || null;
    }
    return null; // Do not auto-select, show the queue view
  }, [nurseQueue, selectedConsultationToken]);

  const patientRecord = useMemo(() => {
    if (!activeQueueEntry) return null;
    return (patients || []).find(p => p && p.id === activeQueueEntry.patientId) || null;
  }, [patients, activeQueueEntry]);

  // Calculate age from DOB
  const calcAge = (dob) => {
    if (!dob) return '';
    const d = new Date(dob);
    const years = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    return `${years}Y`;
  };

  const [activeTab, setActiveTab] = useState('Diagnosis');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [currentRx, setCurrentRx] = useState({ ...emptyRx });
  const [medSearch, setMedSearch] = useState('');
  const [medicines, setMedicines] = useState(defaultMedicines);
  const [consultationId, setConsultationId] = useState(null);

  useEffect(() => {
    stockApi.getProducts().then(prods => {
      const grouped = { ...defaultMedicines }; // merge with mock data
      prods.forEach(p => {
        const type = p.categoryType || 'Tablet';
        if (!grouped[type]) grouped[type] = [];
        if (!grouped[type].includes(p.name)) {
          grouped[type].push(p.name);
        }
      });
      setMedicines(grouped);
    }).catch(err => console.error("Failed to load product master", err));
  }, []);

  const [scan, setScan] = useState('');
  const [scanNotes, setScanNotes] = useState('');
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [labOther, setLabOther] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [nextVisitNotes, setNextVisitNotes] = useState('');
  const [saved, setSaved] = useState(false);

  // Get past history for the selected patient from live context state
  // (reads pastConsultations, not the static mock, so newly completed visits appear immediately)
  const patientHistory = activeQueueEntry 
    ? (pastConsultations || []).filter(c => c && c.patientId === activeQueueEntry.patientId).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    : [];
  const [referModal, setReferModal] = useState(false);
  const [referSpecialist, setReferSpecialist] = useState('');
  const [referReason, setReferReason] = useState('');
  const [referSent, setReferSent] = useState(false);
  const [savedReferrals, setSavedReferrals] = useState([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [allergyAlertMed, setAllergyAlertMed] = useState(null);
  const [allergyConfirmed, setAllergyConfirmed] = useState(false);

  // IP Admission state
  const [visitType, setVisitType] = useState('OP');
  const [admitToIPModal, setAdmitToIPModal] = useState(false);
  const [ipWard, setIpWard] = useState('');
  const [ipBedType, setIpBedType] = useState('');
  const [ipReason, setIpReason] = useState('');
  const [ipEstimatedStay, setIpEstimatedStay] = useState('');
  const [ipPriority, setIpPriority] = useState('Routine');
  const [ipBedTags, setIpBedTags] = useState([]);
  const [ipEstimatedDischargeDate, setIpEstimatedDischargeDate] = useState('');
  const [ipAdmitSuccess, setIpAdmitSuccess] = useState(false);
  const [alreadyAdmitted, setAlreadyAdmitted] = useState(false);

  const completed = activeQueueEntry?.status === 'Done';

  // BUG-02 fix: Track previous token with a ref so the form ONLY resets when the
  // active patient actually changes — not on every queue state update (e.g. vitals save).
  const lastTokenRef = useRef(null);

  useEffect(() => {
    const currentToken = activeQueueEntry?.token;
    if (currentToken && currentToken !== lastTokenRef.current) {
      // A genuinely new patient has been selected — safe to reset all form fields
      lastTokenRef.current = currentToken;
      setDiagnosis('');
      setPrescriptions([]);
      setCurrentRx({ ...emptyRx });
      setScan('');
      setScanNotes('');
      setSelectedLabs([]);
      setLabOther('');
      setNextVisitDate('');
      setNextVisitNotes('');
      setActiveTab('Diagnosis');
      // Reset IP admission state for new patient
      setVisitType('OP');
      setAlreadyAdmitted(false);
      setIpWard('');
      setIpBedType('');
      setIpReason('');
      setIpEstimatedStay('');
      setIpPriority('Routine');
      setIpBedTags([]);
      setIpEstimatedDischargeDate('');
    }
    if (!currentToken) {
      lastTokenRef.current = null;
    }
  }, [activeQueueEntry?.token]);

  // Drug-Allergy check on adding medicine
  const handleAddRx = () => {
    if (!currentRx.medicine) return;
    const patientAllergies = (patientRecord?.allergies || []).map(a => a.toLowerCase());
    const medLower = currentRx.medicine.toLowerCase();
    const isAllergyMatch = patientAllergies.some(a => medLower.includes(a) || a.includes(medLower));
    if (isAllergyMatch && !allergyConfirmed) {
      setAllergyAlertMed(currentRx.medicine);
      return;
    }
    setPrescriptions(prev => [...prev, currentRx]);
    setCurrentRx({ ...emptyRx });
    setMedSearch('');
    setAllergyAlertMed(null);
    setAllergyConfirmed(false);
  };
  const removeRx = (i) => setPrescriptions(prev => prev.filter((_, idx) => idx !== i));
  const updateCurrentRx = (field, value) => {
    if (field === 'type') {
      setMedSearch('');
    }
    if (field === 'medicine') {
      setMedSearch(value);
    }
    setCurrentRx(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'type' ? { medicine: '' } : {})
    }));
  };

  // Lab helpers
  const toggleLab = (test) => {
    setSelectedLabs(prev =>
      prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
    );
  };

  const handleSave = async () => {
    try {
      const consultationData = {
        patientId: activeQueueEntry?.patientId || '',
        patientName: activeQueueEntry?.patientName || '',
        token: activeQueueEntry?.token || '',
        doctorName: activeQueueEntry?.doctorName || '',
        department: patientRecord?.department || 'General',
        diagnosis: diagnosis,
        scanType: scan,
        scanNotes: scanNotes,
        labTests: (labOther ? [...selectedLabs, labOther] : selectedLabs),
        nextVisitDate: nextVisitDate,
        nextVisitNotes: nextVisitNotes,
        prescriptions: prescriptions.filter(r => r.medicine).map(r => ({
          type: r.type,
          medicine: r.medicine,
          dosage: r.dosage,
          frequency: r.frequency,
          duration: r.duration,
          instruction: r.instruction,
          timing: r.timing
        }))
      };

      if (consultationId) {
        consultationData.id = consultationId;
      }
      const savedRec = await addConsultation(consultationData);
      if (savedRec?.id) {
        setConsultationId(savedRec.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save consultation", err);
      setSaved(true); // still show success in offline mode
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleComplete = async (forceAdmit = false) => {
    if (visitType === 'IP' && !alreadyAdmitted && !forceAdmit) {
      addIpPatient({
        patientId: activeQueueEntry?.patientId || '',
        patientName: activeQueueEntry?.patientName || '',
        token: activeQueueEntry?.token || '',
        gender: activeQueueEntry?.gender || '',
        age: activeQueueEntry?.age || '',
        doctorName: activeQueueEntry?.doctorName || '',
        isUrgent: activeQueueEntry?.isUrgent || false,
        admittingDiagnosis: diagnosis || 'Awaiting diagnosis',
        diagnosis: diagnosis || 'Awaiting diagnosis',
        ward: '',
        bedType: '',
        priority: 'Routine',
        bedTags: '',
        estimatedDischargeDate: '',
        estimatedStay: '',
        admissionReason: 'General Admission',
        careLevel: 'General',
      });
      setAlreadyAdmitted(true);
      forceAdmit = true;
    }
    try {
      // Save consultation record first, then complete
      const consultationData = {
        patientId: activeQueueEntry?.patientId || '',
        patientName: activeQueueEntry?.patientName || '',
        token: activeQueueEntry?.token || '',
        doctorName: activeQueueEntry?.doctorName || '',
        department: patientRecord?.department || 'General',
        diagnosis: diagnosis,
        scanType: scan,
        scanNotes: scanNotes,
        labTests: labOther ? [...selectedLabs, labOther] : selectedLabs,
        nextVisitDate: nextVisitDate,
        nextVisitNotes: nextVisitNotes,
        prescriptions: prescriptions.filter(r => r.medicine).map(r => ({
          type: r.type,
          medicine: r.medicine,
          dosage: r.dosage,
          frequency: r.frequency,
          duration: r.duration,
          instruction: r.instruction,
          timing: r.timing
        }))
      };

      // Direct EMR Sync: Route prescriptions instantly to Pharmacy Queue!
      if (visitType === 'OP' && addPharmacyQueueItem && prescriptions.some(r => r.medicine)) {
        addPharmacyQueueItem({
          token: activeQueueEntry?.token || 'A-000',
          patientId: activeQueueEntry?.patientId || 'P-000000',
          patientName: activeQueueEntry?.patientName || 'Patient',
          age: activeQueueEntry?.age ? parseInt(activeQueueEntry.age) : 35,
          doctorName: activeQueueEntry?.doctorName || 'Dr. Kavitha Reddy',
          status: 'Ready to Dispense',
          allergies: patientRecord?.allergies || 'None Known',
          diagnosis: diagnosis || 'General Medical Consultation',
          items: prescriptions.filter(r => r.medicine).map(r => ({
            name: r.medicine,
            dosage: `${r.dosage || '1 Tab'} (${r.frequency || '1-0-1'} ${r.instruction === 'AF' ? 'after food' : r.instruction === 'BF' ? 'before food' : r.instruction || ''} ${r.timing || ''})`,
            days: r.duration || '5 days',
            price: 45
          })),
          totalAmount: 0
        });
      }

      try {
        // ── Save consultation to pastConsultations (and DB via AppContext) ──
        const savedRec = await addConsultation({
          id: consultationId || undefined,
          patientId: activeQueueEntry?.patientId || '',
          patientName: activeQueueEntry?.patientName || '',
          token: activeQueueEntry?.token || '',
          doctorName: activeQueueEntry?.doctorName || '',
          department: patientRecord?.department || 'General',
          diagnosis: diagnosis || '',
          scan: scan || '',
          scanNotes: scanNotes || '',
          labTests: labOther ? [...selectedLabs, labOther] : selectedLabs,
          nextVisitDate: nextVisitDate || '',
          nextVisitNotes: nextVisitNotes || '',
          vitals: activeQueueEntry?.vitals || {},
          chiefComplaint: activeQueueEntry?.chiefComplaint || '',
          prescriptions: prescriptions.filter(r => r.medicine).map(r => ({
            type: r.type,
            medicine: r.medicine,
            dosage: r.dosage,
            frequency: r.frequency,
            duration: r.duration,
            instruction: r.instruction,
            timing: r.timing,
          })),
        });

        // Complete via the consultation endpoint — this also flips nurse queue to Done in DB
        if (savedRec?.id) {
          if (forceAdmit) {
            try {
              const admission = await apiService.triggerInpatientAdmission({
                patientId: activeQueueEntry?.patientId || '',
                doctorId: activeQueueEntry?.doctorName || '',
                priority: ipReason.toLowerCase().includes('critical') ? 'CRITICAL' : 'GENERAL',
                specialty: ipWard,
                bedTags: ipBedType,
                diagnosis: diagnosis || 'General'
              });
              if (addAdmission && admission) {
                addAdmission(admission);
              }
              setIpAdmitSuccess(true);
              setTimeout(() => {
                setIpAdmitSuccess(false);
                setAdmitToIPModal(false);
              }, 2000);
            } catch (admitErr) {
              console.warn("Failed to create admission in new module, fallback only", admitErr);
              if (addAdmission) {
                addAdmission({
                  id: `ADM-LOCAL-${Date.now()}`,
                  patientId: activeQueueEntry?.patientId || '',
                  admittingDoctorId: activeQueueEntry?.doctorName || '',
                  acuityLevel: ipReason.toLowerCase().includes('critical') ? 'CRITICAL' : 'GENERAL',
                  admissionStatus: 'TRIAGE_PENDING',
                  admissionDate: new Date().toISOString()
                });
              }
            }
          }
          await apiService.completeConsultation(savedRec.id);
        }
      } catch (err) {
        console.warn('Consultation API failed (offline?), marking done locally.', err);
        if (forceAdmit && addAdmission) {
           addAdmission({
             id: `ADM-LOCAL-${Date.now()}`,
             patientId: activeQueueEntry?.patientId || '',
             admittingDoctorId: activeQueueEntry?.doctorName || '',
             acuityLevel: ipReason.toLowerCase().includes('critical') ? 'CRITICAL' : 'GENERAL',
             admissionStatus: 'TRIAGE_PENDING',
             admissionDate: new Date().toISOString()
           });
        }
      }

      // Always mark done in local state regardless of API success
      if (activeQueueEntry?.token) {
        await markPatientDone(activeQueueEntry.token);
      }
    } catch (err) {
      console.error("Failed to complete visit", err);
    }
  };

  const finalDiagnosis = diagnosis;
  const allLabs = labOther ? [...selectedLabs, labOther] : selectedLabs;

  const scanTypes = ['MRI', 'X-Ray', 'CT Scan', 'Ultrasound', 'PET Scan', 'Mammogram', 'Bone Scan', 'Echocardiography'];
  const commonFrequencies = ['1-0-0', '0-1-0', '0-0-1', '1-0-1', '1-1-1', '1-1-1-1', 'SOS (As needed)', 'Stat (Immediately)'];

  // Only patients that have been sent to doctor (sentToDoctor = true) and are not done yet show in selector
  const readyPatients = nurseQueue
    .filter(q => q.sentToDoctor && q.status !== 'Done' && q.status !== 'Visited' && q.status !== 'Completed')
    .sort((a, b) => (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0));

  if (!activeQueueEntry) {
    return (
      <div className={styles.page} style={{ padding: '28px 32px', overflowY: 'auto', background: '#f8fafc' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Consultation Queue</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Patients waiting for doctor consultation</p>
        </div>

        {readyPatients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 12, border: '1px dashed var(--border)' }}>
            <User size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <div style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 500 }}>No patients waiting in queue</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
              When nurses send patients from the Nurse Station, they will appear here.
            </div>
          </div>
        ) : (
          <div className={styles.queueGrid}>
            {readyPatients.map(q => {
              const p = patients.find(x => x.id === q.patientId);
              return (
                <div key={q.token} className={styles.queueCard} onClick={() => setSelectedConsultationToken(q.token)}>
                  <div className={styles.queueHeader}>
                    <div>
                      <div className={styles.queueName}>
                        {q.patientName}
                        {q.isUrgent && <span style={{ marginLeft: 6, fontSize: 10, color: '#ef4444', fontWeight: 'bold' }}>🔴 URGENT</span>}
                      </div>
                      <div className={styles.queueMeta}>
                        {p ? calcAge(p.dob) : (q.age ? `${q.age}Y` : '')}
                        {q.gender && ` • ${q.gender === 'M' ? 'Male' : q.gender === 'F' ? 'Female' : q.gender}`}
                        {' '}• ID: #{q.patientId}
                      </div>
                    </div>
                    <div className={styles.queueToken}>{q.token}</div>
                  </div>

                  <div className={styles.queueDetails}>
                    {q.chiefComplaint && (
                      <div className={styles.queueDetailRow}>
                        <div className={styles.queueDetailLabel}>Complaint:</div>
                        <div className={styles.queueDetailValue}>{q.chiefComplaint}</div>
                      </div>
                    )}
                    <div className={styles.queueDetailRow}>
                      <div className={styles.queueDetailLabel}>Vitals Taken:</div>
                      <div className={styles.queueDetailValue}>
                        {q.vitals && q.vitals.bp ? 'Yes' : 'No'}
                      </div>
                    </div>
                    {q.status === 'Done' && (
                      <div className={styles.queueDetailRow} style={{ marginTop: 8, color: 'var(--accent-green)', fontWeight: 600 }}>
                        <CheckCircle2 size={14} style={{ marginRight: 4, verticalAlign: '-2px' }} />
                        Consultation Completed
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const vitals = activeQueueEntry.vitals || {};

  return (
    <div className={styles.page}>
      {/* Patient Snapshot Bar with Back Button */}
      <div className={styles.snapshotBar}>
        <button 
          onClick={() => setSelectedConsultationToken(null)}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', padding: 8, marginRight: 10, color: 'var(--text-secondary)',
            borderRadius: '50%', transition: 'background 0.2s'
          }}
          title="Back to Queue"
        >
          <ArrowLeft size={20} />
        </button>

        <div className={styles.snapshotLeft}>
          <div className="avatar avatar-blue" style={{ width: 46, height: 46, fontSize: 15, flexShrink: 0 }}>
            {getInitials(activeQueueEntry.patientName)}
          </div>
          <div>
            <div className={styles.snapName}>
              {activeQueueEntry.patientName}
              {activeQueueEntry.isUrgent && <span style={{ marginLeft: 8, fontSize: 11, color: '#ef4444', fontWeight: 'bold', background: '#fee2e2', padding: '2px 6px', borderRadius: 12 }}>🔴 URGENT</span>}
            </div>
            <div className={styles.snapMeta}>
              {patientRecord ? calcAge(patientRecord.dob) : (activeQueueEntry.age ? `${activeQueueEntry.age}Y` : '')}
              {activeQueueEntry.gender && ` • ${activeQueueEntry.gender === 'M' ? 'Male' : activeQueueEntry.gender === 'F' ? 'Female' : activeQueueEntry.gender}`}
              {patientRecord?.bloodGroup && ` • ${patientRecord.bloodGroup}`}
              {' '}• ID: #{activeQueueEntry.patientId} • Token: {activeQueueEntry.token}
              {activeQueueEntry.chiefComplaint && (
                <> • <strong>CC:</strong> {activeQueueEntry.chiefComplaint}</>
              )}
            </div>
          </div>
        </div>
        <div className={styles.vitalsRow}>
          <VitalChip label="Heart Rate" value={vitals.pulse} unit="bpm" alert={vitals.pulse > 100} icon={Heart} />
          <VitalChip label="Blood Pressure" value={vitals.bp} unit="mmHg" alert={false} icon={Activity} />
          <VitalChip label="Temperature" value={vitals.temp} unit="°F" alert={false} icon={Thermometer} />
          <VitalChip label="SpO2" value={vitals.spo2 ? `${vitals.spo2}%` : ''} unit="" alert={false} icon={Wind} />
          <VitalChip label="Weight" value={vitals.weight} unit="kg" alert={false} icon={Scale} />
          <VitalChip label="BMI" value={vitals.weight && vitals.height ? (parseFloat(vitals.weight) / Math.pow(parseFloat(vitals.height) / 100, 2)).toFixed(1) : ''} unit="" alert={false} icon={User} />
        </div>
        {completed && (
          <span className={`badge badge-green`}>
            <CheckCircle2 size={12} /> Visit Complete
          </span>
        )}
      </div>

      {/* Nurse Notes Banner */}
      {activeQueueEntry.nurseNotes && (
        <div className={styles.nurseNotesBanner}>
          <strong>Nurse Notes:</strong> {activeQueueEntry.nurseNotes}
        </div>
      )}

      {/* Allergy Alert Banner */}
      {patientRecord?.allergies?.length > 0 && (
        <div style={{ background: '#fef2f2', borderBottom: '2px solid #fca5a5', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldAlert size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
          <div>
            <span style={{ fontWeight: 800, color: '#dc2626', fontSize: 13 }}>⚠️ ALLERGY ALERT: </span>
            <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>{patientRecord.allergies.join(' • ')}</span>
          </div>
        </div>
      )}

      {/* Main two-column layout */}
      <div className={styles.mainLayout}>
        {/* Left: Tabs */}
        <div className={styles.leftCol}>
          {/* Tab Bar */}
          <div className={styles.tabBar}>
            {TABS.map(tab => {
              const tabIcons = {
                'Diagnosis': Stethoscope,
                'Prescription': Pill,
                'SCAN': ImageIcon,
                'Lab Tests': TestTubes,
                'History': HistoryIcon,
                'Next Visit': Calendar
              };
              const Icon = tabIcons[tab];
              
              return (
                <button
                  key={tab}
                  className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab(tab)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {Icon && <Icon size={14} />}
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {/* Diagnosis */}
            {activeTab === 'Diagnosis' && (
              <div className={styles.tabPane}>
                <div className="form-group">
                  <label className="form-label">Diagnosis</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 70 }}
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    placeholder="Type diagnosis manually, e.g. Viral Fever, Hypertension Stage 2..."
                    disabled={completed}
                  />
                </div>
              </div>
            )}

            {/* Prescription */}
            {activeTab === 'Prescription' && (
              <div className={styles.tabPane}>
                <div className={styles.rxHeader}>
                  <span className={styles.rxTitle}>Add New Medication</span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Type:</div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {Object.keys(medicines).map(type => (
                      <button
                        key={type}
                        onClick={() => updateCurrentRx('type', type)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: `1px solid ${currentRx.type === type ? 'var(--primary)' : 'var(--border)'}`,
                          background: currentRx.type === type ? 'var(--primary-light)' : 'white',
                          color: currentRx.type === type ? 'var(--primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: 13
                        }}
                        disabled={completed}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '16px', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Select Medicine:</div>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="Search medicine..."
                      value={medSearch}
                      onChange={e => setMedSearch(e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '13px', width: '220px', height: '30px' }}
                      disabled={completed}
                    />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {medSearch.trim() !== '' && (medicines[currentRx.type] || [])
                      .filter(m => m.toLowerCase().includes(medSearch.toLowerCase()))
                      .map(med => (
                      <button
                        key={med}
                        onClick={() => updateCurrentRx('medicine', med)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: `1px solid ${currentRx.medicine === med ? 'var(--primary)' : 'var(--border)'}`,
                          background: currentRx.medicine === med ? 'var(--primary-light)' : 'white',
                          color: currentRx.medicine === med ? 'var(--primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: 13
                        }}
                        disabled={completed}
                      >
                        {med}
                      </button>
                    ))}
                    {medSearch.trim() !== '' && (medicines[currentRx.type] || []).filter(m => m.toLowerCase().includes(medSearch.toLowerCase())).length === 0 && (
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No medicines found matching "{medSearch}". You can enter custom medicine below.</div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Select Dosage & Frequency:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {(currentRx.type === 'Syrup' ? ['2.5ml', '5ml', '7.5ml', '10ml', '15ml'] :
                      currentRx.type === 'Drops' ? ['1 Drop', '2 Drops', '3 Drops', '4 Drops'] :
                      currentRx.type === 'Injection' ? ['1 ml', '2 ml', '3 ml', '1 Ampoule'] :
                      currentRx.type === 'Ointment' ? ['Apply Locally', 'Thin Layer'] :
                      currentRx.type === 'Tablet' ? ['1/2 Tab', '1 Tab', '2 Tabs'] :
                      currentRx.type === 'Capsule' ? ['1 Cap', '2 Caps'] :
                      []).map(dos => (
                      <button
                        key={dos}
                        onClick={() => updateCurrentRx('dosage', dos)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: `1px solid ${currentRx.dosage === dos ? 'var(--primary)' : 'var(--border)'}`,
                          background: currentRx.dosage === dos ? 'var(--primary-light)' : 'white',
                          color: currentRx.dosage === dos ? 'var(--primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: 13
                        }}
                        disabled={completed}
                      >
                        {dos}
                      </button>
                    ))}
                    <input 
                      type="text"
                      className="form-input"
                      value={currentRx.dosage}
                      onChange={e => updateCurrentRx('dosage', e.target.value)}
                      placeholder="Or enter manually..."
                      style={{ padding: '6px 10px', borderRadius: '20px', fontSize: '13px', width: '150px', height: '32px' }}
                      disabled={completed}
                    />
                    
                    <div style={{ width: '1px', height: '20px', background: '#cbd5e1', margin: '0 4px' }} />

                    {commonFrequencies.map(freq => {
                      const fVal = freq.split(' ')[0];
                      return (
                        <button
                          key={freq}
                          onClick={() => updateCurrentRx('frequency', fVal)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: `1px solid ${currentRx.frequency === fVal ? 'var(--primary)' : 'var(--border)'}`,
                            background: currentRx.frequency === fVal ? 'var(--primary-light)' : 'white',
                            color: currentRx.frequency === fVal ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: 13
                          }}
                          disabled={completed}
                        >
                          {freq}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Select Instruction:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(
                      ['Ointment'].includes(currentRx.type) ? [
                        { label: 'Apply Locally', val: 'Apply Locally' },
                        { label: 'External Use Only', val: 'External Use Only' },
                        { label: 'Apply at Night', val: 'Apply at Night' }
                      ] :
                      ['Drops'].includes(currentRx.type) ? [
                        { label: 'Right Eye (RE)', val: 'RE' },
                        { label: 'Left Eye (LE)', val: 'LE' },
                        { label: 'Both Eyes (BE)', val: 'BE' },
                        { label: 'In Ear', val: 'In Ear' }
                      ] :
                      ['Injection'].includes(currentRx.type) ? [
                        { label: 'IM (Intramuscular)', val: 'IM' },
                        { label: 'IV (Intravenous)', val: 'IV' },
                        { label: 'SC (Subcutaneous)', val: 'SC' }
                      ] :
                      // Default for Tablet, Capsule, Syrup
                      [
                        { label: 'After Food (AF)', val: 'AF' },
                        { label: 'Before Food (BF)', val: 'BF' },
                        { label: 'With Food', val: 'With Food' }
                      ]
                    ).map(inst => (
                      <button
                        key={inst.val}
                        onClick={() => updateCurrentRx('instruction', inst.val)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: `1px solid ${currentRx.instruction === inst.val ? 'var(--primary)' : 'var(--border)'}`,
                          background: currentRx.instruction === inst.val ? 'var(--primary-light)' : 'white',
                          color: currentRx.instruction === inst.val ? 'var(--primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: 13
                        }}
                        disabled={completed}
                      >
                        {inst.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Timing:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {['Morning', 'Afternoon', 'Night', 'Before Sleep'].map(t => (
                      <button
                        key={t}
                        onClick={() => updateCurrentRx('timing', t)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: `1px solid ${currentRx.timing === t ? 'var(--primary)' : 'var(--border)'}`,
                          background: currentRx.timing === t ? 'var(--primary-light)' : 'white',
                          color: currentRx.timing === t ? 'var(--primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: 13
                        }}
                        disabled={completed}
                      >
                        {t}
                      </button>
                    ))}
                    <input 
                      type="text"
                      className="form-input"
                      value={currentRx.timing}
                      onChange={e => updateCurrentRx('timing', e.target.value)}
                      placeholder="Or enter manually..."
                      style={{ padding: '6px 10px', borderRadius: '20px', fontSize: '13px', width: '180px', height: '32px' }}
                      disabled={completed}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Duration:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {['1 Day', '3 Days', '5 Days', '1 Week', '2 Weeks', '1 Month'].map(d => (
                      <button
                        key={d}
                        onClick={() => updateCurrentRx('duration', d)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: `1px solid ${currentRx.duration === d ? 'var(--primary)' : 'var(--border)'}`,
                          background: currentRx.duration === d ? 'var(--primary-light)' : 'white',
                          color: currentRx.duration === d ? 'var(--primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: 13
                        }}
                        disabled={completed}
                      >
                        {d}
                      </button>
                    ))}
                    <input 
                      type="text"
                      className="form-input"
                      value={currentRx.duration}
                      onChange={e => updateCurrentRx('duration', e.target.value)}
                      placeholder="Or enter manually..."
                      style={{ padding: '6px 10px', borderRadius: '20px', fontSize: '13px', width: '150px', height: '32px' }}
                      disabled={completed}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 24, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '12px 24px', fontSize: 15, fontWeight: 600, borderRadius: 8, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={handleAddRx}
                    disabled={completed || !currentRx.medicine}
                  >
                    <Plus size={18} style={{ marginRight: 8 }} /> Add Medicine to Prescription
                  </button>
                </div>

                {prescriptions.length > 0 && (
                  <div className={styles.savedRxContainer}>
                    <div className={styles.rxTitle} style={{ fontSize: 13, marginBottom: 10, color: 'var(--text-secondary)' }}>Saved Prescriptions ({prescriptions.length})</div>
                    <div className={styles.rxTable}>
                      {prescriptions.map((rx, i) => (
                        <div key={i} className={styles.rxRow} style={{ gridTemplateColumns: '90px 1fr 80px 80px 80px 70px 90px 40px' }}>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{rx.type}</div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rx.medicine}</div>
                          <div style={{ fontSize: 13 }}>{rx.dosage || '-'}</div>
                          <div style={{ fontSize: 13 }}>{rx.frequency || '-'}</div>
                          <div style={{ fontSize: 13 }}>{rx.duration || '-'}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{rx.instruction || '-'}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{rx.timing || '-'}</div>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => removeRx(i)}
                            disabled={completed}
                            title="Remove from list"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SCAN */}
            {activeTab === 'SCAN' && (
              <div className={styles.tabPane}>
                <div className="form-group">
                  <label className="form-label">Scan Type</label>
                  <select className="form-select" value={scan} onChange={e => setScan(e.target.value)}>
                    <option value="">Select imaging type...</option>
                    {scanTypes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label className="form-label">Scan Instructions / Notes</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 70 }}
                    value={scanNotes}
                    onChange={e => setScanNotes(e.target.value)}
                    placeholder="Specify region, urgency, or special instructions..."
                  />
                </div>
              </div>
            )}

            {/* Lab Tests */}
            {activeTab === 'Lab Tests' && (
              <div className={styles.tabPane}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ marginBottom: 12 }}>Select Recommended Lab Tests</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {labTestsGroups.map(group => (
                      <div key={group.category} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ background: 'var(--bg-light)', padding: '8px 12px', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                          {group.category}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, padding: 12 }}>
                          {group.tests.map(test => (
                            <label key={test} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={selectedLabs.includes(test)}
                                onChange={() => toggleLab(test)}
                                disabled={completed}
                                style={{ accentColor: 'var(--primary)', width: 14, height: 14 }}
                              />
                              <span style={{ color: selectedLabs.includes(test) ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: selectedLabs.includes(test) ? 600 : 400 }}>
                                {test}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label className="form-label">Other / Custom Test</label>
                  <input
                    className="form-input"
                    value={labOther}
                    onChange={e => setLabOther(e.target.value)}
                    placeholder="Specify any other test..."
                  />
                </div>
              </div>
            )}

            {/* History */}
            {activeTab === 'History' && (
              <div className={styles.tabPane}>
                <div className={styles.rxHeader} style={{ marginBottom: 16 }}>
                  <span className={styles.rxTitle}>Patient Medical History</span>
                </div>
                
                {patientRecord ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 16, borderRadius: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={14} /> Allergies
                      </div>
                      <div style={{ fontSize: 14, color: '#7f1d1d' }}>
                        {patientRecord.allergies && patientRecord.allergies.length > 0 
                          ? patientRecord.allergies.join(', ') 
                          : 'No known allergies reported.'}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: 16, borderRadius: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Activity size={14} /> Chronic Conditions
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                        {patientRecord.conditions || 'No chronic conditions reported.'}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: 16, borderRadius: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <HistoryIcon size={14} /> Previous Visits
                      </div>
                      
                      {patientHistory.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {patientHistory.map(visit => (
                            <div key={visit.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-dark)' }}>{visit.date}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-light)', padding: '2px 8px', borderRadius: 4 }}>{visit.department}</div>
                              </div>
                              <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
                                <span style={{ fontWeight: 600 }}>Doctor:</span> {visit.doctorName}
                              </div>
                              <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
                                <span style={{ fontWeight: 600 }}>Diagnosis:</span> {visit.diagnosis}
                              </div>
                              {visit.prescriptions?.length > 0 && (
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Prescriptions:</div>
                                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                                    {visit.prescriptions.map((rx, idx) => (
                                      <li key={idx}>{rx.medicine} {rx.dosage} ({rx.frequency})</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          No past consultation records found.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                    No historical patient record found.
                  </div>
                )}
              </div>
            )}

            {/* Next Visit */}
            {activeTab === 'Next Visit' && (
              <div className={styles.tabPane}>
                <div className="form-group">
                  <label className="form-label">Follow-up Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={nextVisitDate}
                    onChange={e => setNextVisitDate(e.target.value)}
                    style={{ maxWidth: 220 }}
                  />
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label className="form-label">Instructions for Patient</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 70 }}
                    value={nextVisitNotes}
                    onChange={e => setNextVisitNotes(e.target.value)}
                    placeholder="e.g., Come back after blood tests. Check BP daily."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Summary */}
        <div className={styles.rightCol}>
          <div className={styles.summaryHeader}>
            <FileText size={16} />
            <span>Visit Summary</span>
          </div>

          <div className={styles.summaryBody}>
            <div className={styles.summarySection}>
              <div className={styles.summaryLabel}>Diagnosis</div>
              <div className={styles.summaryValue}>
                {finalDiagnosis || <span className={styles.summaryEmpty}>Not set</span>}
                {!finalDiagnosis && diagnosis !== 'Other' && (
                  <span className={styles.pendingTag}> (Pending confirm)</span>
                )}
              </div>
            </div>

            <div className={styles.summarySection}>
              <div className={styles.summaryLabel}>Prescriptions ({prescriptions.filter(r => r.medicine).length})</div>
              {prescriptions.filter(r => r.medicine).length === 0 ? (
                <div className={styles.summaryEmpty}>No prescriptions added.</div>
              ) : (
                <ul className={styles.summaryList}>
                  {prescriptions.filter(r => r.medicine).map((rx, i) => (
                    <li key={i}>
                      {rx.medicine}
                      {rx.dosage && ` - ${rx.dosage}`}
                      {rx.frequency && `, ${rx.frequency}`}
                      {rx.timing && ` (${rx.timing})`}
                      {rx.instruction && ` [${rx.instruction}]`}
                      {rx.duration && `, ${rx.duration}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.summarySection}>
              <div className={styles.summaryLabel}>SCAN</div>
              <div className={styles.summaryValue}>
                {scan ? (
                  <>
                    <strong>{scan}</strong>
                    {scanNotes && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{scanNotes}</div>}
                  </>
                ) : <span className={styles.summaryEmpty}>No scan ordered.</span>}
              </div>
            </div>

            <div className={styles.summarySection}>
              <div className={styles.summaryLabel}>Lab Tests</div>
              {allLabs.length === 0 ? (
                <div className={styles.summaryEmpty}>No tests ordered.</div>
              ) : (
                <ul className={styles.summaryList}>
                  {allLabs.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              )}
            </div>

            <div className={styles.summarySection}>
              <div className={styles.summaryLabel}>Next Visit</div>
              <div className={styles.summaryValue}>
                {nextVisitDate ? (
                  <>
                    <strong>{new Date(nextVisitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                    {nextVisitNotes && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{nextVisitNotes}</div>}
                  </>
                ) : <span className={styles.summaryEmpty}>Not scheduled.</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refer to Specialist Modal */}
      {referModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: 14, padding: 28, width: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Send size={16} style={{ color: 'var(--primary)' }} />
              Refer to Specialist
            </div>
            <div className="form-group">
              <label className="form-label">Specialist / Department</label>
              <select className="form-select" value={referSpecialist} onChange={e => setReferSpecialist(e.target.value)}>
                <option value="">Select department...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Reason for Referral</label>
              <textarea className="form-textarea" style={{ minHeight: 80 }}
                value={referReason} onChange={e => setReferReason(e.target.value)}
                placeholder="Clinical reason, urgency, specific tests needed..."
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => { setReferModal(false); setReferSpecialist(''); setReferReason(''); }}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!referSpecialist}
                onClick={() => {
                  // Persist referral to patient history
                  const newReferral = {
                    specialist: referSpecialist,
                    reason: referReason,
                    date: new Date().toLocaleDateString('en-IN'),
                    patientName: activeQueueEntry?.patientName,
                  };
                  setSavedReferrals(prev => [...prev, newReferral]);
                  setReferModal(false);
                  setReferSent(true);
                  setReferSpecialist('');
                  setReferReason('');
                  setTimeout(() => setReferSent(false), 4000);
                }}
              >
                <Send size={13} /> Send Referral
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className={styles.footerBar}>
        {saved && <span className={styles.savedMsg}>✓ Consultation saved</span>}
        {referSent && <span className={styles.savedMsg} style={{ color: 'var(--primary)' }}>✓ Referral sent to {savedReferrals[savedReferrals.length-1]?.specialist}</span>}
        {ipAdmitSuccess && <span className={styles.savedMsg} style={{ color: '#16a34a' }}>✓ Patient admitted to IP Ward</span>}
        <button className="btn btn-ghost" style={{ color: 'var(--primary)' }} onClick={() => setReferModal(true)}>
          <Send size={14} /> Refer to Specialist
        </button>
        {prescriptions.length > 0 && (
          <button className="btn btn-outline" style={{ color: '#7c3aed', borderColor: '#7c3aed' }} onClick={() => setShowPrintModal(true)}>
            <Printer size={14} /> Print Prescription
          </button>
        )}
        <button className="btn btn-outline" onClick={handleSave}>Save Consultation</button>
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 4 }}>
          <button
            className={`btn ${visitType === 'OP' ? 'btn-primary' : ''}`}
            style={{
              background: visitType === 'OP' ? 'var(--primary)' : 'transparent',
              color: visitType === 'OP' ? 'white' : 'var(--text-secondary)',
              border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600
            }}
            onClick={() => setVisitType('OP')}
            disabled={completed || alreadyAdmitted}
          >
            OP
          </button>
          <button
            className={`btn ${visitType === 'IP' ? 'btn-primary' : ''}`}
            style={{
              background: visitType === 'IP' ? '#0891b2' : 'transparent',
              color: visitType === 'IP' ? 'white' : 'var(--text-secondary)',
              border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600
            }}
            onClick={() => setVisitType('IP')}
            disabled={alreadyAdmitted}
          >
            IP
          </button>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => handleComplete(false)}
          disabled={(completed && visitType === 'OP') || (visitType === 'IP' && alreadyAdmitted)}
          style={{ background: (completed && visitType === 'OP') ? '#10b981' : (visitType === 'IP' ? '#0891b2' : '') }}
        >
          {visitType === 'IP' 
            ? (alreadyAdmitted ? '✓ Admitted to IP' : 'Admit to IP') 
            : (completed ? '✓ Visit Completed' : 'Complete Visit')}
        </button>
      </div>

      {/* Drug-Allergy Confirmation Modal */}
      {allergyAlertMed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 28, width: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <ShieldAlert size={28} style={{ color: '#dc2626', flexShrink: 0 }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>⚠️ ALLERGY ALERT</div>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: '#7f1d1d', fontWeight: 600, marginBottom: 6 }}>Patient Allergies on Record:</div>
              <div style={{ fontSize: 13, color: '#991b1b' }}>{(patientRecord?.allergies || []).join(', ')}</div>
            </div>
            <div style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>
              You are prescribing <strong style={{ color: '#dc2626' }}>«{allergyAlertMed}»</strong> which may conflict with a known patient allergy. This could be dangerous.
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20, fontSize: 13, color: '#374151', fontWeight: 500 }}>
              <input type="checkbox" checked={allergyConfirmed} onChange={e => setAllergyConfirmed(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: '#dc2626' }} />
              I am aware of the allergy and confirm this medicine is intentionally prescribed. I take clinical responsibility for this decision.
            </label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => { setAllergyAlertMed(null); setAllergyConfirmed(false); }}>Cancel</button>
              <button
                style={{ background: allergyConfirmed ? '#dc2626' : '#e5e7eb', color: allergyConfirmed ? 'white' : '#9ca3af', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: allergyConfirmed ? 'pointer' : 'not-allowed', fontSize: 14 }}
                disabled={!allergyConfirmed}
                onClick={() => { handleAddRx(); setAllergyAlertMed(null); }}
              >
                Override & Add Medicine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admit to IP Modal — Enhanced */}
      {admitToIPModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: 'white', borderRadius: 18, width: 540, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BedDouble size={18} style={{ color: '#0891b2' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Admit Patient to IP Ward</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Generate inpatient admission order</div>
                </div>
              </div>
              <button onClick={() => setAdmitToIPModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', borderRadius: 8, padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Patient Context Banner */}
            <div style={{ padding: '14px 24px 0' }}>
              <div style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '1px solid #bae6fd', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#0891b2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                  {activeQueueEntry?.patientName?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{activeQueueEntry?.patientName}</div>
                  <div style={{ fontSize: 12, color: '#0369a1', marginTop: 1 }}>UHID: #{activeQueueEntry?.patientId} &nbsp;•&nbsp; Token: {activeQueueEntry?.token} &nbsp;•&nbsp; {activeQueueEntry?.gender === 'M' ? 'Male' : activeQueueEntry?.gender === 'F' ? 'Female' : ''}</div>
                </div>
                {activeQueueEntry?.isUrgent && (
                  <span style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>🔴 URGENT</span>
                )}
              </div>
              {/* Auto-populated Admitting Diagnosis */}
              {diagnosis && (
                <div style={{ marginTop: 10, background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: '#475569' }}>Admitting Diagnosis (ICD): </span>
                  <span style={{ color: '#0f172a' }}>{diagnosis}</span>
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#94a3b8' }}>(auto-populated from consultation)</span>
                </div>
              )}
            </div>

            {/* Form Body */}
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

              {/* Priority Level */}
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: 8 }}>
                  Admission Priority <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { val: 'Routine', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: '📋 Routine' },
                    { val: 'Urgent', color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: '⚡ Urgent' },
                    { val: 'Emergency', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: '🚨 Emergency' },
                  ].map(p => (
                    <button
                      key={p.val}
                      onClick={() => setIpPriority(p.val)}
                      style={{
                        flex: 1, padding: '10px 8px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                        border: `2px solid ${ipPriority === p.val ? p.color : '#e2e8f0'}`,
                        background: ipPriority === p.val ? p.bg : 'white',
                        color: ipPriority === p.val ? p.color : '#64748b',
                        transition: 'all 0.15s',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ward / Unit */}
              <div className="form-group">
                <label className="form-label">Ward / Unit <span style={{ color: '#dc2626' }}>*</span></label>
                <select className="form-select" value={ipWard} onChange={e => setIpWard(e.target.value)}>
                  <option value="">Select admitting ward...</option>
                  {['General Ward', 'ICU', 'Surgical Ward', 'Maternity Ward', 'Pediatric Ward', 'Cardiac ICU', 'Orthopedic Ward', 'Neurology Ward', 'Oncology Ward', 'High Dependency Unit (HDU)'].map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              {/* Bed Preference */}
              <div className="form-group">
                <label className="form-label">Preferred Bed Type</label>
                <select className="form-select" value={ipBedType} onChange={e => setIpBedType(e.target.value)}>
                  <option value="">Select bed type...</option>
                  {['General Bed', 'Semi-Private Room', 'Private Room', 'Deluxe Suite', 'ICU Bed', 'ICU Ventilator Bed', 'HDU Bed'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Bed Requirement Tags */}
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: 8 }}>
                  Bed Requirement Tags
                  <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 11, marginLeft: 8 }}>Select all that apply</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { key: 'oxygen', label: '💧 Oxygen Support' },
                    { key: 'ventilator', label: '🌀 Ventilator' },
                    { key: 'isolation', label: '🛡️ Isolation Protocol' },
                    { key: 'fallRisk', label: '⚠️ Fall Risk' },
                    { key: 'monitor', label: '📊 Cardiac Monitor' },
                    { key: 'cardiac', label: '❤️ ECG / Telemetry' },
                  ].map(tag => {
                    const active = ipBedTags.includes(tag.key);
                    return (
                      <button
                        key={tag.key}
                        onClick={() => setIpBedTags(prev => active ? prev.filter(t => t !== tag.key) : [...prev, tag.key])}
                        style={{
                          padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          border: `1.5px solid ${active ? '#0891b2' : '#e2e8f0'}`,
                          background: active ? '#f0f9ff' : 'white',
                          color: active ? '#0891b2' : '#64748b',
                          transition: 'all 0.15s',
                        }}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimated Discharge Date */}
              <div className="form-group">
                <label className="form-label">Estimated Discharge Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={ipEstimatedDischargeDate}
                  onChange={e => setIpEstimatedDischargeDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ maxWidth: 220 }}
                />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Feeds capacity management forecasting</div>
              </div>

              {/* Clinical Reason */}
              <div className="form-group">
                <label className="form-label">Clinical Reason for Admission <span style={{ color: '#dc2626' }}>*</span></label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 72 }}
                  value={ipReason}
                  onChange={e => setIpReason(e.target.value)}
                  placeholder="Describe the clinical condition requiring inpatient monitoring, surgery, or continuous care..."
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderTop: '1px solid #f1f5f9', flexShrink: 0, background: '#fafafa', borderRadius: '0 0 18px 18px' }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {ipBedTags.length > 0 && <span>🏷️ {ipBedTags.length} tag(s) set</span>}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" onClick={() => setAdmitToIPModal(false)}>Cancel</button>
                <button
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: (ipWard && ipReason) ? (ipPriority === 'Emergency' ? '#dc2626' : ipPriority === 'Urgent' ? '#d97706' : '#0891b2') : '#e2e8f0',
                    color: (ipWard && ipReason) ? 'white' : '#94a3b8',
                    border: 'none', borderRadius: 10, padding: '11px 22px',
                    fontWeight: 700, fontSize: 14, cursor: (ipWard && ipReason) ? 'pointer' : 'not-allowed',
                    transition: 'background 0.15s',
                  }}
                  disabled={!ipWard || !ipReason}
                  onClick={() => {
                    if (!ipWard || !ipReason) return;
                    addIpPatient({
                      patientId: activeQueueEntry?.patientId || '',
                      patientName: activeQueueEntry?.patientName || '',
                      token: activeQueueEntry?.token || '',
                      gender: activeQueueEntry?.gender || '',
                      age: activeQueueEntry?.age || '',
                      doctorName: activeQueueEntry?.doctorName || '',
                      isUrgent: activeQueueEntry?.isUrgent || ipPriority === 'Emergency',
                      // Clinical fields
                      admittingDiagnosis: diagnosis || 'Awaiting diagnosis',
                      diagnosis: diagnosis || 'Awaiting diagnosis',
                      // Spatial preferences
                      ward: ipWard,
                      bedType: ipBedType,
                      // Structured admission payload
                      priority: ipPriority,
                      bedTags: ipBedTags.join(','),
                      estimatedDischargeDate: ipEstimatedDischargeDate,
                      estimatedStay: ipEstimatedStay,
                      admissionReason: ipReason,
                      careLevel: ipPriority === 'Emergency' ? 'Critical / ICU' : ipPriority === 'Urgent' ? 'High Dependency (HDU)' : 'General',
                    });
                    setAdmitToIPModal(false);
                    setAlreadyAdmitted(true);
                    setIpAdmitSuccess(true);
                    setTimeout(() => setIpAdmitSuccess(false), 3000);
                    handleComplete(true);
                  }}
                >
                  <BedDouble size={16} />
                  {ipPriority === 'Emergency' ? '🚨 Emergency Admit' : ipPriority === 'Urgent' ? '⚡ Urgent Admit' : 'Confirm Admission'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Print Prescription Modal */}
      {showPrintModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div id="print-prescription" style={{ background: 'white', borderRadius: 14, padding: 0, width: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Prescription Slip</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => window.print()} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Printer size={15} /> Print
                </button>
                <button onClick={() => setShowPrintModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
            </div>
            <div className="print-area" style={{ padding: 28 }}>
              {/* Clinic Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: 14, marginBottom: 18 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a' }}>🏥 {clinicInfo?.name || 'Hospital Name'}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>{clinicInfo?.address || 'Address'} | {clinicInfo?.phone || 'Phone'}</div>
              </div>
              {/* Doctor & Patient Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: 4 }}>Doctor</div>
                  <div>{activeQueueEntry?.doctorName || 'Dr. —'}</div>
                </div>
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: 4 }}>Patient</div>
                  <div>{activeQueueEntry?.patientName} #{activeQueueEntry?.patientId}</div>
                  <div>{patientRecord ? calcAge(patientRecord.dob) : ''} | {patientRecord?.bloodGroup || ''}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} | Token: {activeQueueEntry?.token}</div>
              {/* Diagnosis */}
              {diagnosis && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#0369a1', marginBottom: 4 }}>DIAGNOSIS</div>
                  <div style={{ fontSize: 14, color: '#0f172a' }}>{diagnosis}</div>
                </div>
              )}
              {/* Medicines */}
              <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>Rx — PRESCRIPTIONS</div>
              {prescriptions.filter(r => r.medicine).map((rx, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px dashed #e2e8f0', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#1e3a8a', minWidth: 24 }}>{i + 1}.</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{rx.medicine} <span style={{ fontWeight: 400, fontSize: 12, color: '#64748b' }}>({rx.type})</span></div>
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 3 }}>
                      {rx.dosage} — {rx.frequency} — {rx.instruction === 'AF' ? 'After Food' : rx.instruction === 'BF' ? 'Before Food' : rx.instruction}
                      {rx.timing && ` | ${rx.timing}`}
                      {rx.duration && ` | Duration: ${rx.duration}`}
                    </div>
                  </div>
                </div>
              ))}
              {/* Footer */}
              <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                <div>Next Visit: {nextVisitDate ? new Date(nextVisitDate).toLocaleDateString('en-IN') : 'As needed'}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ borderTop: '1px solid #374151', paddingTop: 4, marginTop: 20, color: '#374151', fontWeight: 600 }}>Doctor's Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
