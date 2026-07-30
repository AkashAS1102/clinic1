import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  RefreshCw, Download, Plus, TrendingUp, CheckCircle2, 
  Calendar, Users, ChevronRight, Sparkles, Stethoscope, 
  Clock, ShieldAlert, UserCheck, Briefcase, X, Check, AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './AllDoctors.module.css';

function DoctorAvatar({ name, photo }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['avatar-blue', 'avatar-green', 'avatar-purple', 'avatar-orange'];
  const idx = name.charCodeAt(0) % colors.length;
  if (photo) {
    return <img src={photo} alt={name} className={styles.perfPhoto} />;
  }
  return (
    <div className={`avatar ${colors[idx]}`} style={{ width: 42, height: 42, fontSize: 13 }}>
      {initials}
    </div>
  );
}

export default function AllDoctors() {
  const { doctors, updateDoctor } = useApp();
  const navigate = useNavigate();

  const [toast, setToast] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 'req-1', doctorId: doctors[0]?.id || 'DOC-8832', name: doctors[0]?.name || 'Arjun Mehta', dept: 'Cardiology', days: '3 Days (14-16 Aug)', reason: 'Annual Medical Cardiology Conference Presentation', status: 'Pending' },
    { id: 'req-2', doctorId: doctors[1]?.id || 'DOC-8833', name: doctors[1]?.name || 'Kavitha Reddy', dept: 'Pediatrics', days: '2 Days (18-19 Aug)', reason: 'Personal emergency leave requirement', status: 'Pending' },
    { id: 'req-3', doctorId: doctors[2]?.id || 'DOC-8834', name: doctors[2]?.name || 'Deepa Nair', dept: 'Neurology', days: '5 Days (21-25 Aug)', reason: 'Attending International Neurology Symposium', status: 'Pending' }
  ]);

  const totalCount = (doctors || []).length || 24;
  const activeCount = (doctors || []).filter(d => d && d.status === 'Active').length || Math.floor(totalCount * 0.9);
  const onLeaveCount = (doctors || []).filter(d => d && d.status === 'On Leave').length || 2;
  const newThisMonth = 4;

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Department', 'Qualification', 'Contact', 'Email', 'Fee', 'Status'];
    const rows = doctors.map(d => [
      d.id, `"${d.name}"`, `"${d.department}"`, `"${d.qualification || ''}"`, 
      `"${d.contact || ''}"`, `"${d.email || ''}"`, d.fee || 600, d.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'clinic_doctors_overview.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast('Successfully exported doctor analytics report to CSV file!');
    setTimeout(() => setToast(null), 4000);
  };

  const handleApproveLeave = async (req) => {
    setLeaveRequests(prev => prev.filter(r => r.id !== req.id));
    if (req.doctorId && doctors.some(d => d.id === req.doctorId)) {
      await updateDoctor(req.doctorId, { status: 'On Leave' });
    }
    setToast(`Approved leave request for Dr. ${req.name}. Status set to On Leave.`);
    setTimeout(() => setToast(null), 4000);
    if (leaveRequests.length <= 1) setShowLeaveModal(false);
  };

  const handleRejectLeave = (req) => {
    setLeaveRequests(prev => prev.filter(r => r.id !== req.id));
    setToast(`Rejected leave request for Dr. ${req.name}.`);
    setTimeout(() => setToast(null), 4000);
    if (leaveRequests.length <= 1) setShowLeaveModal(false);
  };

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
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/doctors/all" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Doctors</Link> <ChevronRight size={14} /> <span>Doctors Dashboard</span>
          </div>
          <h1 className={styles.pageTitle}>Doctors Dashboard</h1>
        </div>

        <div className={styles.topButtons}>
          <button className={styles.btnRefresh} onClick={() => window.location.reload()}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className={styles.btnExport} onClick={handleExport}>
            <Download size={15} /> Export As
          </button>
        </div>
      </div>

      {/* 4 Top Stat Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Total Doctors</span>
            <span className={styles.liveBadge}>LIVE</span>
          </div>
          <div className={styles.statValue}>{totalCount}</div>
          <div className={`${styles.statSub} ${styles.subGreen}`}>
            <TrendingUp size={14} /> +12.5% vs last quarter
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Active Doctors</span>
            <CheckCircle2 size={18} style={{ color: '#2563eb' }} />
          </div>
          <div className={styles.statValue}>{activeCount}</div>
          <div className={`${styles.statSub} ${styles.subGray}`}>
            94% OPD Attendance rate
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>On Leave</span>
            <Calendar size={18} style={{ color: '#d97706' }} />
          </div>
          <div className={styles.statValue}>{onLeaveCount}</div>
          <div className={`${styles.statSub} ${styles.subOrange}`}>
            ↗ +3% vs last month
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>New This Month</span>
            <UserCheck size={18} style={{ color: '#16a34a' }} />
          </div>
          <div className={styles.statValue}>{newThisMonth}</div>
          <div className={`${styles.statSub} ${styles.subGreen}`}>
            👥 Fast clinical growth
          </div>
        </div>
      </div>

      {/* Middle Grid: Info Cards */}
      <div className={styles.middleGrid}>
        {/* Card 1: Top Performing Doctors */}
          <div className={styles.sideCard}>
            <div className={styles.cardHeader} style={{ marginBottom: 14 }}>
              <h3 className={styles.cardTitle}>Top Performing Doctors</h3>
              <Sparkles size={18} style={{ color: '#2563eb' }} />
            </div>

            <div className={styles.perfList}>
              {doctors.slice(0, 3).map((doc, idx) => {
                const ratings = ['9.8', '9.6', '9.5'];
                return (
                  <div key={doc.id} className={styles.perfItem}>
                    <div className={styles.perfLeft}>
                      <DoctorAvatar name={doc.name} photo={doc.photo} />
                      <div>
                        <div className={styles.perfName}>Dr. {doc.name}</div>
                        <div className={styles.perfDept}>{doc.department} Dept.</div>
                      </div>
                    </div>
                    <div className={styles.perfScore}>
                      <div className={styles.scoreNum}>{ratings[idx] || '9.4'}</div>
                      <div className={styles.scoreLabel}>Rating</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button className={styles.btnLeaderboard} onClick={() => navigate('/doctors/list')}>
              Full Clinic Leaderboard
            </button>
          </div>

          {/* Card 2: Recent Activity Timeline */}
          <div className={styles.sideCard}>
            <div className={styles.cardHeader} style={{ marginBottom: 14 }}>
              <h3 className={styles.cardTitle}>Recent Activity</h3>
            </div>

            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <span className={`${styles.timelineDot} ${styles.dotBlue}`}></span>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineTitle}>Dr. Deepa Nair marked on leave</span>
                  <span className={styles.timelineTime}>10 mins ago • Neurology</span>
                </div>
              </div>

              <div className={styles.timelineItem}>
                <span className={`${styles.timelineDot} ${styles.dotGreen}`}></span>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineTitle}>New Specialist Onboarded</span>
                  <span className={styles.timelineTime}>2 hours ago • Cardiology</span>
                </div>
              </div>

              <div className={styles.timelineItem}>
                <span className={`${styles.timelineDot} ${styles.dotOrange}`}></span>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineTitle}>OPD shift roster generated</span>
                  <span className={styles.timelineTime}>5 hours ago • Pediatrics</span>
                </div>
              </div>

              <div className={styles.timelineItem}>
                <span className={`${styles.timelineDot} ${styles.dotGray}`}></span>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineTitle}>Credentials updated by Admin</span>
                  <span className={styles.timelineTime}>Yesterday • General Medicine</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* NEW: Today's OPD Schedule Section to fill space */}
      <div className={styles.scheduleSection}>
        <div className={styles.cardHeader} style={{ marginBottom: 16 }}>
          <h3 className={styles.cardTitle}>Today's OPD Schedule & Availability</h3>
          <button className={styles.linkBtn} onClick={() => navigate('/appointments')}>Full Roster</button>
        </div>
        
        <div className={styles.scheduleGrid}>
          {[
            { doc: 'Dr. Arjun Mehta', photo: 'AM', dept: 'Cardiology', time: '09:00 AM - 01:00 PM', room: 'OPD-1', status: 'On Duty', color: 'blue', patients: 18, capacity: 85 },
            { doc: 'Dr. Kavitha Reddy', photo: 'KR', dept: 'Pediatrics', time: '10:00 AM - 04:00 PM', room: 'OPD-4', status: 'In Surgery', color: 'orange', patients: 24, capacity: 100 },
            { doc: 'Dr. Rakesh Sharma', photo: 'RS', dept: 'Orthopedics', time: '11:00 AM - 05:00 PM', room: 'OPD-2', status: 'Break', color: 'gray', patients: 12, capacity: 40 },
            { doc: 'Dr. Neha Singh', photo: 'NS', dept: 'Gynecology', time: '02:00 PM - 08:00 PM', room: 'OPD-5', status: 'Upcoming', color: 'green', patients: 8, capacity: 25 }
          ].map((shift, i) => (
            <div key={i} className={styles.scheduleCard}>
              <div className={styles.shiftTop}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div className={styles.miniAvatar}>{shift.photo}</div>
                  <div>
                    <div className={styles.shiftDoc}>{shift.doc}</div>
                    <div className={styles.shiftDept}>{shift.dept}</div>
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${styles['status' + shift.color]}`}>{shift.status}</span>
              </div>
              
              <div className={styles.shiftDetails}>
                <div className={styles.shiftDetailRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} style={{ color: '#64748b' }} /> {shift.time}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#0f172a' }}>
                    <Briefcase size={13} style={{ color: '#64748b' }} /> {shift.room}
                  </div>
                </div>
                
                <div className={styles.capacityWrap}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontWeight: 600 }}>
                      <Users size={12} /> {shift.patients} Booked
                    </span>
                    <span style={{ fontWeight: 800, color: shift.capacity > 80 ? '#ef4444' : '#2563eb' }}>{shift.capacity}%</span>
                  </div>
                  <div className={styles.capacityBarBg}>
                    <div className={styles.capacityBarFill} style={{ width: `${shift.capacity}%`, background: shift.capacity > 80 ? '#ef4444' : '#2563eb' }}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Bottom Quick Stat Cards */}
      <div className={styles.bottomGrid}>
        <div className={styles.bottomCard} onClick={() => navigate('/appointments')}>
          <div className={styles.bottomLeft}>
            <div className={`${styles.bottomIconBox} ${styles.iconBoxOrange}`}>
              <Clock size={22} />
            </div>
            <div className={styles.bottomText}>
              <h4>Upcoming Consultations</h4>
              <p>18 Consultations Today</p>
            </div>
          </div>
          <ChevronRight size={18} className={styles.arrowIcon} />
        </div>

        <div className={styles.bottomCard} onClick={() => setShowLeaveModal(true)}>
          <div className={styles.bottomLeft}>
            <div className={`${styles.bottomIconBox} ${styles.iconBoxBlue}`}>
              <ShieldAlert size={22} />
            </div>
            <div className={styles.bottomText}>
              <h4>Pending Leave Approvals</h4>
              <p>{leaveRequests.length} Doctor Requests</p>
            </div>
          </div>
          <ChevronRight size={18} className={styles.arrowIcon} />
        </div>

        <div className={styles.bottomCard} onClick={() => navigate('/doctors/list')}>
          <div className={styles.bottomLeft}>
            <div className={`${styles.bottomIconBox} ${styles.iconBoxGray}`}>
              <Users size={22} />
            </div>
            <div className={styles.bottomText}>
              <h4>On Leave Today</h4>
              <p>{onLeaveCount} Specialists off duty</p>
            </div>
          </div>
          <ChevronRight size={18} className={styles.arrowIcon} />
        </div>

        <div className={styles.bottomCard} onClick={() => navigate('/doctors/manage')}>
          <div className={styles.bottomLeft}>
            <div className={`${styles.bottomIconBox} ${styles.iconBoxDark}`}>
              <Briefcase size={22} />
            </div>
            <div className={styles.bottomText}>
              <h4>New Onboardings</h4>
              <p>02 Physicians joining</p>
            </div>
          </div>
          <ChevronRight size={18} className={styles.arrowIcon} />
        </div>
      </div>

      {/* Interactive Leave Approvals Modal */}
      {showLeaveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 650, boxShadow: '0 20px 50px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldAlert size={22} style={{ color: '#2563eb' }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Pending Leave Approvals ({leaveRequests.length})</h3>
              </div>
              <button onClick={() => setShowLeaveModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: 24, maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {leaveRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <CheckCircle2 size={48} style={{ color: '#10b981', margin: '0 auto 12px' }} />
                  <h4>All caught up!</h4>
                  <p>No pending doctor leave requests at this moment.</p>
                </div>
              ) : (
                leaveRequests.map(req => (
                  <div key={req.id} style={{ border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 18, background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Dr. {req.name}</h4>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{req.dept} Department • #{req.doctorId}</span>
                      </div>
                      <span style={{ background: '#fef9c3', color: '#ca8a04', fontWeight: 800, fontSize: 11, padding: '4px 10px', borderRadius: 6 }}>
                        {req.days}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#334155', background: '#f8fafc', padding: '10px 14px', borderRadius: 8 }}>
                      <strong>Reason:</strong> {req.reason}
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleRejectLeave(req)} 
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #f87171', background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleApproveLeave(req)} 
                        style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#10b981', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Check size={16} /> Approve & Mark Leave
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
              <button onClick={() => setShowLeaveModal(false)} className="btn btn-outline" style={{ padding: '8px 20px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
