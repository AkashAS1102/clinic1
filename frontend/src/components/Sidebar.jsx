// Sidebar — LeadLogic-style redesign
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  UserPlus, Stethoscope, CalendarDays, HeartPulse, Activity,
  HelpCircle, LogOut, Cross, Users, ChevronDown, ChevronRight, UserCheck,
  List, FileText, History, Building2, Briefcase, Bed, BedDouble, Wallet, DollarSign, Clock,
  Pill, Package, Receipt, BarChart3, ClipboardList, Settings, RefreshCcw, LayoutDashboard
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { clinicInfo } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const isDoctorActive = location.pathname.startsWith('/doctors') || location.pathname.startsWith('/doctor-view');
  const isNurseActive = location.pathname.startsWith('/nurses');
  const isPatientActive = location.pathname.startsWith('/patients');
  const isIpActive = location.pathname.startsWith('/ip-patients');
  const isPharmacyActive = location.pathname.startsWith('/pharmacy');
  const isRoomBookingActive = location.pathname.startsWith('/room-booking');
  const isStockManagementActive = location.pathname.startsWith('/stock-management');

  const [patientOpen, setPatientOpen] = useState(isPatientActive);
  const [docOpen, setDocOpen] = useState(isDoctorActive);
  const [nurseOpen, setNurseOpen] = useState(isNurseActive);
  const [ipOpen, setIpOpen] = useState(isIpActive);
  const [pharmacyOpen, setPharmacyOpen] = useState(isPharmacyActive);
  const [roomBookingOpen, setRoomBookingOpen] = useState(isRoomBookingActive);
  const [stockOpen, setStockOpen] = useState(isStockManagementActive);
  const [deptOpen, setDeptOpen] = useState(location.pathname.startsWith('/settings'));

  const NavItem = ({ to, icon: Icon, label, end = false }) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
    >
      <Icon size={17} strokeWidth={1.8} />
      <span>{label}</span>
    </NavLink>
  );

  const DropdownItem = ({ isActive: active, icon: Icon, label, isOpen, onToggle, children }) => (
    <div className={styles.dropdownWrapper}>
      <button
        className={`${styles.navItem} ${active ? styles.active : ''}`}
        onClick={onToggle}
      >
        <div className={styles.navItemInner}>
          <Icon size={17} strokeWidth={1.8} />
          <span>{label}</span>
        </div>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
          <ChevronRight size={13} strokeWidth={2} />
        </span>
      </button>
      {isOpen && (
        <div className={styles.subMenu}>
          {children}
        </div>
      )}
    </div>
  );

  const SubItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.subActive : ''}`}
    >
      <Icon size={13} strokeWidth={1.8} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <aside className={styles.sidebar}>
      {/* Apple spatial: specular top highlight */}
      <div className={styles.specularLine} />
      {/* Ambient orb — bottom-right */}
      <div className={styles.orbBottom} />
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <Cross size={16} strokeWidth={2.5} />
        </div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>{clinicInfo?.name || 'Aarogya'}</span>
          <span className={styles.brandSub}>Hospital Management</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <span className={styles.sectionLabel}>NAVIGATION</span>

        <NavItem to="/registration" icon={UserPlus} label="Registration" />

        <DropdownItem
          isActive={isIpActive}
          icon={BedDouble}
          label="IP Patients"
          isOpen={ipOpen}
          onToggle={() => {
            if (!isIpActive) { setIpOpen(true); navigate('/ip-patients'); }
            else setIpOpen(p => !p);
          }}
        >
          <SubItem to="/ip-patients/queue" icon={Clock} label="IP Triage Queue" />
          <SubItem to="/ip-patients/stay" icon={Activity} label="In-Patient Stay" />
        </DropdownItem>

        <NavItem to="/appointments" icon={CalendarDays} label="Appointments" />
        <NavItem to="/nurse-station" icon={HeartPulse} label="OP Nurse" />
        <NavItem to="/consultation" icon={Activity} label="Consultation" />

        <NavItem to="/pharmacy/dashboard" icon={Pill} label="Pharmacy" />

        <NavItem to="/billing/unified" icon={Receipt} label="Unified Billing" />
        <NavItem to="/billing" end icon={DollarSign} label="Central Billing" />

        <DropdownItem
          isActive={isRoomBookingActive}
          icon={Building2}
          label="Room Booking"
          isOpen={roomBookingOpen}
          onToggle={() => {
            if (!isRoomBookingActive) { setRoomBookingOpen(true); navigate('/room-booking/generator'); }
            else setRoomBookingOpen(p => !p);
          }}
        >
          <SubItem to="/room-booking/generator" icon={Building2} label="Room Generator" />
          <SubItem to="/room-booking/allocate" icon={Bed} label="Room Allocate" />
          <SubItem to="/room-booking/bed-management" icon={Bed} label="Bed Management" />
        </DropdownItem>

        <DropdownItem
          isActive={isPatientActive}
          icon={Users}
          label="Patients"
          isOpen={patientOpen}
          onToggle={() => {
            if (!isPatientActive) { setPatientOpen(true); navigate('/patients/all'); }
            else setPatientOpen(p => !p);
          }}
        >
          <SubItem to="/patients/all" icon={LayoutDashboard} label="Patient Dashboard" />
          <SubItem to="/patients/list" icon={List} label="Patients List" />
          <SubItem to="/patients/details" icon={FileText} label="Patient Details" />
          <SubItem to="/patients/history" icon={History} label="Patient History" />
        </DropdownItem>

        <DropdownItem
          isActive={isDoctorActive}
          icon={Stethoscope}
          label="Doctors"
          isOpen={docOpen}
          onToggle={() => {
            if (!isDoctorActive) { setDocOpen(true); navigate('/doctors/all'); }
            else setDocOpen(p => !p);
          }}
        >
          <SubItem to="/doctors/all" icon={LayoutDashboard} label="Doctors Dashboard" />
          <SubItem to="/doctors/list" icon={List} label="Doctors List" />
          <SubItem to="/doctors/details" icon={FileText} label="Doctor Details" />
        </DropdownItem>

        <DropdownItem
          isActive={isNurseActive}
          icon={UserCheck}
          label="Nurses"
          isOpen={nurseOpen}
          onToggle={() => {
            if (!isNurseActive) { setNurseOpen(true); navigate('/nurses/all'); }
            else setNurseOpen(p => !p);
          }}
        >
          <SubItem to="/nurses/all" icon={Users} label="All Nurses" />
          <SubItem to="/nurses/list" icon={List} label="Nurses List" />
          <SubItem to="/nurses/details" icon={FileText} label="Nurse Details" />
        </DropdownItem>

        <DropdownItem
          isActive={isStockManagementActive}
          icon={Package}
          label="Stock Mgmt"
          isOpen={stockOpen}
          onToggle={() => {
            if (!isStockManagementActive) { setStockOpen(true); navigate('/stock-management/catalog'); }
            else setStockOpen(p => !p);
          }}
        >
          <SubItem to="/stock-management/catalog" icon={Package} label="Product Master" />
          <SubItem to="/stock-management/po" icon={Receipt} label="Purchase Orders" />
          <SubItem to="/stock-management/grn" icon={ClipboardList} label="Goods Receipt" />
          <SubItem to="/stock-management/returns" icon={RefreshCcw} label="Purchase Returns" />
        </DropdownItem>

        {/* Settings Section */}
        <span className={styles.sectionLabel} style={{ marginTop: 8 }}>SETTINGS</span>

        <DropdownItem
          isActive={location.pathname.startsWith('/settings')}
          icon={Building2}
          label="Facility Settings"
          isOpen={deptOpen}
          onToggle={() => {
            if (!location.pathname.startsWith('/settings')) { setDeptOpen(true); navigate('/settings/departments'); }
            else setDeptOpen(p => !p);
          }}
        >
          <SubItem to="/settings/rooms" icon={BedDouble} label="Rooms & Beds" />
          <SubItem to="/settings/departments" icon={List} label="Department" />
          <SubItem to="/settings/designations" icon={Briefcase} label="Designation" />
          <SubItem to="/settings/clinic-info" icon={Settings} label="Clinic Info" />
        </DropdownItem>
      </nav>

      {/* Bottom */}
      <div className={styles.bottom}>
        <button className={styles.bottomBtn}>
          <HelpCircle size={16} strokeWidth={1.8} />
          <span>Help Centre</span>
        </button>

        <div className={styles.userCard}>
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=doctor&backgroundColor=b6e3f4"
            alt="User"
            className={styles.userAvatar}
          />
          <div className={styles.userInfo}>
            <span className={styles.userName}>Admin User</span>
            <span className={styles.userRole}>Manager</span>
          </div>
          <button className={styles.logoutBtn} title="Logout">
            <LogOut size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </aside>
  );
}
