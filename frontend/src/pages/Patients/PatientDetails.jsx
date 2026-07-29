import React from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, Phone, Calendar, HeartPulse, Activity, 
  MapPin, AlertCircle, ChevronRight, Edit2, ArrowLeft, 
  FileText, ShieldAlert, Clock, Stethoscope, UserCheck, History, Shield, Briefcase 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './PatientDetails.module.css';

export default function PatientDetails() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const { patients, appointments, nurseQueue, pastConsultations } = useApp();
  const navigate = useNavigate();

  const patient = patients.find(p => p.id === id) || patients[0];

  // Find related appointments and consultations
  const patAppointments = appointments.filter(a => a.patientId === patient.id || a.patientName === patient.fullName);
  const patQueue = nurseQueue.filter(q => q.patientId === patient.id || q.patientName === patient.fullName);
  const patHistory = (pastConsultations || []).filter(c => c.patientId === patient.id || c.patientName === patient.fullName);

  if (!patient) {
    return (
      <div className={styles.page} style={{ textAlign: 'center', padding: '80px 20px' }}>
        <ShieldAlert size={56} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
        <h2 style={{ color: '#0f172a' }}>Patient Not Found</h2>
        <p style={{ color: '#64748b', marginTop: 8 }}>We couldn't locate a patient with ID #{id}.</p>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/patients/list')}>
          ← Back to Patients List
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/patients/all" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Patients</Link> <ChevronRight size={14} /> <span>Patient Profile</span>
          </div>
          <h1 className={styles.pageTitle}>Patient Profile & Medical History</h1>
        </div>

        <div className={styles.topButtons}>
          <button className="btn btn-outline" onClick={() => navigate('/patients/list')}>
            <ArrowLeft size={16} /> Back to List
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/patients/manage?id=${patient.id}`)}>
            <Edit2 size={16} /> Edit Patient Record
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className={styles.profileCard}>
        <div className={styles.profileLeft}>
          {patient.photo ? (
            <img src={patient.photo} alt={patient.fullName} className={styles.avatar} />
          ) : (
            <div className="avatar avatar-blue" style={{ width: 80, height: 80, fontSize: 32, fontWeight: 800, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(patient.fullName || 'P').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 800, border: '1px solid #bbf7d0', letterSpacing: '0.02em' }}>
                Reg No: {patient.regNo || `PRN-2026-${(patient.id || '').replace(/\D/g, '')}`}
              </span>
              <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                #{patient.id}
              </span>
              <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                {patient.patientCategory || 'General'}
              </span>
              {patient.govtId && (
                <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                  🆔 {patient.govtId}
                </span>
              )}
            </div>
            <h2 className={styles.name}>{patient.fullName}</h2>
            <div className={styles.subText}>
              <span>{patient.gender || 'Unknown gender'}</span> • 
              <span>DOB: {patient.dob || 'N/A'}</span> • 
              <span>{patient.maritalStatus || 'Single'}</span> • 
              <span style={{ color: '#16a34a', fontWeight: 700 }}>{patient.status || 'Active'} Patient</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ textAlign: 'right', background: '#f8fafc', padding: '12px 20px', borderRadius: 14, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Blood Group</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626', marginTop: 2 }}>{patient.bloodGroup || 'Unknown'}</div>
          </div>
        </div>
      </div>

      {/* 2-Column Details Grid */}
      <div className={styles.grid}>
        <div>
          {/* Essential Medical & Demographic Overview */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><Activity size={18} style={{ color: '#2563eb' }} /> Medical & Demographic Overview</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Permanent Reg No. (PRN)</span>
                <span className={styles.infoValue} style={{ fontWeight: 800, color: '#15803d', fontFamily: 'monospace', fontSize: 14 }}>
                  {patient.regNo || `PRN-2026-${(patient.id || '').replace(/\D/g, '')}`}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Contact Number</span>
                <span className={styles.infoValue}>+91 {patient.phone || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Date of Birth</span>
                <span className={styles.infoValue}>{patient.dob || 'Not Provided'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Gender</span>
                <span className={styles.infoValue}>{patient.gender || 'Unspecified'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Marital Status</span>
                <span className={styles.infoValue}>{patient.maritalStatus || 'Single'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Govt ID / Aadhaar / ABHA</span>
                <span className={styles.infoValue} style={{ fontFamily: 'monospace', fontWeight: 700 }}>{patient.govtId || 'Not Registered'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Occupation</span>
                <span className={styles.infoValue}>{patient.occupation || 'Not Specified'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Relationship to Family</span>
                <span className={styles.infoValue}>{patient.relationshipToFamily || 'Self (Primary)'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Referring Physician</span>
                <span className={styles.infoValue}>{patient.referringDoctor || 'Direct / Walk-in'}</span>
              </div>
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.infoLabel}>Residential Address</span>
                <span className={styles.infoValue} style={{ fontWeight: 500, color: '#334155' }}>
                  {patient.address || 'No residential address registered in file.'}
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Conditions & Allergies */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><AlertCircle size={18} style={{ color: '#dc2626' }} /> Known Allergies & Underlying Conditions</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Known Allergies</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {patient.allergies && patient.allergies.length > 0 ? (
                    patient.allergies.map((alg, idx) => (
                      <span key={idx} style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                        ⚠️ {alg}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: 13 }}>No drug or environmental allergies reported.</span>
                  )}
                </div>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Chronic & Past Conditions</span>
                <span className={styles.infoValue} style={{ color: '#334155', fontWeight: 600 }}>
                  {patient.conditions || 'No underlying conditions reported.'}
                </span>
              </div>
            </div>
          </div>

          {/* Insurance & Billing Profile */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><Shield size={18} style={{ color: '#059669' }} /> Insurance & Billing Profile</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Patient Category</span>
                <span className={styles.infoValue} style={{ color: '#059669', fontWeight: 700 }}>{patient.patientCategory || 'General Patient'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Insurance Provider</span>
                <span className={styles.infoValue}>{patient.insuranceProvider || 'None / Self-Pay'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Policy / TPA Number</span>
                <span className={styles.infoValue} style={{ fontFamily: 'monospace', fontWeight: 600 }}>{patient.policyNumber || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Registered By</span>
                <span className={styles.infoValue}>{patient.registeredBy || 'Front Desk Admin'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Emergency Contact & Appointment History */}
        <div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><UserCheck size={18} style={{ color: '#16a34a' }} /> Guardian & Emergency Contact</h3>
            <div className={styles.infoGrid} style={{ gridTemplateColumns: '1fr' }}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Guardian (Minors / Elderly)</span>
                <span className={styles.infoValue}>{patient.guardianName || 'None Specified'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Emergency Contact Person</span>
                <span className={styles.infoValue}>{patient.emergencyContactName || 'None Registered'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Emergency Phone</span>
                <span className={styles.infoValue}>{patient.emergencyContactPhone ? `+91 ${patient.emergencyContactPhone}` : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}><Calendar size={18} style={{ color: '#475569' }} /> Recent Clinic Visits</h3>
            {patAppointments.length === 0 && patQueue.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic' }}>No consultation or appointment history recorded yet.</p>
            ) : (
              <div>
                {patAppointments.map(a => (
                  <div key={a.id} className={styles.historyItem}>
                    <div className={styles.historyTitle}>{a.type || 'General Checkup'} with {a.doctorName || 'Doctor'}</div>
                    <div className={styles.historyDate}>🗓️ {a.date} at {a.time} • Status: <strong>{a.status}</strong></div>
                  </div>
                ))}
                {patQueue.map(q => (
                  <div key={q.token} className={styles.historyItem}>
                    <div className={styles.historyTitle}>Token #{q.token} ({q.status})</div>
                    <div className={styles.historyDate}>🩺 Vitals BP: {q.vitals?.bp || 'N/A'} • Pulse: {q.vitals?.pulse || 'N/A'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <h3 className={styles.cardTitle} style={{ borderBottom: 'none', margin: 0, paddingBottom: 0 }}>
                <History size={18} style={{ color: '#2563eb' }} /> Clinical Consultation History
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/patients/history`)}>
                View All Logs →
              </button>
            </div>

            {patHistory.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic' }}>No past consultation diagnoses or prescriptions on file.</p>
            ) : (
              <div>
                {patHistory.map(h => (
                  <div key={h.id} className={styles.historyItem} style={{ borderLeft: '3px solid #2563eb', background: '#eff6ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>🏥 {h.diagnosis}</span>
                      <span style={{ fontSize: 11, background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>{h.date}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>Treated by: {h.doctorName} ({h.department})</div>
                    {h.prescriptions && h.prescriptions.length > 0 && (
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                        💊 <strong>Rx:</strong> {h.prescriptions.map(p => `${p.medicine} (${p.frequency})`).join(', ')}
                      </div>
                    )}
                    {h.labTests && h.labTests.length > 0 && (
                      <div style={{ fontSize: 12, color: '#4338ca', marginTop: 2 }}>
                        🧪 <strong>Labs:</strong> {h.labTests.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
