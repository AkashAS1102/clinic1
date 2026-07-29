import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, Calendar, CheckCircle2, ChevronRight, 
  Search, Filter, User, UserCheck, Plus, X, Edit2, AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './WorkingHours.module.css';

export default function WorkingHours() {
  const { shifts, updateShift, addShift } = useApp();
  const [filter, setFilter] = useState('All');
  const [selectedShift, setSelectedShift] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Edit Hours State
  const [loggedHours, setLoggedHours] = useState(40);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [attendanceStatus, setAttendanceStatus] = useState('⏰ On Duty (Checked In 08:00 AM)');

  // Add State
  const [newEmpName, setNewEmpName] = useState('');
  const [newRole, setNewRole] = useState('Staff Nurse');
  const [newDept, setNewDept] = useState('Emergency Ward');
  const [newShiftType, setNewShiftType] = useState('Morning');
  const [newAssigned, setNewAssigned] = useState('Morning (08:00 AM - 04:00 PM)');

  const shiftTypes = ['All', 'Morning', 'General', 'Evening', 'Night'];

  const filteredShifts = filter === 'All' 
    ? (shifts || []) 
    : (shifts || []).filter(s => s.shiftType === filter);

  const totalOnDuty = (shifts || []).filter(s => (s.attendanceStatus || '').includes('On Duty')).length;
  const totalLogged = (shifts || []).reduce((acc, s) => acc + (s.loggedHours || 0), 0);
  const totalOvertime = (shifts || []).reduce((acc, s) => acc + (s.overtimeHours || 0), 0);

  const openEditModal = (s) => {
    setSelectedShift(s);
    setLoggedHours(s.loggedHours || 40);
    setOvertimeHours(s.overtimeHours || 0);
    setAttendanceStatus(s.attendanceStatus || '⏰ On Duty');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedShift) return;
    updateShift(selectedShift.id, {
      loggedHours: Number(loggedHours),
      overtimeHours: Number(overtimeHours),
      attendanceStatus: attendanceStatus,
      lastCheckIn: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    });
    setToast(`Updated attendance for ${selectedShift.name}. Total Hours: ${loggedHours} hrs`);
    setTimeout(() => setToast(null), 3500);
    setSelectedShift(null);
  };

  const handleQuickClockIn = (s) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    updateShift(s.id, {
      attendanceStatus: `⏰ On Duty (Checked In ${nowStr})`,
      lastCheckIn: `Today, ${nowStr}`,
      loggedHours: (s.loggedHours || 40) + 8,
    });
    setToast(`Checked in ${s.name} for shift!`);
    setTimeout(() => setToast(null), 3500);
  };

  const handleCreateShift = (e) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;
    addShift({
      empId: `EMP-${Math.floor(1000 + Math.random() * 8999)}`,
      name: newEmpName.trim(),
      role: newRole,
      department: newDept,
      assignedShift: newAssigned,
      shiftType: newShiftType,
      weeklyStandardHours: 40,
      loggedHours: 40,
      overtimeHours: 0,
      attendanceStatus: '⏰ On Duty (Checked In Just Now)',
      lastCheckIn: 'Today, Just Now',
    });
    setToast(`Assigned ${newEmpName.trim()} to ${newShiftType} Shift!`);
    setTimeout(() => setToast(null), 3500);
    setNewEmpName('');
    setShowAddModal(false);
  };

  return (
    <div className={styles.page}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#10b981', color: 'white', padding: '14px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Hospital Head</Link> <ChevronRight size={14} /> <span>Working Hours & Shifts</span>
          </div>
          <h1 className={styles.pageTitle}>⏱️ Staff Shift Schedules & Working Hours</h1>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> + Assign New Shift
        </button>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dcfce7', color: '#16a34a' }}>
            <UserCheck />
          </div>
          <div>
            <div className={styles.statTitle}>Active On Duty Now</div>
            <div className={styles.statValue}>{totalOnDuty} Staffs</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Clock />
          </div>
          <div>
            <div className={styles.statTitle}>Hours Logged This Week</div>
            <div className={styles.statValue}>{totalLogged} hrs</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef9c3', color: '#d97706' }}>
            <AlertCircle />
          </div>
          <div>
            <div className={styles.statTitle}>Overtime Logged</div>
            <div className={styles.statValue}>{totalOvertime} hrs</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f3e8ff', color: '#7e22ce' }}>
            <Calendar />
          </div>
          <div>
            <div className={styles.statTitle}>Staff on Shift Rosters</div>
            <div className={styles.statValue}>{(shifts || []).length} Records</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        {shiftTypes.map(st => (
          <button 
            key={st} 
            className={`${styles.filterBtn} ${filter === st ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter(st)}
          >
            {st === 'All' ? `All Shifts (${(shifts || []).length})` : `${st} Shift`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {filteredShifts.map(s => (
          <div key={s.id} className={styles.shiftCard}>
            <div>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.empName}>{s.name}</div>
                  <div className={styles.empRole}>{s.role} • <span style={{ color: '#64748b' }}>{s.department}</span></div>
                </div>
                <span className={`${styles.shiftBadge} ${s.shiftType === 'Morning' ? styles.shiftMorn : s.shiftType === 'General' ? styles.shiftGen : s.shiftType === 'Evening' ? styles.shiftEve : styles.shiftNight}`}>
                  {s.shiftType}
                </span>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 10 }}>
                🗓️ {s.assignedShift}
              </div>

              <div className={styles.hoursBox}>
                <div className={styles.hoursRow}>
                  <span>Standard Hours:</span>
                  <span>{s.weeklyStandardHours || 40} hrs / wk</span>
                </div>
                <div className={styles.hoursRow}>
                  <span>Logged This Week:</span>
                  <strong style={{ color: '#2563eb' }}>{s.loggedHours || 40} hrs</strong>
                </div>
                <div className={styles.hoursRow}>
                  <span>Overtime:</span>
                  <strong style={{ color: (s.overtimeHours || 0) > 0 ? '#dc2626' : '#64748b' }}>+{s.overtimeHours || 0} hrs</strong>
                </div>
              </div>

              <div className={styles.attStatus}>
                {s.attendanceStatus}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Last Check-In: {s.lastCheckIn}</div>
            </div>

            <div className={styles.cardActions}>
              <button className={styles.btnAction} onClick={() => openEditModal(s)}>
                <Edit2 size={13} /> Edit Hours
              </button>
              <button className={`${styles.btnAction} ${styles.btnLog}`} onClick={() => handleQuickClockIn(s)}>
                <Clock size={13} /> Check In
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Hours Modal */}
      {selectedShift && (
        <div className={styles.modalOverlay} onClick={() => setSelectedShift(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Log Hours: {selectedShift.name}</h3>
              <button onClick={() => setSelectedShift(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Total Logged Hours</label>
                  <input type="number" step="0.5" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={loggedHours} onChange={e => setLoggedHours(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Overtime Hours</label>
                  <input type="number" step="0.5" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={overtimeHours} onChange={e => setOvertimeHours(e.target.value)} required />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Attendance Status</label>
                <select style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 600 }} value={attendanceStatus} onChange={e => setAttendanceStatus(e.target.value)}>
                  <option value="⏰ On Duty (Checked In 08:00 AM)">⏰ On Duty (Checked In Today)</option>
                  <option value="🌙 Shift Ended (Checked Out)">🌙 Shift Ended (Checked Out)</option>
                  <option value="🏖️ On Approved Leave">🏖️ On Approved Leave</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedShift(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Attendance Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Shift Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Assign New Staff Shift</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateShift}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Employee Full Name *</label>
                <input type="text" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} placeholder="e.g. Priya Nair" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Job Role</label>
                  <input type="text" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={newRole} onChange={e => setNewRole(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Shift Category</label>
                  <select style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 600 }} value={newShiftType} onChange={e => setNewShiftType(e.target.value)}>
                    <option value="Morning">Morning</option>
                    <option value="General">General</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Shift Timings</label>
                <input type="text" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={newAssigned} onChange={e => setNewAssigned(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Shift Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
