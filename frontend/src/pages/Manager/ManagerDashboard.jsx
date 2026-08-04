import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Stethoscope, UserCheck, Briefcase, Bed, 
  Activity, ChevronRight, Plus, Eye, Award, ShieldCheck, 
  Calendar, ArrowUpRight, CheckCircle2, Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './ManagerDashboard.module.css';

export default function ManagerDashboard() {
  const { patients, doctors, nurses, staffs, rooms, pharmacyBills } = useApp();
  const navigate = useNavigate();

  const totalPatients = (patients || []).length;
  const totalDoctors = (doctors || []).length;
  const totalNurses = (nurses || []).length;
  const totalStaffs = (staffs || []).length;
  const totalRooms = (rooms || []).length;
  const occupiedRooms = (rooms || []).filter(r => r && r.status === 'Occupied').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Mock data for Patient Volume Trend (last 7 days)
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      count: Math.floor(Math.random() * (120 - 50 + 1) + 50)
    };
  });
  const maxPatientCount = Math.max(...last7DaysData.map(d => d.count), 1);

  // Pharmacy Revenue Data
  const bills = pharmacyBills || [];
  const revenueByMethod = { 'Cash': 0, 'UPI': 0, 'Card': 0 };
  let totalRevenue = 0;
  bills.forEach(b => {
    if (b.status === 'Paid') {
      const p = (b.paymentMethod || '').toLowerCase();
      let key = 'Cash';
      if (p.includes('upi') || p.includes('gpay')) key = 'UPI';
      else if (p.includes('card')) key = 'Card';
      revenueByMethod[key] += b.total;
      totalRevenue += b.total;
    }
  });
  const maxRevenue = Math.max(...Object.values(revenueByMethod), 1);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <span>Hospital Head Overview</span>
          </div>
          <h1 className={styles.pageTitle}>🏢 Executive Hospital Head Hub</h1>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate('/hr/salary')}>
            💰 Manage Salary & Payroll
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/rooms/assign')}>
            <Bed size={16} /> View Bed Allocations
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/staffs/list')}>
            <Briefcase size={16} /> Manage Hospital Staffs
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard} onClick={() => navigate('/patients/all')}>
          <div className={styles.kpiIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Users size={26} />
          </div>
          <div>
            <div className={styles.kpiTitle}>Total Patients</div>
            <div className={styles.kpiValue}>{totalPatients}</div>
            <div className={styles.kpiSub}>↗ Active EMR Records</div>
          </div>
        </div>

        <div className={styles.kpiCard} onClick={() => navigate('/doctors/all')}>
          <div className={styles.kpiIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Stethoscope size={26} />
          </div>
          <div>
            <div className={styles.kpiTitle}>Doctors Directory</div>
            <div className={styles.kpiValue}>{totalDoctors}</div>
            <div className={styles.kpiSub}>✓ 6 Specialties On-call</div>
          </div>
        </div>

        <div className={styles.kpiCard} onClick={() => navigate('/nurses/all')}>
          <div className={styles.kpiIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
            <UserCheck size={26} />
          </div>
          <div>
            <div className={styles.kpiTitle}>Nurses Station Team</div>
            <div className={styles.kpiValue}>{totalNurses}</div>
            <div className={styles.kpiSub}>⚡ Triage & ICU Active</div>
          </div>
        </div>

        <div className={styles.kpiCard} onClick={() => navigate('/staffs/list')}>
          <div className={styles.kpiIcon} style={{ background: '#f3e8ff', color: '#7e22ce' }}>
            <Briefcase size={26} />
          </div>
          <div>
            <div className={styles.kpiTitle}>Support Staffs</div>
            <div className={styles.kpiValue}>{totalStaffs}</div>
            <div className={styles.kpiSub}>📋 Admin, Lab & Pharmacy</div>
          </div>
        </div>

        <div className={styles.kpiCard} onClick={() => navigate('/rooms/assign')}>
          <div className={styles.kpiIcon} style={{ background: '#ffe4e6', color: '#e11d48' }}>
            <Bed size={26} />
          </div>
          <div>
            <div className={styles.kpiTitle}>Ward Occupancy Rate</div>
            <div className={styles.kpiValue}>{occupancyRate}%</div>
            <div className={styles.kpiSub} style={{ color: '#e11d48' }}>🛏️ {occupiedRooms} / {totalRooms} Beds Occupied</div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', marginTop: '24px' }}>Analytics & Trends</h2>
      <div className={styles.sectionGrid} style={{ marginBottom: '24px' }}>
        
        {/* Bed Occupancy Bar */}
        <div className={styles.card} style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className={styles.cardTitle} style={{ marginBottom: '20px' }}>Bed Occupancy</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
              <span style={{ color: '#475569' }}>Occupied: {occupiedRooms}</span>
              <span style={{ color: '#475569' }}>Total: {totalRooms}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <svg width="100%" height="24" style={{ borderRadius: '12px', background: '#f1f5f9' }}>
                <rect width={`${occupancyRate}%`} height="24" fill="#3b82f6" rx="12" />
              </svg>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', width: '45px' }}>{occupancyRate}%</span>
            </div>
          </div>
        </div>

        {/* Patient Volume Trend */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Patient Volume (7 Days)</h3>
          <svg width="100%" height="140" viewBox="0 0 350 140">
            {/* Grid lines */}
            <line x1="0" y1="10" x2="350" y2="10" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="55" x2="350" y2="55" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="100" x2="350" y2="100" stroke="#e2e8f0" strokeWidth="1" />
            
            {last7DaysData.map((d, i) => {
              const height = (d.count / maxPatientCount) * 90;
              const y = 100 - height;
              const x = 20 + i * 48;
              return (
                <g key={i}>
                  <rect x={x} y={y} width="24" height={height} fill="#8b5cf6" rx="4" />
                  <text x={x + 12} y="118" fontSize="10" fill="#64748b" textAnchor="middle">{d.day}</text>
                  <text x={x + 12} y={y - 5} fontSize="10" fill="#475569" fontWeight="600" textAnchor="middle">{d.count}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Pharmacy Revenue */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Pharmacy Revenue by Mode</h3>
          <svg width="100%" height="140" viewBox="0 0 350 140">
            <line x1="0" y1="10" x2="350" y2="10" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="55" x2="350" y2="55" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="100" x2="350" y2="100" stroke="#e2e8f0" strokeWidth="1" />
            
            {Object.entries(revenueByMethod).map(([mode, rev], i) => {
              const height = maxRevenue > 0 ? (rev / maxRevenue) * 90 : 0;
              const y = 100 - height;
              const x = 50 + i * 90;
              const colors = ['#10b981', '#f59e0b', '#3b82f6'];
              return (
                <g key={mode}>
                  <rect x={x} y={y} width="40" height={height} fill={colors[i]} rx="4" />
                  <text x={x + 20} y="118" fontSize="11" fill="#64748b" textAnchor="middle">{mode}</text>
                  <text x={x + 20} y={y - 5} fontSize="10" fill="#475569" fontWeight="600" textAnchor="middle">₹{(rev/1000).toFixed(1)}k</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.sectionGrid}>
        {/* Left: Ward & Room Assignment Status */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <Bed size={20} style={{ color: '#e11d48' }} /> Live Room & Bed Allocation Summary
            </h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/rooms/assign')}>
              Manage All Room Assigns →
            </button>
          </div>

          <div>
            {(rooms || []).slice(0, 5).map(room => {
              if (!room) return null;
              const roomNo = room.roomNo || 'Room';
              const wardNo = room.ward || 'General Ward';
              const shortNo = roomNo.split(' ')[1] || roomNo.slice(0, 3);
              return (
                <div key={room.id || Math.random()} className={styles.roomRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: room.status === 'Occupied' ? '#fee2e2' : room.status === 'Available' ? '#dcfce7' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: room.status === 'Occupied' ? '#dc2626' : room.status === 'Available' ? '#16a34a' : '#d97706', fontSize: 13 }}>
                      {shortNo}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{roomNo} • {wardNo}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {room.status === 'Occupied' 
                          ? `👤 Patient: ${room.patientName || 'Assigned'} (Attending: ${room.assignedDoctor || 'Doctor'})`
                          : room.notes || room.type || 'Standard Bed'}
                      </div>
                    </div>
                  </div>
                  <span className={`${styles.badge} ${room.status === 'Occupied' ? styles.badgeOccupied : room.status === 'Available' ? styles.badgeAvailable : styles.badgeMaint}`}>
                    {room.status || 'Available'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Executive Actions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <Activity size={20} style={{ color: '#2563eb' }} /> Hospital Head Actions
            </h3>
          </div>

          <div className={styles.quickActions}>
            <button className={styles.actionBtn} onClick={() => navigate('/hr/salary')}>
              <Award size={22} style={{ color: '#059669' }} />
              <span>Salary & Payroll</span>
            </button>
            <button className={styles.actionBtn} onClick={() => navigate('/hr/shifts')}>
              <Calendar size={22} style={{ color: '#0284c7' }} />
              <span>Working Hours & Shifts</span>
            </button>
            <button className={styles.actionBtn} onClick={() => navigate('/staffs/list')}>
              <Briefcase size={22} style={{ color: '#7e22ce' }} />
              <span>Manage Hospital Staffs</span>
            </button>
            <button className={styles.actionBtn} onClick={() => navigate('/rooms/assign')}>
              <Bed size={22} style={{ color: '#e11d48' }} />
              <span>Assign Patient Room / Bed</span>
            </button>
            <button className={styles.actionBtn} onClick={() => navigate('/doctors/manage')}>
              <Stethoscope size={22} style={{ color: '#16a34a' }} />
              <span>Add New Doctor</span>
            </button>
            <button className={styles.actionBtn} onClick={() => navigate('/nurses/manage')}>
              <UserCheck size={22} style={{ color: '#d97706' }} />
              <span>Add New Nurse</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
