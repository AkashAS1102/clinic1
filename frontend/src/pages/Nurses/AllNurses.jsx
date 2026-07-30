import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, Clock, Activity, ShieldAlert, 
  ArrowUpRight, ChevronRight, Star, RefreshCw, 
  Download, Plus, CheckCircle2, X, Calendar, AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './AllNurses.module.css';

const initialNurseLeaves = [
  { id: 'NL-101', nurseId: 'NUR-4013', name: 'Meenakshi Sundaram', ward: 'Pediatric Ward', days: '2 Days (26-27 Jul)', reason: 'Family medical emergency', status: 'Pending' },
  { id: 'NL-102', nurseId: 'NUR-4018', name: 'Pooja Verma', ward: 'ICU & Critical Care', days: '1 Day (28 Jul)', reason: 'Personal work', status: 'Pending' }
];

export default function AllNurses() {
  const { nurses, updateNurse } = useApp();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState(initialNurseLeaves);

  const totalNurses = (nurses || []).length || 18;
  const activeNurses = (nurses || []).filter(n => n && n.status === 'Active').length || Math.floor(totalNurses * 0.85);
  const onLeaveNurses = totalNurses - activeNurses;

  const handleRefresh = () => {
    setToast('Nursing directory and shift schedules synced with live clinic station!');
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = () => {
    const headers = ['ID,Name,Department,Shift,Qualification,Experience,Status'];
    const rows = nurses.map(n => 
      `"${n.id || ''}","${n.name || ''}","${n.department || ''}","${n.shift || ''}","${n.qualification || ''}","${n.experience || ''} yrs","${n.status || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'clinic_nurses_roster.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast('Downloaded clinic_nurses_roster.csv successfully!');
    setTimeout(() => setToast(null), 3500);
  };

  const handleApproveLeave = (req) => {
    const targetNurse = nurses.find(n => n.id === req.nurseId || n.name === req.name);
    if (targetNurse && targetNurse.id) {
      updateNurse(targetNurse.id, { ...targetNurse, status: 'On Leave' });
    }
    setLeaveRequests(prev => prev.filter(r => r.id !== req.id));
    setToast(`Approved leave for Nurse ${req.name}. Shift status updated to On Leave.`);
    setTimeout(() => setToast(null), 3500);
  };

  const handleRejectLeave = (req) => {
    setLeaveRequests(prev => prev.filter(r => r.id !== req.id));
    setToast(`Rejected leave request for Nurse ${req.name}.`);
    setTimeout(() => setToast(null), 3500);
  };

  const topNurses = [
    { name: 'Sunita Menon', ward: 'ICU & Critical Care', qual: 'B.Sc Nursing, RN', shift: 'Morning (06:00 - 14:00)', rating: '4.9', id: 'NUR-4011' },
    { name: 'Anjali Deshmukh', ward: 'Emergency Ward', qual: 'GNM, RN', shift: 'Afternoon (14:00 - 22:00)', rating: '4.8', id: 'NUR-4012' },
    { name: 'Meenakshi Sundaram', ward: 'Pediatric Ward', qual: 'M.Sc Nursing', shift: 'Morning (06:00 - 14:00)', rating: '4.9', id: 'NUR-4013' },
    { name: 'Rekha Sharma', ward: 'Cardiology OPD', qual: 'B.Sc Nursing', shift: 'Full Day (08:00 - 20:00)', rating: '4.7', id: 'NUR-4014' },
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

      {/* Breadcrumb & Header */}
      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/nurses/all" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Nurses</Link> <ChevronRight size={14} /> <span>All Nurses</span>
          </div>
          <h1 className={styles.pageTitle}>Nursing Roster & Overview</h1>
        </div>

        <div className={styles.topButtons}>
          <button type="button" className={styles.btnRefresh} onClick={handleRefresh}>
            <RefreshCw size={15} /> Refresh Data
          </button>
          <button type="button" className={styles.btnExport} onClick={handleExport}>
            <Download size={15} /> Export As CSV
          </button>
          <button type="button" className={styles.btnAdd} onClick={() => navigate('/nurses/manage')}>
            <Plus size={16} /> Add New Nurse
          </button>
        </div>
      </div>

      {/* 4 Top Stat Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Total Nursing Staff</span>
            <div className={`${styles.statIconWrap} ${styles.blueIcon}`}>
              <Users size={22} />
            </div>
          </div>
          <div className={styles.statValue}>{totalNurses}</div>
          <div className={styles.statSub}>
            <span className={styles.statTrendUp}>+4 this quarter</span> active across wards
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Active On Shift</span>
            <div className={`${styles.statIconWrap} ${styles.greenIcon}`}>
              <UserCheck size={22} />
            </div>
          </div>
          <div className={styles.statValue}>{activeNurses}</div>
          <div className={styles.statSub}>
            <span className={styles.statTrendUp}>{Math.round((activeNurses / (totalNurses || 1)) * 100)}%</span> currently on floor duty
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>On Leave / Off Duty</span>
            <div className={`${styles.statIconWrap} ${styles.yellowIcon}`}>
              <Clock size={22} />
            </div>
          </div>
          <div className={styles.statValue}>{onLeaveNurses}</div>
          <div className={styles.statSub}>
            <span>Planned leave</span> rostered staff
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>New Onboardings</span>
            <div className={`${styles.statIconWrap} ${styles.purpleIcon}`}>
              <Activity size={22} />
            </div>
          </div>
          <div className={styles.statValue}>3</div>
          <div className={styles.statSub}>
            <span>RN & GNM Specialists</span> added in July
          </div>
        </div>
      </div>



      {/* Bottom Section: Top Performers Table & Recent Activity */}
      <div className={styles.bottomGrid}>
        {/* Top Performing Nurses Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Top Performing Nursing Staff</h3>
              <p className={styles.cardSubtitle}>Evaluated based on patient care responsiveness and vitals log timeliness</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/nurses/list')}>
              View Roster <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nurse Name & Ward</th>
                  <th>Qualification</th>
                  <th>Shift Schedule</th>
                  <th>Care Rating</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {topNurses.map((n, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{n.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{n.ward}</div>
                    </td>
                    <td>
                      <span className="badge badge-blue">{n.qual}</span>
                    </td>
                    <td style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>{n.shift}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#d97706' }}>
                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        <span>{n.rating}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>/5.0</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/nurses/details?id=${n.id}`)}
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Ward Activity */}
        <div className={styles.activityCard}>
          <h3 className={styles.cardTitle}>Recent Ward Activity & Shifts</h3>
          <p className={styles.cardSubtitle}>Real-time updates from ICU, OPD, and Nurse Station</p>

          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <div className={`${styles.timelineDot} ${styles.dotBlue}`}></div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineTitle}>Shift Handover Completed</div>
                <div className={styles.timelineDesc}>Nurse Sunita Menon completed morning ICU handover for 6 patients.</div>
                <div className={styles.timelineTime}>15 minutes ago</div>
              </div>
            </div>

            <div className={styles.timelineItem}>
              <div className={`${styles.timelineDot} ${styles.dotGreen}`}></div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineTitle}>New Nurse Onboarded</div>
                <div className={styles.timelineDesc}>Anjali Deshmukh (RN) assigned to Emergency & Trauma Ward.</div>
                <div className={styles.timelineTime}>2 hours ago</div>
              </div>
            </div>

            <div className={styles.timelineItem}>
              <div className={`${styles.timelineDot} ${styles.dotYellow}`}></div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineTitle}>Leave Request Submitted</div>
                <div className={styles.timelineDesc}>Meenakshi Sundaram applied for 2 days leave (Pediatric Ward).</div>
                <div className={styles.timelineTime}>4 hours ago</div>
              </div>
            </div>

            <div className={styles.timelineItem}>
              <div className={`${styles.timelineDot} ${styles.dotPurple}`}></div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineTitle}>Vitals Audit Completed</div>
                <div className={styles.timelineDesc}>100% vital signs recording compliance in OPD ward for morning shift.</div>
                <div className={styles.timelineTime}>Yesterday</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Bottom Quick-Action Cards */}
      <div className={styles.quickGrid}>
        <div className={styles.quickCard} onClick={() => navigate('/nurse-station')}>
          <div className={styles.quickIconWrap} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Calendar size={22} />
          </div>
          <div>
            <h4 className={styles.quickTitle}>Upcoming Shift Rounds</h4>
            <p className={styles.quickDesc}>View interactive queue and check patient vitals at Nurse Station</p>
          </div>
          <ChevronRight size={18} className={styles.quickArrow} />
        </div>

        <div className={styles.quickCard} onClick={() => setShowLeaveModal(true)}>
          <div className={styles.quickIconWrap} style={{ background: '#fef2f2', color: '#dc2626' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <h4 className={styles.quickTitle}>Pending Leave Approvals ({leaveRequests.length})</h4>
            <p className={styles.quickDesc}>Review and approve nursing staff leave requests</p>
          </div>
          <ChevronRight size={18} className={styles.quickArrow} />
        </div>

        <div className={styles.quickCard} onClick={() => {
          setToast(`Currently 3 nursing professionals on rostered leave today.`);
          setTimeout(() => setToast(null), 3500);
        }}>
          <div className={styles.quickIconWrap} style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={22} />
          </div>
          <div>
            <h4 className={styles.quickTitle}>On Leave Today (3)</h4>
            <p className={styles.quickDesc}>Check shift replacements and backup ward assignments</p>
          </div>
          <ChevronRight size={18} className={styles.quickArrow} />
        </div>

        <div className={styles.quickCard} onClick={() => navigate('/nurses/manage')}>
          <div className={styles.quickIconWrap} style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Activity size={22} />
          </div>
          <div>
            <h4 className={styles.quickTitle}>New Nurse Onboardings</h4>
            <p className={styles.quickDesc}>Add new nursing staff credentials to the clinic roster</p>
          </div>
          <ChevronRight size={18} className={styles.quickArrow} />
        </div>
      </div>

      {/* Interactive Leave Approvals Modal */}
      {showLeaveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 650, boxShadow: '0 20px 50px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldAlert size={22} style={{ color: '#2563eb' }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Pending Nurse Leave Approvals ({leaveRequests.length})</h3>
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
                  <p>No pending nurse leave requests at this moment.</p>
                </div>
              ) : (
                leaveRequests.map(req => (
                  <div key={req.id} style={{ border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 18, background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Nurse {req.name}</h4>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{req.ward} • #{req.nurseId}</span>
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
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}
                      >
                        Approve Leave
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
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
