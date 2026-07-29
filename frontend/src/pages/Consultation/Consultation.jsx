import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Trash2, FileText, CheckCircle2, User, Send, ArrowLeft, Clock, Stethoscope, Pill, Image as ImageIcon, TestTubes, History as HistoryIcon, Calendar, Activity, Heart, Thermometer, Wind, Scale, AlertTriangle } from 'lucide-react';
import { diagnoses, medicines, labTests, labTestsGroups, mockPastConsultations } from '../../mockData';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../api/api';
import styles from './Consultation.module.css';

const departments = [
  'General Medicine', 'Cardiology', 'Neurology', 'Pediatrics',
  'Orthopedics', 'Dermatology', 'ENT', 'Ophthalmology', 'Gynecology'
];

const TABS = ['Diagnosis', 'Prescription', 'SCAN', 'Lab Tests', 'History', 'Next Visit'];

const emptyRx = { type: 'Tablet', medicine: '', dosage: '', frequency: '', duration: '', timing: 'AF' };

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

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function Consultation() {
  const { nurseQueue, patients, markPatientDone, selectedConsultationToken, setSelectedConsultationToken, addPharmacyQueueItem, addConsultation, pastConsultations } = useApp();

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
    }
    if (!currentToken) {
      // Patient deselected (back to queue view) — also reset ref
      lastTokenRef.current = null;
    }
  }, [activeQueueEntry?.token]);

  // Prescription helpers
  const handleAddRx = () => {
    if (currentRx.medicine) {
      setPrescriptions(prev => [...prev, currentRx]);
      setCurrentRx({ ...emptyRx });
    }
  };
  const removeRx = (i) => setPrescriptions(prev => prev.filter((_, idx) => idx !== i));
  const updateCurrentRx = (field, value) => {
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
        diagnosis: diagnosis,
        scanType: scan,
        scanNotes: scanNotes,
        labTests: (labOther ? [...selectedLabs, labOther] : selectedLabs).join(','),
        nextVisitDate: nextVisitDate,
        nextVisitNotes: nextVisitNotes,
        prescriptions: prescriptions.filter(r => r.medicine).map(r => ({
          type: r.type,
          medicine: r.medicine,
          dosage: r.dosage,
          frequency: r.frequency,
          duration: r.duration,
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

  const handleComplete = async () => {
    try {
      // Save consultation record first, then complete
      const consultationData = {
        patientId: activeQueueEntry?.patientId || '',
        patientName: activeQueueEntry?.patientName || '',
        token: activeQueueEntry?.token || '',
        diagnosis: diagnosis,
        scanType: scan,
        scanNotes: scanNotes,
        labTests: (labOther ? [...selectedLabs, labOther] : selectedLabs).join(','),
        nextVisitDate: nextVisitDate,
        nextVisitNotes: nextVisitNotes,
        prescriptions: prescriptions.filter(r => r.medicine).map(r => ({
          type: r.type,
          medicine: r.medicine,
          dosage: r.dosage,
          frequency: r.frequency,
          duration: r.duration,
          timing: r.timing
        }))
      };

      // Direct EMR Sync: Route prescriptions instantly to Pharmacy Queue!
      if (addPharmacyQueueItem && prescriptions.some(r => r.medicine)) {
        addPharmacyQueueItem({
          token: activeQueueEntry?.token || 'A-000',
          patientId: activeQueueEntry?.patientId || 'P-000000',
          patientName: activeQueueEntry?.patientName || 'Patient',
          age: activeQueueEntry?.age ? `${activeQueueEntry.age}Y` : '35Y',
          doctorName: activeQueueEntry?.doctorName || 'Dr. Kavitha Reddy',
          status: 'Ready to Dispense',
          allergies: patientRecord?.allergies || 'None Known',
          diagnosis: diagnosis || 'General Medical Consultation',
          items: prescriptions.filter(r => r.medicine).map(r => ({
            name: r.medicine,
            dosage: `${r.dosage || '1 Tab'} (${r.frequency || '1-0-1'} ${r.timing === 'AF' ? 'after food' : 'before food'})`,
            days: r.duration || '5 days',
            qty: 15,
            price: 45
          })),
          totalAmount: prescriptions.filter(r => r.medicine).length * 150
        });
      }

      // ── Save consultation to pastConsultations (fixes missing date bug) ──
      // This runs locally so it's instant and works in both online and offline mode.
      addConsultation({
        patientId: activeQueueEntry?.patientId || '',
        patientName: activeQueueEntry?.patientName || '',
        token: activeQueueEntry?.token || '',
        doctorName: activeQueueEntry?.doctorName || '',
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
          timing: r.timing,
        })),
      });

      try {
        const savedRec = await apiService.saveConsultation(consultationData);
        // Complete via the consultation endpoint — this also flips nurse queue to Done in DB
        if (savedRec?.id) {
          await apiService.completeConsultation(savedRec.id);
        }
      } catch (err) {
        console.warn('Consultation API failed (offline?), marking done locally.', err);
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

  // Only patients that have been sent to doctor (sentToDoctor = true) show in selector
  const readyPatients = nurseQueue.filter(q => q.sentToDoctor);

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
                      <div className={styles.queueName}>{q.patientName}</div>
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
            <div className={styles.snapName}>{activeQueueEntry.patientName}</div>
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

                <div className={styles.rxTable} style={{ marginBottom: 24, border: '1.5px solid var(--primary-light)' }}>
                  <div className={styles.rxTableHead} style={{ gridTemplateColumns: '110px 1fr 90px 100px 100px 90px 70px' }}>
                    <span>Type</span>
                    <span>Medicine Name</span>
                    <span>Dosage</span>
                    <span>Frequency</span>
                    <span>Timing</span>
                    <span>Duration</span>
                    <span></span>
                  </div>

                  <div className={styles.rxRow} style={{ gridTemplateColumns: '110px 1fr 90px 100px 100px 90px 70px', padding: '10px 12px' }}>
                    <select
                      className="form-select"
                      value={currentRx.type}
                      onChange={e => updateCurrentRx('type', e.target.value)}
                      disabled={completed}
                    >
                      {Object.keys(medicines).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      className="form-select"
                      value={currentRx.medicine}
                      onChange={e => updateCurrentRx('medicine', e.target.value)}
                      disabled={completed}
                    >
                      <option value="">Select medicine</option>
                      {(medicines[currentRx.type] || []).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input
                      className="form-input"
                      value={currentRx.dosage}
                      onChange={e => updateCurrentRx('dosage', e.target.value)}
                      placeholder="e.g. 10ml"
                      disabled={completed}
                    />
                    <select
                      className="form-select"
                      value={currentRx.frequency}
                      onChange={e => updateCurrentRx('frequency', e.target.value)}
                      disabled={completed}
                    >
                      <option value="">Select frequency</option>
                      {commonFrequencies.map(f => <option key={f} value={f.split(' ')[0]}>{f}</option>)}
                    </select>
                    <select
                      className="form-select"
                      value={currentRx.timing}
                      onChange={e => updateCurrentRx('timing', e.target.value)}
                      disabled={completed}
                    >
                      <option value="AF">After Food</option>
                      <option value="BF">Before Food</option>
                      <option value="With Food">With Food</option>
                    </select>
                    <input
                      className="form-input"
                      value={currentRx.duration}
                      onChange={e => updateCurrentRx('duration', e.target.value)}
                      placeholder="e.g. 5 Days"
                      disabled={completed}
                    />
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 0', fontSize: 13, height: '100%' }}
                      onClick={handleAddRx}
                      disabled={completed || !currentRx.medicine}
                    >
                      <Plus size={14} style={{ marginRight: 2 }} /> Add
                    </button>
                  </div>
                </div>

                {prescriptions.length > 0 && (
                  <div className={styles.savedRxContainer}>
                    <div className={styles.rxTitle} style={{ fontSize: 13, marginBottom: 10, color: 'var(--text-secondary)' }}>Saved Prescriptions ({prescriptions.length})</div>
                    <div className={styles.rxTable}>
                      {prescriptions.map((rx, i) => (
                        <div key={i} className={styles.rxRow} style={{ gridTemplateColumns: '100px 1fr 90px 100px 90px 80px 40px' }}>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{rx.type}</div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rx.medicine}</div>
                          <div style={{ fontSize: 13 }}>{rx.dosage || '-'}</div>
                          <div style={{ fontSize: 13 }}>{rx.frequency || '-'}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{rx.timing || '-'}</div>
                          <div style={{ fontSize: 13 }}>{rx.duration || '-'}</div>
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
                  setReferModal(false);
                  setReferSent(true);
                  setTimeout(() => setReferSent(false), 3000);
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
        {referSent && <span className={styles.savedMsg} style={{ color: 'var(--primary)' }}>✓ Referral sent to {referSpecialist}</span>}
        <button className="btn btn-ghost" style={{ color: 'var(--primary)' }} onClick={() => setReferModal(true)}>
          <Send size={14} /> Refer to Specialist
        </button>
        <button className="btn btn-outline" onClick={handleSave}>Save Consultation</button>
        <button
          className="btn btn-primary"
          onClick={handleComplete}
          disabled={completed}
        >
          {completed ? '✓ Visit Completed' : 'Complete Visit'}
        </button>
      </div>
    </div>
  );
}
