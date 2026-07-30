import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  UserCheck, Printer, Download, Edit2, Calendar, 
  MapPin, Phone, Mail, Award, Clock, FileText, 
  ShieldAlert, Activity, CheckCircle2, X, ChevronRight, Stethoscope
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './NurseDetails.module.css';

export default function NurseDetails() {
  const { nurses, updateNurse } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const idParam = searchParams.get('id');
  const [selectedId, setSelectedId] = useState(idParam || (nurses[0]?.id || ''));
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: 'Sick Leave', start: '2026-07-28', end: '2026-07-29', reason: 'Fever and viral strain' });

  useEffect(() => {
    if (idParam && nurses.some(n => n.id === idParam)) {
      setSelectedId(idParam);
    } else if (nurses.length > 0 && !selectedId) {
      setSelectedId(nurses[0].id);
    }
  }, [idParam, nurses]);

  const nurse = nurses.find(n => n.id === selectedId) || nurses[0] || {};

  const handleSelectChange = (e) => {
    const newId = e.target.value;
    setSelectedId(newId);
    setSearchParams({ id: newId });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = `CLINICAL NURSING PROFILE — ${nurse.name || 'Nurse'}
=====================================================
Nurse ID: ${nurse.id || 'N/A'}
Department / Ward: ${nurse.department || 'General Ward'}
Shift Schedule: ${nurse.shift || 'Morning Shift'}
Qualification: ${nurse.qualification || 'RN, B.Sc Nursing'}
License Number: ${nurse.licenseNumber || 'RN-MH-00000'}
Tenure / Experience: ${nurse.experience || '5'} years
Contact Number: ${nurse.contact || '+91 98000 00000'}
Email Address: ${nurse.email || 'nurse@clinic.in'}
Status: ${nurse.status || 'Active'}
=====================================================
MedCore Enterprise Hospital & Clinic Station — Official Report`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nurse_${(nurse.name || 'Profile').replace(/\s+/g, '_')}_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast(`Downloaded clinical profile report for Nurse ${nurse.name}!`);
    setTimeout(() => setToast(null), 3500);
  };

  const handleApplyLeaveSubmit = async (e) => {
    e.preventDefault();
    if (nurse && nurse.id) {
      await updateNurse(nurse.id, { ...nurse, status: 'On Leave' });
    }
    setShowLeaveModal(false);
    setToast(`Leave request submitted for Nurse ${nurse.name}! Status updated to On Leave.`);
    setTimeout(() => setToast(null), 4000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'qualifications', label: 'Qualifications' },
    { id: 'experience', label: 'Experience' },
    { id: 'skills', label: 'Ward Skills & ACLS' },
    { id: 'schedule', label: 'Shift Schedule' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leaves', label: 'Leave Records' },
    { id: 'documents', label: 'Documents' },
  ];

  return (
    <div className={styles.page}>
      {/* Toast Notification */}
      {toast && (
        <div className={styles.toast}>
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* Breadcrumb & Top Action Bar */}
      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/nurses/all" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Nurses</Link> <ChevronRight size={14} /> <span>Nurse Details</span>
          </div>
          <h1 className={styles.pageTitle}>Nursing Staff Profile & Shift Schedule</h1>
        </div>

        <div className={styles.topButtons}>
          <button type="button" className={styles.btnPrint} onClick={handlePrint}>
            <Printer size={15} /> Print Profile
          </button>
          <button type="button" className={styles.btnDownload} onClick={handleDownload}>
            <Download size={15} /> Download Details
          </button>
          <button type="button" className={styles.btnEdit} onClick={() => navigate(`/nurses/manage?id=${nurse.id}`)}>
            <Edit2 size={15} /> Edit Nurse
          </button>
        </div>
      </div>

      {/* Nurse Selector Dropdown Bar */}
      <div className={styles.selectBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: '#1e293b' }}>
          <UserCheck size={18} style={{ color: '#2563eb' }} />
          <span>Select Nursing Profile to Inspect:</span>
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: 280, fontWeight: 600 }} value={selectedId} onChange={handleSelectChange}>
          {nurses.map(n => (
            <option key={n.id} value={n.id}>
              Nurse {n.name} ({n.department}) — #{n.id}
            </option>
          ))}
        </select>
      </div>

      {/* Top Summary Banner Card */}
      <div className={styles.bannerCard}>
        <div className={styles.bannerLeft}>
          {nurse.photo ? (
            <img src={nurse.photo} alt={nurse.name} className={styles.bannerAvatar} />
          ) : (
            <div className={styles.bannerAvatarPlaceholder}>
              {(nurse.name || 'N').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className={styles.bannerId}>#{nurse.id || 'NUR-4011'} • CLINICAL STAFF</div>
            <h2 className={styles.bannerName}>Nurse {nurse.name || 'Sunita Menon'}</h2>
            <div className={styles.bannerDept}>{nurse.department || 'ICU & Critical Care'} Specialist</div>
            <div className={styles.bannerQual}>{nurse.qualification || 'RN, B.Sc Nursing'} • License: {nurse.licenseNumber || 'RN-MH-44210'}</div>
          </div>
        </div>

        <div className={styles.bannerRight}>
          <div className={styles.statusWrap}>
            <span className={styles.statusLabel}>Current Shift Status:</span>
            <span className={`badge ${nurse.status === 'Active' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 13, padding: '6px 12px' }}>
              ● {nurse.status || 'Active'}
            </span>
          </div>

          <div className={styles.quotaBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              <span>Shift Attendance Quota</span>
              <span style={{ color: '#2563eb' }}>96% Present</span>
            </div>
            <div className={styles.quotaBar}>
              <div className={styles.quotaFill} style={{ width: '96%', background: '#2563eb' }}></div>
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>23 of 24 assigned shifts completed this month</div>
          </div>
        </div>
      </div>

      {/* Middle Tabs Navigation */}
      <div className={styles.tabBar}>
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className={styles.contentGrid}>
          {/* Left Column */}
          <div className={styles.colLeft}>
            {/* Card 1: Personal Information */}
            <div className={styles.infoCard}>
              <h3 className={styles.cardTitle}>Personal & Demographic Information</h3>
              <div className={styles.infoTable}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Full Legal Name:</span>
                  <span className={styles.infoVal}>Nurse {nurse.name || 'Sunita Menon'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Gender & Age:</span>
                  <span className={styles.infoVal}>{nurse.gender || 'Female'}, 34 Years</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Date of Birth:</span>
                  <span className={styles.infoVal}>{nurse.dob || '14 May 1990'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Blood Group:</span>
                  <span className={styles.infoVal}>O Positive (O+)</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Joining Tenure:</span>
                  <span className={styles.infoVal}>{nurse.joiningDate || '12 April 2021'} ({nurse.experience || '7'} yrs experience)</span>
                </div>
              </div>
            </div>

            {/* Card 2: Contact Details */}
            <div className={styles.infoCard}>
              <h3 className={styles.cardTitle}>Contact & Residential Details</h3>
              <div className={styles.infoTable}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}><Phone size={14} style={{ display: 'inline', marginRight: 6 }} />Mobile Phone:</span>
                  <span className={styles.infoVal}>{nurse.contact || '+91 98111 22334'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}><Mail size={14} style={{ display: 'inline', marginRight: 6 }} />Email Address:</span>
                  <span className={styles.infoVal}>{nurse.email || 'sunita.menon@clinic.in'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}><MapPin size={14} style={{ display: 'inline', marginRight: 6 }} />Home Address:</span>
                  <span className={styles.infoVal}>{nurse.address || 'Flat 402, Green Meadows, Andheri West, Mumbai'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Emergency Contact:</span>
                  <span className={styles.infoVal}>Rajesh Menon (Spouse) — +91 98222 11000</span>
                </div>
              </div>
            </div>

            {/* Card 3: Assigned Patients / Shift Rounds */}
            <div className={styles.infoCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Assigned Patients in Ward ({nurse.department || 'ICU'})</h3>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/nurse-station')}>Go to Station</button>
              </div>

              <div className={styles.patientList}>
                <div className={styles.patientItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ color: '#0f172a', fontSize: 14 }}>Priya Sharma (Bed 101)</strong>
                    <span className="badge badge-red">Critical Vitals</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#64748b' }}>
                    BP: 140/90 • SpO2: 98% • Checked 10 mins ago
                  </div>
                </div>

                <div className={styles.patientItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ color: '#0f172a', fontSize: 14 }}>Amitabh Verma (Bed 102)</strong>
                    <span className="badge badge-green">Stable</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#64748b' }}>
                    BP: 120/80 • Pulse: 72 bpm • Checked 30 mins ago
                  </div>
                </div>

                <div className={styles.patientItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ color: '#0f172a', fontSize: 14 }}>Sneha Joshi (Bed 104)</strong>
                    <span className="badge badge-blue">IV Drip Active</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#64748b' }}>
                    Saline 500ml • Next check due in 45 mins
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.colRight}>
            {/* Card 2: Leave Summary */}
            <div className={styles.infoCard}>
              <h3 className={styles.cardTitle}>Leave Summary & Requests</h3>
              <div className={styles.leaveGrid}>
                <div className={styles.leaveBox}>
                  <div className={styles.leaveNum}>24</div>
                  <div className={styles.leaveLabel}>Annual Quota</div>
                </div>
                <div className={styles.leaveBox}>
                  <div className={styles.leaveNum} style={{ color: '#dc2626' }}>4</div>
                  <div className={styles.leaveLabel}>Used Leaves</div>
                </div>
                <div className={styles.leaveBox}>
                  <div className={styles.leaveNum} style={{ color: '#10b981' }}>20</div>
                  <div className={styles.leaveLabel}>Available Quota</div>
                </div>
              </div>

              <button 
                type="button" 
                className={styles.btnApplyLeave} 
                style={{ width: '100%', marginTop: 16 }}
                onClick={() => setShowLeaveModal(true)}
              >
                <Calendar size={16} /> Apply for Leave
              </button>
            </div>

            {/* Card 3: Skills & Certifications */}
            <div className={styles.infoCard}>
              <h3 className={styles.cardTitle}>Clinical Skills & ACLS Certifications</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(nurse.specialties || ['ICU Critical Care', 'Ventilator Management', 'IV Cannulation', 'ACLS Certified', 'BLS Training']).map(spec => (
                  <span key={spec} className="badge badge-blue" style={{ fontSize: 12.5, padding: '6px 12px' }}>
                    ✔ {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Tabs Placeholder */}
      {activeTab !== 'overview' && (
        <div className={styles.tabPlaceholder}>
          <FileText size={48} color="#94a3b8" />
          <h3>{tabs.find(t => t.id === activeTab)?.label} Records</h3>
          <p>Detailed clinical records, training certificates, and verification files for Nurse {nurse.name} are stored securely in the hospital vault.</p>
          <button className="btn btn-outline" onClick={() => setActiveTab('overview')}>Back to Overview</button>
        </div>
      )}

      {/* Interactive Leave Request Modal */}
      {showLeaveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 20px 50px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={20} style={{ color: '#2563eb' }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Apply for Leave — Nurse {nurse.name}</h3>
              </div>
              <button onClick={() => setShowLeaveModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleApplyLeaveSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>Leave Type</label>
                <select 
                  className="form-select" 
                  value={leaveForm.type} 
                  onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}
                >
                  <option value="Sick Leave">Sick Leave / Medical</option>
                  <option value="Annual Leave">Annual Paid Leave</option>
                  <option value="Personal Leave">Personal Emergency</option>
                  <option value="Maternity/Paternity Leave">Maternity / Paternity Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>Start Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={leaveForm.start} 
                    onChange={e => setLeaveForm({ ...leaveForm, start: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>End Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={leaveForm.end} 
                    onChange={e => setLeaveForm({ ...leaveForm, end: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'block' }}>Reason for Leave</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Specify brief reason..." 
                  value={leaveForm.reason} 
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" onClick={() => setShowLeaveModal(false)} className="btn btn-outline" style={{ padding: '10px 20px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', background: '#2563eb', color: 'white', fontWeight: 700, border: 'none', borderRadius: 10 }}>
                  Submit Leave Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
