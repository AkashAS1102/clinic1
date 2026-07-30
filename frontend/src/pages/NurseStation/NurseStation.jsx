import { useState } from 'react';
import { RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './NurseStation.module.css';

function getInitials(name) {
  return (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const avatarColors = ['avatar-blue', 'avatar-green', 'avatar-purple', 'avatar-orange'];

export default function NurseStation() {
  const { nurseQueue, updateNurseQueue, patients, setSelectedConsultationToken } = useApp();
  const [selectedToken, setSelectedToken] = useState(null);
  const [saved, setSaved] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const selected = (nurseQueue || []).find(q => q && q.token === selectedToken);
  const colorIdx = selected ? (nurseQueue || []).indexOf(selected) % avatarColors.length : 0;

  // Get patient record to show history details
  const patientRecord = selected
    ? (patients || []).find(p => p && p.id === selected.patientId)
    : null;

  const handleVitalChange = (field, value) => {
    updateNurseQueue(selectedToken, {
      vitals: { ...selected.vitals, [field]: value },
    });
  };

  const computeBMI = (weight, height) => {
    if (weight && height) {
      const h = parseFloat(height) / 100;
      return (parseFloat(weight) / (h * h)).toFixed(1);
    }
    return '';
  };

  // BUG-06 fix: store BMI in vitals state whenever weight or height changes
  const handleVitalChangeWithBMI = (field, value) => {
    const updatedVitals = { ...selected.vitals, [field]: value };
    if (field === 'weight' || field === 'height') {
      updatedVitals.bmi = computeBMI(
        field === 'weight' ? value : updatedVitals.weight,
        field === 'height' ? value : updatedVitals.height
      );
    }
    updateNurseQueue(selectedToken, { vitals: updatedVitals });
  };

  const handleBMI = (weight, height) => computeBMI(weight, height);

  const handleSave = async () => {
    if (!selected) return;
    // Persist the current vitals + notes to backend
    await updateNurseQueue(selectedToken, {
      vitals: selected.vitals,
      chiefComplaint: selected.chiefComplaint,
      nurseNotes: selected.nurseNotes,
    });
    setSaved(true);
    setSavedMsg('✓ Vitals saved successfully');
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSendToDoctor = async () => {
    // Mark sentToDoctor = true but keep status as Pending.
    // Status only changes to Done when doctor completes visit on OP Doctor page.
    await updateNurseQueue(selectedToken, {
      sentToDoctor: true,
      vitals: selected.vitals,
      chiefComplaint: selected.chiefComplaint,
      nurseNotes: selected.nurseNotes,
    });
    // Set this patient as the active consultation patient
    setSelectedConsultationToken(selectedToken);
    setSaved(true);
    setSavedMsg('✓ Patient sent to doctor queue');
    setTimeout(() => {
      setSaved(false);
      setSelectedToken(null); // Go back to queue automatically
    }, 1500);
  };

  const pendingQueue = (nurseQueue || []).filter(q => q && q.status !== 'Done' && !q.sentToDoctor);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Nurse Station</h1>
          <p className="page-subtitle">Capture patient vitals and preliminary notes before doctor consultation.</p>
        </div>
        <div className={styles.statusBadge}>
          <span className={styles.statusDot} />
          Station Active
        </div>
      </div>

      <div className={styles.layout}>
        {/* Left: Queue */}
        {!selected && (
        <div className={styles.queuePanel}>
          <div className={styles.queueHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600 }}>Today's Queue</span>
            </div>
            <button className={styles.refreshBtn}>
              <RefreshCw size={13} />
            </button>
          </div>

          <div className={styles.queueTable}>
            <div className={styles.tableHead}>
              <span>Token No.</span>
              <span>Name</span>
              <span>Demographics</span>
              <span>Doctor</span>
              <span>Chief Complaint</span>
              <span>Status</span>
            </div>

            {pendingQueue.map((q) => {
              if (!q) return null;
              const originalIndex = nurseQueue.indexOf(q);
              return (
                <button
                  key={q.token || originalIndex}
                  className={`${styles.tableRow} ${selectedToken === q.token ? styles.rowActive : ''} ${q.status === 'Done' ? styles.rowDone : ''}`}
                  onClick={() => { setSelectedToken(q.token); }}
                >
                  <div className={styles.tokenCell} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span>#{String(originalIndex + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 600 }}>{q.token}</span>
                  </div>
                  <div className={styles.nameCell}>
                    <span className={q.status === 'Done' ? styles.doneStrike : ''}>{q.patientName || 'Patient'}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ID: {q.patientId}</span>
                  </div>
                  <div className={styles.nameSub} style={{ display: 'flex', alignItems: 'center' }}>
                    {q.gender || ''}, {q.age || ''} yrs
                  </div>
                  <span className={styles.docCell}>{q.doctorName || 'Doctor'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{q.chiefComplaint || '-'}</span>
                  <span className={`badge ${q.status === 'Done' ? 'badge-green' : 'badge-gray'}`}>
                    {q.status || 'Pending'}
                  </span>
                </button>
              );
            })}

            {pendingQueue.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No patients in queue. Register a patient to begin.
              </div>
            )}
          </div>
        </div>
        )}

        {/* Right: Vitals Form */}
        {selected && (
          <div className={styles.vitalsPanel}>
            {/* Patient Header */}
            <div className={styles.patientHeader}>
              <button 
                onClick={() => setSelectedToken(null)}
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', padding: 8, marginRight: 6, color: 'var(--text-secondary)',
                  borderRadius: '50%', transition: 'background 0.2s'
                }}
                title="Back to Queue"
              >
                <ArrowLeft size={20} />
              </button>
              <div className={`avatar ${avatarColors[colorIdx]}`} style={{ width: 44, height: 44, fontSize: 15 }}>
                {getInitials(selected.patientName)}
              </div>
              <div className={styles.patientInfo}>
                <div className={styles.patientName}>{selected.patientName}</div>
                <div className={styles.patientSub}>
                  Token No: #{String(nurseQueue.indexOf(selected) + 1).padStart(2, '0')} <span style={{ color: '#dc2626', fontWeight: 500 }}>({selected.token})</span> &bull; {selected.gender === 'F' ? 'Female' : 'Male'}, {selected.age} years &bull; {selected.doctorName}
                  {patientRecord?.bloodGroup && <> &bull; Blood Group: <strong>{patientRecord.bloodGroup}</strong></>}
                </div>
              </div>
              <div className={styles.statusBlock}>
                <div className={styles.statusLabel}>Status</div>
                <span className={`badge ${selected.status === 'Done' ? 'badge-green' : 'badge-red'}`}>
                  {selected.status === 'Done' ? 'Done' : 'Vitals Required'}
                </span>
              </div>
            </div>

            <div className={styles.vitalsBody}>
              <div className={styles.sectionLabel}>⊞ Measurements</div>
              <div className={styles.vitalsGrid}>
                <div className="form-group">
                  <label className="form-label">BP (mmHg)</label>
                  <input
                    className="form-input"
                    value={selected.vitals.bp}
                    onChange={e => handleVitalChange('bp', e.target.value)}
                    placeholder="120/80"
                    disabled={selected.status === 'Done'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pulse (bpm)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={selected.vitals.pulse}
                    onChange={e => handleVitalChange('pulse', e.target.value)}
                    placeholder="—"
                    disabled={selected.status === 'Done'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Temp (°F)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.1"
                    value={selected.vitals.temp}
                    onChange={e => handleVitalChange('temp', e.target.value)}
                    placeholder="98.6"
                    disabled={selected.status === 'Done'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={selected.vitals.weight}
                    onChange={e => handleVitalChangeWithBMI('weight', e.target.value)}
                    placeholder="—"
                    disabled={selected.status === 'Done'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Height (cm)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={selected.vitals.height}
                    onChange={e => handleVitalChangeWithBMI('height', e.target.value)}
                    placeholder="—"
                    disabled={selected.status === 'Done'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">BMI (Auto)</label>
                  <input
                    className="form-input"
                    readOnly
                    value={handleBMI(selected.vitals.weight, selected.vitals.height)}
                    placeholder="—"
                    style={{ background: '#f9fafb', color: 'var(--text-secondary)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SpO2 (%)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={selected.vitals.spo2 || ''}
                    onChange={e => handleVitalChange('spo2', e.target.value)}
                    placeholder="e.g. 99"
                    disabled={selected.status === 'Done'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">RBS (mg/dL)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={selected.vitals.rbs || ''}
                    onChange={e => handleVitalChange('rbs', e.target.value)}
                    placeholder="e.g. 110"
                    disabled={selected.status === 'Done'}
                  />
                </div>
              </div>

              <div className={styles.sectionLabel} style={{ marginTop: 20 }}>⊞ Notes</div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Chief Complaint</label>
                <input
                  className="form-input"
                  value={selected.chiefComplaint}
                  onChange={e => updateNurseQueue(selectedToken, { chiefComplaint: e.target.value })}
                  placeholder="e.g., Bukhar 3 din se, pet dard, sardi-khaansi"
                  disabled={selected.status === 'Done'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nurse Notes</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 90 }}
                  value={selected.nurseNotes}
                  onChange={e => updateNurseQueue(selectedToken, { nurseNotes: e.target.value })}
                  placeholder="Additional observations, patient behaviour, special notes..."
                  disabled={selected.status === 'Done'}
                />
              </div>
            </div>

            {/* Footer */}
            <div className={styles.vitalsFooter}>
              {saved && <span className={styles.savedMsg}>{savedMsg}</span>}
              <button
                className="btn btn-outline"
                onClick={handleSave}
                disabled={selected.status === 'Done'}
              >
                Save Vitals
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSendToDoctor}
                disabled={selected.sentToDoctor || selected.status === 'Done'}
              >
                {selected.sentToDoctor ? '✓ Sent to Doctor' : 'Send to Doctor Queue'}
                {!selected.sentToDoctor && <ArrowRight size={14} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
