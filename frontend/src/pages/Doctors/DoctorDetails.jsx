import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Printer, Download, Edit2, UserCheck, ChevronRight, 
  User, Mail, Phone, MapPin, Calendar, Clock, 
  Award, Briefcase, FileText, CheckCircle2, ShieldAlert, 
  Stethoscope, Activity, X, Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './DoctorDetails.module.css';

function DoctorPhoto({ name, photo }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  if (photo) {
    return <img src={photo} alt={name} className={styles.photoImg} />;
  }
  return <div className={styles.photoInitials}>{initials}</div>;
}

export default function DoctorDetails() {
  const { doctors, updateDoctor } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const idParam = searchParams.get('id');
  const [selectedId, setSelectedId] = useState(idParam || (doctors[0]?.id || ''));
  const [activeTab, setActiveTab] = useState('Overview');
  const [toast, setToast] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: 'Annual Leave', start: '2026-08-10', end: '2026-08-14', reason: 'Attending National Medical Conference' });

  useEffect(() => {
    if (idParam && doctors.some(d => d.id === idParam)) {
      setSelectedId(idParam);
    } else if (!selectedId && doctors.length > 0) {
      setSelectedId(doctors[0].id);
    }
  }, [idParam, doctors]);

  const doc = doctors.find(d => d.id === selectedId) || doctors[0] || {
    id: 'DOC-8832',
    name: 'Arjun Mehta',
    department: 'Cardiology',
    qualification: 'MD, DM Cardiology',
    contact: '+91 98765 43210',
    email: 'arjun.mehta@clinic.in',
    licenseNumber: 'MCI-MH-89210',
    experience: '12+ years specializing in interventional cardiology',
    fee: 600,
    status: 'Active',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  };

  const handleSelectChange = (e) => {
    const newId = e.target.value;
    setSelectedId(newId);
    setSearchParams({ id: newId });
  };

  const handleDownloadProfile = () => {
    const content = `AAROGYA CLINIC MANAGEMENT SYSTEM
========================================
DOCTOR CLINICAL PROFILE & CREDENTIALS
========================================
Name: Dr. ${doc.name}
Doctor ID: #${doc.id}
Employee ID: EMP-2024-${doc.id.replace('DOC-', '')}
Department: ${doc.department} — Room 102
Qualification: ${doc.qualification || 'MD, DM Cardiology'}
Medical License: ${doc.licenseNumber || 'MCI-MH-89210'}
Status: ${doc.status}
Email: ${doc.email || 'doctor@clinic.in'}
Phone: ${doc.contact || '+91 98765 43210'}
Consultation Fee: ₹${doc.fee || 600}
========================================
Generated on: ${new Date().toLocaleDateString()}`;

    const encodedUri = encodeURI('data:text/plain;charset=utf-8,' + content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dr_${doc.name.replace(/\s+/g, '_')}_Profile.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast(`Downloaded clinical profile summary for Dr. ${doc.name}!`);
    setTimeout(() => setToast(null), 4000);
  };

  const handleApplyLeaveSubmit = async (e) => {
    e.preventDefault();
    await updateDoctor(doc.id, { status: 'On Leave' });
    setShowLeaveModal(false);
    setToast(`Leave request submitted & approved for Dr. ${doc.name}! Status updated to On Leave.`);
    setTimeout(() => setToast(null), 5000);
  };

  const tabs = [
    'Overview', 'Qualifications', 'Experience', 'Specialties', 
    'Schedule / OPD', 'Attendance', 'Leave Records', 'Documents'
  ];

  return (
    <div className={styles.page}>
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 28, background: '#10b981', color: 'white', padding: '14px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* Breadcrumb & Top Bar */}
      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/doctors/all" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Doctors</Link> <ChevronRight size={14} /> <span>Doctor Details</span>
          </div>
          <h1 className={styles.pageTitle}>Doctor Details</h1>
        </div>

        <div className={styles.topButtons}>
          <button className={styles.btnOutline} onClick={() => window.print()}>
            <Printer size={15} /> Print Profile
          </button>
          <button className={styles.btnOutline} onClick={handleDownloadProfile}>
            <Download size={15} /> Download Details
          </button>
          <button className={styles.btnPrimary} onClick={() => navigate(`/doctors/manage?id=${doc.id}`)}>
            <Edit2 size={15} /> Edit Doctor
          </button>
        </div>
      </div>

      {/* Doctor Selector Bar */}
      <div className={styles.selectBar}>
        <div className={styles.selectLabel}>
          <UserCheck size={18} style={{ color: '#2563eb' }} />
          <span>Select Doctor Profile:</span>
        </div>
        <select className={styles.docSelect} value={selectedId} onChange={handleSelectChange}>
          {doctors.map(d => (
            <option key={d.id} value={d.id}>
              Dr. {d.name} ({d.department}) — #{d.id}
            </option>
          ))}
        </select>
      </div>

      {/* Top Summary Banner Card */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <div className={styles.summaryPhotoBox}>
            <DoctorPhoto name={doc.name} photo={doc.photo} />
          </div>

          <div className={styles.summaryDetails}>
            <h2 className={styles.summaryName}>Dr. {doc.name}</h2>

            <div className={styles.summaryGrid}>
              <div className={styles.gridRow}>
                <span className={styles.gridLabel}>Employee ID</span>
                <span className={styles.gridValue}>EMP-2024-{doc.id.replace('DOC-', '')}</span>
              </div>
              <div className={styles.gridRow}>
                <span className={styles.gridLabel}>Department & Room</span>
                <span className={styles.gridValue}>{doc.department} — Room 102</span>
              </div>
              <div className={styles.gridRow}>
                <span className={styles.gridLabel}>Medical License</span>
                <span className={styles.gridValue}>{doc.licenseNumber || 'MCI-MH-89210'}</span>
              </div>
              <div className={styles.gridRow}>
                <span className={styles.gridLabel}>Consultation Tenure</span>
                <span className={styles.gridValue}>2021 - 2026</span>
              </div>
              <div className={styles.gridRow}>
                <span className={styles.gridLabel}>Doctor ID</span>
                <span className={styles.gridValue}>#{doc.id}</span>
              </div>
              <div className={styles.gridRow}>
                <span className={styles.gridLabel}>Status</span>
                <span className={styles.gridValue}>
                  <span className={doc.status === 'Active' ? styles.statusActive : ''} style={{ background: doc.status === 'Active' ? '#dcfce7' : '#fef9c3', color: doc.status === 'Active' ? '#16a34a' : '#ca8a04', padding: '4px 12px', borderRadius: 20, fontWeight: 800, fontSize: 12 }}>
                    {doc.status.toUpperCase()}
                  </span>
                </span>
              </div>

              {/* Progress bar */}
              <div className={styles.progressWrap}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  <span>OPD Attendance Quota</span>
                  <span style={{ color: '#2563eb' }}>94% (180/192 Days)</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: '94%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className={styles.tabsBar}>
        {tabs.map(tab => (
          <button
            key={tab}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className={styles.overviewGrid}>
          {/* Left Column */}
          <div>
            {/* Personal Information */}
            <div className={styles.colCard}>
              <h3 className={styles.sectionTitle}>
                <User size={16} /> Personal Information
              </h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Date of Birth</span>
                  <span className={styles.infoValue}>12 May 1982</span>
                </div>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Gender</span>
                  <span className={styles.infoValue}>Male</span>
                </div>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Blood Group</span>
                  <span className={styles.infoValue} style={{ color: '#dc2626' }}>O Positive</span>
                </div>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Marital Status</span>
                  <span className={styles.infoValue}>Married</span>
                </div>
              </div>

              <h3 className={styles.sectionTitle} style={{ marginTop: 28 }}>
                <Mail size={16} /> Contact Details
              </h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Email Address</span>
                  <span className={styles.infoValue}>{doc.email || 'doctor@clinic.in'}</span>
                </div>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Primary Phone</span>
                  <span className={styles.infoValue}>{doc.contact || '+91 98765 43210'}</span>
                </div>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Secondary Phone</span>
                  <span className={styles.infoValue}>+91 98765 65432</span>
                </div>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Emergency Contact</span>
                  <span className={styles.infoValue}>+91 98220 11223</span>
                </div>
              </div>

              <h3 className={styles.sectionTitle} style={{ marginTop: 28 }}>
                <MapPin size={16} /> Address Information
              </h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoBox} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.infoLabel}>Current Clinic Address</span>
                  <span className={styles.infoValue}>422 Oakwood Dr, Medical Enclave, Mumbai, Maharashtra 400050</span>
                </div>
                <div className={styles.infoBox} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.infoLabel}>Permanent Residential Address</span>
                  <span className={styles.infoValue}>891 Pinecrest Blvd, Surrey Layout, Pune, Maharashtra 411001</span>
                </div>
              </div>
            </div>

            {/* Upcoming Consultations Card */}
            <div className={styles.colCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                  <Clock size={16} /> Upcoming Consultations
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/appointments')}>View All</button>
              </div>

              <div className={styles.classList}>
                <div className={styles.classItem}>
                  <div>
                    <div className={styles.classTime}>10:30 AM</div>
                    <div className={styles.classTimeSub}>Follow-up Roster</div>
                  </div>
                  <div>
                    <div className={styles.classTitle}>Advanced Cardiology Review</div>
                    <div className={styles.classRoom}>OPD Ward A • Room 302</div>
                  </div>
                </div>

                <div className={styles.classItem} style={{ borderLeftColor: '#16a34a' }}>
                  <div>
                    <div className={styles.classTime} style={{ color: '#16a34a' }}>01:45 PM</div>
                    <div className={styles.classTimeSub}>Diagnostic Lab</div>
                  </div>
                  <div>
                    <div className={styles.classTitle}>ECG & Stress Test Evaluation</div>
                    <div className={styles.classRoom}>Cardiac Lab • Room 02</div>
                  </div>
                </div>

                <div className={styles.classItem} style={{ borderLeftColor: '#9333ea' }}>
                  <div>
                    <div className={styles.classTime} style={{ color: '#9333ea' }}>03:15 PM</div>
                    <div className={styles.classTimeSub}>Internal Roster</div>
                  </div>
                  <div>
                    <div className={styles.classTitle}>Clinical Staff Board Meeting</div>
                    <div className={styles.classRoom}>Conference Room B</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Attendance Analytics Card */}
            <div className={styles.colCard}>
              <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px 0' }}>Attendance Analytics</h4>
              
              <div className={styles.attWrap}>
                <div className={styles.attCircle}>
                  <div className={styles.attInner}>90%</div>
                </div>

                <div className={styles.attStats}>
                  <div className={styles.attStatRow}>
                    <span className={styles.attLabel}>Present Days</span>
                    <span className={styles.attNum}>180</span>
                  </div>
                  <div className={styles.attStatRow}>
                    <span className={styles.attLabel}>Late / Half Shifts</span>
                    <span className={styles.attNum}>12</span>
                  </div>
                  <div className={styles.attStatRow}>
                    <span className={styles.attLabel}>On Approved Leave</span>
                    <span className={styles.attNum}>08</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Summary Card */}
            <div className={styles.colCard}>
              <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px 0' }}>Leave Summary</h4>

              <div className={styles.leaveGrid}>
                <div className={styles.leaveBox}>
                  <span className={styles.leaveType}>Annual Leave</span>
                  <span className={styles.leaveCount}>12/20</span>
                  <span className={styles.leaveSub}>Days Remaining</span>
                </div>

                <div className={styles.leaveBox}>
                  <span className={styles.leaveType}>Sick Leave</span>
                  <span className={styles.leaveCount}>04/08</span>
                  <span className={styles.leaveSub}>Days Remaining</span>
                </div>
              </div>

              <button className={styles.btnApplyLeave} onClick={() => setShowLeaveModal(true)}>
                Apply for Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Tabs content */}
      {activeTab !== 'Overview' && (
        <div className={styles.colCard}>
          <h3 className={styles.sectionTitle} style={{ marginBottom: 20 }}>
            {activeTab} Details for Dr. {doc.name}
          </h3>
          
          {activeTab === 'Qualifications' && (
            <table className={styles.tabTable}>
              <thead>
                <tr><th>DEGREE / CERTIFICATE</th><th>UNIVERSITY / INSTITUTION</th><th>YEAR OF COMPLETION</th><th>STATUS</th></tr>
              </thead>
              <tbody>
                <tr><td>{doc.qualification || 'DM Cardiology'}</td><td>AIIMS Medical College, New Delhi</td><td>2018</td><td><span className="badge badge-success">Verified</span></td></tr>
                <tr><td>MD General Medicine</td><td>Grant Medical College, Mumbai</td><td>2014</td><td><span className="badge badge-success">Verified</span></td></tr>
                <tr><td>MBBS</td><td>King Edward Memorial Hospital</td><td>2010</td><td><span className="badge badge-success">Verified</span></td></tr>
              </tbody>
            </table>
          )}

          {activeTab === 'Experience' && (
            <table className={styles.tabTable}>
              <thead>
                <tr><th>ROLE / DESIGNATION</th><th>HOSPITAL / CLINIC</th><th>DURATION</th><th>RESPONSIBILITIES</th></tr>
              </thead>
              <tbody>
                <tr><td>Senior Consultant Cardiologist</td><td>Aarogya Super-Specialty Clinic</td><td>2021 - Present</td><td>Head of non-invasive cardiology and OPD triage</td></tr>
                <tr><td>Associate Medical Officer</td><td>Apollo Hospital Enclave</td><td>2018 - 2021</td><td>Interventional procedures and ICU resident rounds</td></tr>
              </tbody>
            </table>
          )}

          {activeTab === 'Specialties' && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '10px 0' }}>
              <span className="badge badge-primary" style={{ padding: '8px 16px', fontSize: 13 }}>Interventional Cardiology</span>
              <span className="badge badge-primary" style={{ padding: '8px 16px', fontSize: 13 }}>Echocardiography & Doppler</span>
              <span className="badge badge-primary" style={{ padding: '8px 16px', fontSize: 13 }}>Cardiac Rehabilitation</span>
              <span className="badge badge-primary" style={{ padding: '8px 16px', fontSize: 13 }}>Hypertension Management</span>
            </div>
          )}

          {activeTab === 'Schedule / OPD' && (
            <table className={styles.tabTable}>
              <thead>
                <tr><th>DAY OF WEEK</th><th>SHIFT TIME</th><th>ASSIGNED WARD</th><th>MAX PATIENT QUOTA</th></tr>
              </thead>
              <tbody>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, idx) => (
                  <tr key={day}>
                    <td style={{ fontWeight: 700 }}>{day}</td>
                    <td>09:00 AM - 05:00 PM</td>
                    <td>OPD Block A — Room {101 + idx}</td>
                    <td>25 Patients / Shift</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {(activeTab === 'Attendance' || activeTab === 'Leave Records' || activeTab === 'Documents') && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
              <FileText size={36} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
              <h4>No recent anomalies or disciplinary logs found</h4>
              <p>All clinical compliance records and medical board certificates are up to date.</p>
            </div>
          )}
        </div>
      )}

      {/* Interactive Leave Request Modal */}
      {showLeaveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 20px 50px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={20} style={{ color: '#2563eb' }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Apply for Leave — Dr. {doc.name}</h3>
              </div>
              <button onClick={() => setShowLeaveModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleApplyLeaveSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Leave Type *</label>
                <select 
                  className="form-select" 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1' }}
                  value={leaveForm.type}
                  onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}
                >
                  <option value="Annual Leave">Annual Leave (Paid)</option>
                  <option value="Sick Leave">Sick Leave / Medical Emergency</option>
                  <option value="Conference Leave">Academic Conference Presentation</option>
                  <option value="Personal Leave">Personal Emergency Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Start Date *</label>
                  <input 
                    type="date" 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1' }}
                    value={leaveForm.start}
                    onChange={e => setLeaveForm({ ...leaveForm, start: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>End Date *</label>
                  <input 
                    type="date" 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1' }}
                    value={leaveForm.end}
                    onChange={e => setLeaveForm({ ...leaveForm, end: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Reason for Leave *</label>
                <textarea 
                  rows={3} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontFamily: 'inherit', fontSize: 13 }}
                  placeholder="Provide brief details regarding OPD substitution or medical cover..."
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" onClick={() => setShowLeaveModal(false)} className="btn btn-outline" style={{ padding: '10px 20px' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} /> Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
