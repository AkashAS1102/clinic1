import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  UserPlus, Stethoscope, CalendarDays, HeartPulse, Activity,
  HelpCircle, LogOut, Cross, Users, ChevronDown, ChevronRight, UserCheck,
  List, FileText, History, Building2, Briefcase, Bed, Wallet, DollarSign, Clock,
  Pill, Package, Receipt, BarChart3, ClipboardList, Settings
} from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDoctorActive = location.pathname.startsWith('/doctors') || location.pathname.startsWith('/doctor-view');
  const isNurseActive = location.pathname.startsWith('/nurses');
  const isPatientActive = location.pathname.startsWith('/patients');
  const isHeadActive = location.pathname.startsWith('/manager') || location.pathname.startsWith('/head') || location.pathname.startsWith('/portal') || location.pathname.startsWith('/staffs') || location.pathname.startsWith('/rooms');
  const isHrActive = location.pathname.startsWith('/hr');
  const isPharmacyActive = location.pathname.startsWith('/pharmacy');

  const [patientOpen, setPatientOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [nurseOpen, setNurseOpen] = useState(false);
  const [headOpen, setHeadOpen] = useState(false);
  const [hrOpen, setHrOpen] = useState(false);
  const [pharmacyOpen, setPharmacyOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <Cross size={18} strokeWidth={2.5} />
        </div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>Aarogya Hospital</span>
          <span className={styles.brandSub}>Reg. No: MH/2024/8829</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <NavLink
          to="/registration"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <UserPlus size={18} strokeWidth={1.8} />
          <span>Registration</span>
        </NavLink>

        {/* Patients Dropdown Menu */}
        <div>
          <button
            className={`${styles.navItem} ${isPatientActive ? styles.active : ''}`}
            onClick={() => {
              setPatientOpen(true);
              if (!isPatientActive) navigate('/patients/all');
              else setPatientOpen(prev => !prev);
            }}
            style={{ width: '100%', justifyContent: 'space-between', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users size={18} strokeWidth={1.8} />
              <span>Patients</span>
            </div>
            {patientOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {/* Sub Menu */}
          {patientOpen && (
            <div className={styles.subMenu}>
              <NavLink
                to="/patients/all"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <Users size={13} />
                <span>Patient Dashboard</span>
              </NavLink>
              <NavLink
                to="/patients/list"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <List size={13} />
                <span>Patients List</span>
              </NavLink>
              <NavLink
                to="/patients/details"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <FileText size={13} />
                <span>Patient Details</span>
              </NavLink>

              <NavLink
                to="/patients/history"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <History size={13} />
                <span>Patient History</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Doctors Dropdown Menu */}
        <div>
          <button
            className={`${styles.navItem} ${isDoctorActive ? styles.active : ''}`}
            onClick={() => {
              setDocOpen(true);
              if (!isDoctorActive) navigate('/doctors/all');
              else setDocOpen(prev => !prev);
            }}
            style={{ width: '100%', justifyContent: 'space-between', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Stethoscope size={18} strokeWidth={1.8} />
              <span>Doctors</span>
            </div>
            {docOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {docOpen && (
            <div className={styles.subMenu}>
              <NavLink
                to="/doctors/all"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <Users size={13} />
                <span>Doctors Dashboard</span>
              </NavLink>
              <NavLink
                to="/doctors/list"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <List size={13} />
                <span>Doctors List</span>
              </NavLink>
              <NavLink
                to="/doctors/details"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <FileText size={13} />
                <span>Doctor Details</span>
              </NavLink>

            </div>
          )}
        </div>

        <NavLink
          to="/appointments"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <CalendarDays size={18} strokeWidth={1.8} />
          <span>Appointments</span>
        </NavLink>

        {/* Nurses Dropdown */}
        <div>
          <button
            className={`${styles.navItem} ${isNurseActive ? styles.active : ''}`}
            onClick={() => {
              setNurseOpen(true);
              if (!isNurseActive) navigate('/nurses/all');
              else setNurseOpen(prev => !prev);
            }}
            style={{ width: '100%', justifyContent: 'space-between', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <UserCheck size={18} strokeWidth={1.8} />
              <span>Nurses</span>
            </div>
            {nurseOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {nurseOpen && (
            <div className={styles.subMenu}>
              <NavLink
                to="/nurses/all"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <Users size={13} />
                <span>All Nurses</span>
              </NavLink>
              <NavLink
                to="/nurses/list"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <List size={13} />
                <span>Nurses List</span>
              </NavLink>
              <NavLink
                to="/nurses/details"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <FileText size={13} />
                <span>Nurse Details</span>
              </NavLink>

            </div>
          )}
        </div>

        <NavLink
          to="/nurse-station"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <HeartPulse size={18} strokeWidth={1.8} />
          <span>Nurse Station</span>
        </NavLink>

        <NavLink
          to="/consultation"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <Activity size={18} strokeWidth={1.8} />
          <span>Consultation</span>
        </NavLink>

        {/* Head Portal Dropdown */}
        <div>
          <button
            className={`${styles.navItem} ${isHeadActive ? styles.active : ''}`}
            onClick={() => {
              setHeadOpen(true);
              if (!isHeadActive) navigate('/manager/dashboard');
              else setHeadOpen(prev => !prev);
            }}
            style={{ width: '100%', justifyContent: 'space-between', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 size={18} strokeWidth={1.8} />
              <span>Head Portal</span>
            </div>
            {headOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {headOpen && (
            <div className={styles.subMenu}>
              <NavLink
                to="/manager/dashboard"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <Building2 size={13} />
                <span>Head Overview</span>
              </NavLink>
              <NavLink
                to="/staffs/list"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <Briefcase size={13} />
                <span>Staffs & HR Roster</span>
              </NavLink>
              <NavLink
                to="/rooms/assign"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <Bed size={13} />
                <span>Room & Bed Assigns</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Manager Dropdown (Salary & Working Hours) */}
        <div>
          <button
            className={`${styles.navItem} ${isHrActive ? styles.active : ''}`}
            onClick={() => {
              setHrOpen(true);
              if (!isHrActive) navigate('/hr/salary');
              else setHrOpen(prev => !prev);
            }}
            style={{ width: '100%', justifyContent: 'space-between', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wallet size={18} strokeWidth={1.8} />
              <span>Manager</span>
            </div>
            {hrOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {hrOpen && (
            <div className={styles.subMenu}>
              <NavLink
                to="/hr/salary"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <DollarSign size={13} />
                <span>Salary Management</span>
              </NavLink>
              <NavLink
                to="/hr/shifts"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <Clock size={13} />
                <span>Working Hours & Shifts</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Pharmacy Dropdown */}
        <div>
          <button
            className={`${styles.navItem} ${isPharmacyActive ? styles.active : ''}`}
            onClick={() => {
              setPharmacyOpen(true);
              if (!isPharmacyActive) navigate('/pharmacy/dashboard');
              else setPharmacyOpen(prev => !prev);
            }}
            style={{ width: '100%', justifyContent: 'space-between', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Pill size={18} strokeWidth={1.8} />
              <span>Pharmacy</span>
            </div>
            {pharmacyOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {pharmacyOpen && (
            <div className={styles.subMenu}>
              <NavLink
                to="/pharmacy/dashboard"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <BarChart3 size={13} />
                <span>Analytics Dashboard</span>
              </NavLink>
              <NavLink
                to="/pharmacy/inventory"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <Package size={13} />
                <span>Inventory & Stock</span>
              </NavLink>
              <NavLink
                to="/pharmacy/prescriptions"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <ClipboardList size={13} />
                <span>E-Prescription Queue</span>
              </NavLink>
              <NavLink
                to="/pharmacy/billing"
                className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
              >
                <Receipt size={13} />
                <span>Billing & Returns</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Departments & Designations Dropdown */}
        <div>
          <button
            className={`${styles.navItem} ${location.pathname.startsWith('/settings') ? styles.active : ''}`}
            onClick={() => {
              setDeptOpen(!deptOpen);
              if (!location.pathname.startsWith('/settings')) navigate('/settings/master-data');
            }}
            style={{ width: '100%', justifyContent: 'space-between', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 size={18} strokeWidth={1.8} />
              <span>Dept. & Designations</span>
            </div>
            {deptOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {deptOpen && (
            <div className={styles.subMenu}>
              <NavLink
                to="/settings/master-data?tab=departments"
                className={({ isActive }) => `${styles.subNavItem} ${isActive && (!location.search || location.search.includes('departments')) ? styles.subActive : ''}`}
              >
                <List size={13} />
                <span>Department</span>
              </NavLink>
              <NavLink
                to="/settings/master-data?tab=designations"
                className={({ isActive }) => `${styles.subNavItem} ${isActive && location.search.includes('designations') ? styles.subActive : ''}`}
              >
                <Briefcase size={13} />
                <span>Designation</span>
              </NavLink>
              <NavLink
                to="/settings/master-data?tab=facility"
                className={({ isActive }) => `${styles.subNavItem} ${isActive && location.search.includes('facility') ? styles.subActive : ''}`}
              >
                <Building2 size={13} />
                <span>Facility Structure</span>
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom */}
      <div className={styles.bottom}>
        <button className={styles.bottomBtn}>
          <HelpCircle size={17} strokeWidth={1.8} />
          <span>Help Center</span>
        </button>
        <button className={`${styles.bottomBtn} ${styles.logout}`}>
          <LogOut size={17} strokeWidth={1.8} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
