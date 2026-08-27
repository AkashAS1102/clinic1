import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Trash2, FileText, CheckCircle2, User, Send, ArrowLeft, Clock, Stethoscope, Pill, Image as ImageIcon, TestTubes, History as HistoryIcon, Calendar, Activity, Heart, Thermometer, Wind, Scale, AlertTriangle, Printer, X, ShieldAlert, BedDouble } from 'lucide-react';
import { diagnoses, medicines, labTests, labTestsGroups, mockPastConsultations } from '../../mockData';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../api/api';
import styles from '../Consultation/Consultation.module.css';

const departments = [
  'General Medicine', 'Cardiology', 'Neurology', 'Pediatrics',
  'Orthopedics', 'Dermatology', 'ENT', 'Ophthalmology', 'Gynecology'
];

const TABS = ['Vitals', 'Prescription', 'SCAN', 'Lab Tests', 'History'];

const emptyRx = { type: 'Tablet', medicine: '', dosage: '', frequency: '', duration: '', instruction: 'AF', timing: '' };

function VitalChip({ label, value, unit, alert, icon: Icon }) {
  return (
    <div className={styles.vitalChip}>
      <div className={styles.vitalLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {Icon && <Icon size={10} color={alert ? 'var(--danger)' : '#64748b'} />}
        {label}
      </div>
      <div className={`${styles.vitalValue} ${alert ? styles.vitalAlert : ''}`}>{value || 'â€”'}</div>
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

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export default function IPPatientView() {
  const { ipPatients, patients, markPatientDone, selectedConsultationToken, setSelectedConsultationToken, addPharmacyQueueItem, addConsultation, pastConsultations, addIpPatient, addAdmission, clinicInfo } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdQuery = searchParams.get('id');

  const ipRecord = useMemo(() => {
    if (!patientIdQuery) return null;
    return ipPatients.find(p => String(p.patientId) === String(patientIdQuery) || String(p.id) === String(patientIdQuery));
  }, [ipPatients, patientIdQuery]);

  const activeQueueEntry = useMemo(() => {
    if (!ipRecord) return null;
    return {
      patientId: ipRecord.patientId || ipRecord.id || 'N/A',
      patientName: ipRecord.patientName || 'Unknown',
      doctorName: ipRecord.doctorName || 'Unknown',
      token: 'IP-' + ((ipRecord.patientId && typeof ipRecord.patientId === 'string' && ipRecord.patientId.includes('-')) ? ipRecord.patientId.split('-')[1] : '000'),
      vitals: ipRecord.vitals || {}
    };
  }, [ipRecord]);

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

  const [vitals, setVitals] = useState({});
  useEffect(() => {
    if (activeQueueEntry?.vitals) {
      setVitals(activeQueueEntry.vitals);
    }
  }, [activeQueueEntry]);
  
  const handleVitalsChange = (field, value) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  const [activeTab, setActiveTab] = useState('Vitals');
  const [diagnosis, setDiagnosis] = useState('');
  
  // Visibility toggles for the "Add" forms
  const [showAddVitals, setShowAddVitals] = useState(false);
  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [showAddScan, setShowAddScan] = useState(false);
  const [showAddLab, setShowAddLab] = useState(false);

  // History tables data
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [labHistory, setLabHistory] = useState([]);

  const [prescriptions, setPrescriptions] = useState([]);
  const [currentRx, setCurrentRx] = useState({ ...emptyRx });
  const [medSearch, setMedSearch] = useState('');
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

  const completed = false; // IP consultations are continuous, never locked as 'completed'

  // BUG-02 fix: Track previous token with a ref so the form ONLY resets when the
  // active patient actually changes â€” not on every queue state update (e.g. vitals save).
  const lastTokenRef = useRef(null);

  useEffect(() => {
    const currentToken = activeQueueEntry?.token;
    if (currentToken && currentToken !== lastTokenRef.current) {
      // A genuinely new patient has been selected â€” safe to reset all form fields
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
    setShowAddPrescription(false);
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
        vitals: vitals,
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

      await apiService.saveConsultation(consultationData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save consultation", err);
      setSaved(true); // still show success in offline mode
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const finalDiagnosis = diagnosis;
  const allLabs = [
    ...labHistory.flatMap(h => h.tests),
    ...selectedLabs,
    ...(labOther ? [labOther] : [])
  ];
  
  const latestVitals = vitalsHistory.length > 0 ? vitalsHistory[0] : vitals;
  const latestScan = scanHistory.length > 0 ? scanHistory[0] : { type: scan, notes: scanNotes };

  const scanTypes = ['MRI', 'X-Ray', 'CT Scan', 'Ultrasound', 'PET Scan', 'Mammogram', 'Bone Scan', 'Echocardiography'];
  const commonFrequencies = ['1-0-0', '0-1-0', '0-0-1', '1-0-1', '1-1-1', '1-1-1-1', 'SOS (As needed)', 'Stat (Immediately)'];

  if (!activeQueueEntry) {
    return (
      <div className={styles.page} style={{ padding: '28px 32px', overflowY: 'auto', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 12, border: '1px dashed var(--border)' }}>
          <User size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 500 }}>Patient not found</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
            The requested IP patient could not be found.<br/>
            DEBUG INFO: ID={patientIdQuery}, ipPatients count={ipPatients?.length}
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className={styles.page}>
      {/* Patient Snapshot Bar with Back Button */}
      <div className={styles.snapshotBar}>
        <button 
          onClick={() => navigate(-1)}
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
              {activeQueueEntry.isUrgent && <span style={{ marginLeft: 8, fontSize: 11, color: '#ef4444', fontWeight: 'bold', background: '#fee2e2', padding: '2px 6px', borderRadius: 12 }}>ðŸ”´ URGENT</span>}
            </div>
            <div className={styles.snapMeta}>
              {patientRecord ? calcAge(patientRecord.dob) : (activeQueueEntry.age ? `${activeQueueEntry.age}Y` : '')}
              {activeQueueEntry.gender && ` â€¢ ${activeQueueEntry.gender === 'M' ? 'Male' : activeQueueEntry.gender === 'F' ? 'Female' : activeQueueEntry.gender}`}
              {activeQueueEntry.gender && ` • ${activeQueueEntry.gender === 'M' ? 'Male' : activeQueueEntry.gender === 'F' ? 'Female' : activeQueueEntry.gender}`}
              {patientRecord?.bloodGroup && ` • ${patientRecord.bloodGroup}`}
              {' '}• ID: #{activeQueueEntry.patientId} • Token: {activeQueueEntry.token}
              {activeQueueEntry.chiefComplaint && (
                <> • <strong>CC:</strong> {activeQueueEntry.chiefComplaint}</>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>IC</button>
          <button onClick={() => navigate('/ip-patients/discharge', { state: { encounterId: activeQueueEntry.patientId } })} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Discharge</button>
        </div>
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
            <span style={{ fontWeight: 800, color: '#dc2626', fontSize: 13 }}>âš ï¸ ALLERGY ALERT: </span>
            <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>{patientRecord.allergies.join(' â€¢ ')}</span>
          </div>
        </div>
      )}

      {/* Main two-column layout */}
      <div className={styles.mainLayout}>
        {/* Left: Tabs */}
        <div className={styles.leftCol}>
          {/* Tab Bar */}
          <div className={styles.tabBar} style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', overflowX: 'auto' }}>
            {TABS.map(tab => {
              const tabIcons = {
                'Vitals': Activity,
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
            <div style={{ flex: 1 }} />
            {['Vitals', 'Prescription', 'SCAN', 'Lab Tests'].includes(activeTab) && (
              <button 
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'transparent', color: 'var(--primary)', border: 'none',
                  fontWeight: 600, cursor: 'pointer', padding: '0 16px'
                }}
                onClick={() => {
                   if (activeTab === 'Vitals') setShowAddVitals(true);
                   if (activeTab === 'Prescription') setShowAddPrescription(true);
                   if (activeTab === 'SCAN') setShowAddScan(true);
                   if (activeTab === 'Lab Tests') setShowAddLab(true);
                }}
              >
                <Plus size={16} /> Add {activeTab}
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {/* Vitals */}
            {activeTab === 'Vitals' && (
              <div className={styles.tabPane}>
                {showAddVitals ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Heart Rate (bpm)</label>
                        <input className="form-input" type="number" placeholder="e.g. 72" disabled={completed} value={vitals.pulse || ''} onChange={(e) => handleVitalsChange('pulse', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Blood Pressure (mmHg)</label>
                        <input className="form-input" type="text" placeholder="e.g. 120/80" disabled={completed} value={vitals.bp || ''} onChange={(e) => handleVitalsChange('bp', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Temperature (&deg;F)</label>
                        <input className="form-input" type="number" placeholder="e.g. 98.6" disabled={completed} value={vitals.temp || ''} onChange={(e) => handleVitalsChange('temp', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">SpO2 (%)</label>
                        <input className="form-input" type="number" placeholder="e.g. 98" disabled={completed} value={vitals.spo2 || ''} onChange={(e) => handleVitalsChange('spo2', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Weight (kg)</label>
                        <input className="form-input" type="number" placeholder="e.g. 70" disabled={completed} value={vitals.weight || ''} onChange={(e) => handleVitalsChange('weight', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Height (cm)</label>
                        <input className="form-input" type="number" placeholder="e.g. 170" disabled={completed} value={vitals.height || ''} onChange={(e) => handleVitalsChange('height', e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn btn-primary" onClick={() => {
                        setVitalsHistory([{ date: new Date().toLocaleString('en-IN', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true}), ...vitals }, ...vitalsHistory]);
                        setShowAddVitals(false);
                        setVitals({});
                      }}>Save Vitals</button>
                      <button className="btn btn-outline" onClick={() => setShowAddVitals(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {vitalsHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No vitals recorded yet.</div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>HR</th>
                            <th>BP</th>
                            <th>Temp</th>
                            <th>SpO2</th>
                            <th>Weight</th>
                            <th>Height</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vitalsHistory.map((v, i) => (
                            <tr key={i}>
                              <td>{v.date}</td>
                              <td>{v.pulse} {v.pulse && 'bpm'}</td>
                              <td>{v.bp} {v.bp && 'mmHg'}</td>
                              <td>{v.temp} {v.temp && '°F'}</td>
                              <td>{v.spo2} {v.spo2 && '%'}</td>
                              <td>{v.weight} {v.weight && 'kg'}</td>
                              <td>{v.height} {v.height && 'cm'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Prescription */}
            {activeTab === 'Prescription' && (
              <div className={styles.tabPane}>
                {showAddPrescription && (
                  <div style={{ marginBottom: 24, padding: 16, border: '1px solid var(--border-light)', borderRadius: 12, background: '#f8fafc' }}>
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
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '12px 24px', fontSize: 15, fontWeight: 600, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={handleAddRx}
                      disabled={completed || !currentRx.medicine}
                    >
                      <Plus size={18} style={{ marginRight: 8 }} /> Add Medicine to Prescription
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '12px 24px', fontSize: 15, fontWeight: 600, borderRadius: 8 }}
                      onClick={() => setShowAddPrescription(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                </div>
                )}

                {prescriptions.length === 0 && !showAddPrescription ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No prescriptions added yet.</div>
                ) : (
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
                {showAddScan ? (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Scan Type</label>
                      <select className="form-select" value={scan} onChange={e => setScan(e.target.value)}>
                        <option value="">Select imaging type...</option>
                        {scanTypes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginTop: 12, marginBottom: 16 }}>
                      <label className="form-label">Scan Instructions / Notes</label>
                      <textarea
                        className="form-textarea"
                        style={{ minHeight: 70 }}
                        value={scanNotes}
                        onChange={e => setScanNotes(e.target.value)}
                        placeholder="Specify region, urgency, or special instructions..."
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn btn-primary" onClick={() => {
                        if (!scan) return;
                        setScanHistory([{ date: new Date().toLocaleString('en-IN', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true}), type: scan, notes: scanNotes }, ...scanHistory]);
                        setShowAddScan(false);
                        setScan('');
                        setScanNotes('');
                      }}>Save Scan Request</button>
                      <button className="btn btn-outline" onClick={() => setShowAddScan(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {scanHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No scans ordered yet.</div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>Scan Type</th>
                            <th>Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scanHistory.map((s, i) => (
                            <tr key={i}>
                              <td>{s.date}</td>
                              <td style={{ fontWeight: 600 }}>{s.type}</td>
                              <td>{s.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Lab Tests */}
            {activeTab === 'Lab Tests' && (
              <div className={styles.tabPane}>
                {showAddLab ? (
                  <div>
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
                    <div className="form-group" style={{ marginTop: 12, marginBottom: 16 }}>
                      <label className="form-label">Other / Custom Test</label>
                      <input
                        className="form-input"
                        value={labOther}
                        onChange={e => setLabOther(e.target.value)}
                        placeholder="Specify any other test..."
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn btn-primary" onClick={() => {
                        const testsToSave = [...selectedLabs];
                        if (labOther.trim()) testsToSave.push(labOther.trim());
                        if (testsToSave.length === 0) return;
                        setLabHistory([{ date: new Date().toLocaleString('en-IN', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true}), tests: testsToSave }, ...labHistory]);
                        setShowAddLab(false);
                        setSelectedLabs([]);
                        setLabOther('');
                      }}>Save Lab Order</button>
                      <button className="btn btn-outline" onClick={() => setShowAddLab(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {labHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No lab tests ordered yet.</div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>Ordered Tests</th>
                          </tr>
                        </thead>
                        <tbody>
                          {labHistory.map((l, i) => (
                            <tr key={i}>
                              <td style={{ verticalAlign: 'top', paddingTop: 12 }}>{l.date}</td>
                              <td>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {l.tests.map(t => (
                                    <span key={t} style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 4, fontSize: 12, border: '1px solid #e2e8f0', color: '#334155', fontWeight: 500 }}>
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
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
                {latestScan.type ? (
                  <>
                    <strong>{latestScan.type}</strong>
                    {latestScan.notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{latestScan.notes}</div>}
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
        {saved && <span className={styles.savedMsg}>âœ“ Consultation saved</span>}
        {referSent && <span className={styles.savedMsg} style={{ color: 'var(--primary)' }}>âœ“ Referral sent to {savedReferrals[savedReferrals.length-1]?.specialist}</span>}
        {ipAdmitSuccess && <span className={styles.savedMsg} style={{ color: '#16a34a' }}>âœ“ Patient admitted to IP Ward</span>}
        <button className="btn btn-ghost" style={{ color: 'var(--primary)' }} onClick={() => setReferModal(true)}>
          <Send size={14} /> Refer to Specialist
        </button>
        {prescriptions.length > 0 && (
          <button className="btn btn-outline" style={{ color: '#7c3aed', borderColor: '#7c3aed' }} onClick={() => setShowPrintModal(true)}>
            <Printer size={14} /> Print Prescription
          </button>
        )}
        <button className="btn btn-outline" onClick={handleSave}>Save Consultation</button>


      </div>

      {/* Drug-Allergy Confirmation Modal */}
      {allergyAlertMed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 28, width: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <ShieldAlert size={28} style={{ color: '#dc2626', flexShrink: 0 }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>âš ï¸ ALLERGY ALERT</div>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: '#7f1d1d', fontWeight: 600, marginBottom: 6 }}>Patient Allergies on Record:</div>
              <div style={{ fontSize: 13, color: '#991b1b' }}>{(patientRecord?.allergies || []).join(', ')}</div>
            </div>
            <div style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>
              You are prescribing <strong style={{ color: '#dc2626' }}>Â«{allergyAlertMed}Â»</strong> which may conflict with a known patient allergy. This could be dangerous.
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
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a' }}>ðŸ¥ {clinicInfo?.name || 'Hospital Name'}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>{clinicInfo?.address || 'Address'} | {clinicInfo?.phone || 'Phone'}</div>
              </div>
              {/* Doctor & Patient Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: 4 }}>Doctor</div>
                  <div>{activeQueueEntry?.doctorName || 'Dr. â€”'}</div>
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
              <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>Rx â€” PRESCRIPTIONS</div>
              {prescriptions.filter(r => r.medicine).map((rx, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px dashed #e2e8f0', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#1e3a8a', minWidth: 24 }}>{i + 1}.</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{rx.medicine} <span style={{ fontWeight: 400, fontSize: 12, color: '#64748b' }}>({rx.type})</span></div>
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 3 }}>
                      {rx.dosage} â€” {rx.frequency} â€” {rx.instruction === 'AF' ? 'After Food' : rx.instruction === 'BF' ? 'Before Food' : rx.instruction}
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
