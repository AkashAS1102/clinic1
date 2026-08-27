import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BedDouble, Bed, Search, X, Zap, HandMetal, CheckCircle2, User,
  Building2, AlertCircle, Clock, ArrowRight, Star, RefreshCw,
  Filter, Wind, Activity, Heart, Shield, Droplets, Calendar,
  Stethoscope, UserCheck, ChevronDown, Info, Tag, Users,
  MapPin, ClipboardList, CalendarClock, LayoutGrid, List,
  DollarSign, Edit2, Check, Wrench, WifiOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './RoomAllocation.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  'Cardiology','General Medicine','Orthopedics','Neurology','Oncology',
  'Gastroenterology','Pulmonology','Nephrology','Urology','Obstetrics & Gynecology',
  'Pediatrics','ENT','Ophthalmology','Dermatology','Psychiatry','General Surgery',
];
const CARE_LEVELS = [
  { value: 'General', label: 'General Ward', icon: '🛏️', color: '#2563eb' },
  { value: 'High Dependency (HDU)', label: 'High Dependency (HDU)', icon: '📊', color: '#d97706' },
  { value: 'Critical / ICU', label: 'Critical / ICU', icon: '🚨', color: '#dc2626' },
];
// care-level → preferred room types (priority order)
const CARE_ROOM_MAP = {
  'Critical / ICU':        ['ICU Ventilator Bed','ICU Bed','HDU Bed'],
  'High Dependency (HDU)': ['HDU Bed','ICU Bed','Semi-Private Room'],
  'General':               ['General Bed','Semi-Private Room','Private AC Suite','Maternity Suite','VIP Suite'],
};
const STAFF = ['Dr. Arjun Mehta','Dr. Kavitha Reddy','Dr. Sanjay Patel','Dr. Neha Sharma','Dr. Priya Rao','Dr. Vikram Rao','Receptionist Ananya Verma','Nurse Coordinator'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
}
const AVATAR_COLORS = ['#2563eb','#7c3aed','#db2777','#ea580c','#16a34a','#0891b2'];
function avatarColor(name = '') {
  const str = name || '';
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h + str.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

// ── Equipment badge labels ────────────────────────────────────────────────────
const EQ = {
  oxygen:     { icon: <Droplets size={9} />,  label: 'O₂', color: '#0891b2' },
  monitor:    { icon: <Activity size={9} />,  label: 'Mon', color: '#7c3aed' },
  ventilator: { icon: <Wind size={9} />,      label: 'Vent', color: '#dc2626' },
  cardiac:    { icon: <Heart size={9} />,     label: 'ECG', color: '#e11d48' },
  isolation:  { icon: <Shield size={9} />,    label: 'Iso', color: '#d97706' },
};

// ── Bed Card for the dark glassmorphism bed map ───────────────────────────────
function BedCard({ room, selected, onClick }) {
  const isAvail = room.status === 'Available';
  const isMaint = room.status === 'Cleaning / Maintenance';
  const eq = room.equipment || {};

  let statusClass = styles.bedOccupied;
  if (isAvail) statusClass = styles.bedAvailable;
  if (isMaint) statusClass = styles.bedMaintenance;
  if (selected) statusClass = styles.bedSelected;

  return (
    <div
      className={`${styles.bedCard} ${statusClass}`}
      onClick={() => isAvail && onClick(room)}
      title={!isAvail ? room.status : `Click to select — ${room.type}`}
    >
      {/* Room id top-right */}
      <div className={styles.bedId}>{room.id}</div>

      {/* Room number */}
      <div className={styles.bedRoomNo}>
        <Bed size={12} className={styles.bedIcon} />
        {room.roomNo}{room.bedNo && room.bedNo !== 'Single' ? `-${room.bedNo}` : ''}
      </div>

      {/* Type */}
      <div className={styles.bedType}>{room.type}</div>

      {/* Gender */}
      {room.gender && room.gender !== 'Mixed' && (
        <div className={styles.bedGender} style={{ color: room.gender === 'Female' ? '#db2777' : '#2563eb' }}>
          <Users size={9} /> {room.gender}
        </div>
      )}

      {/* Equipment pills */}
      {Object.keys(eq).some(k => eq[k]) && (
        <div className={styles.bedEquipRow}>
          {Object.entries(EQ).map(([key, cfg]) =>
            eq[key] ? (
              <span key={key} className={styles.eqPill} style={{ color: cfg.color, borderColor: cfg.color + '44' }}>
                {cfg.icon}{cfg.label}
              </span>
            ) : null
          )}
        </div>
      )}

      {/* Status overlay label */}
      <div className={styles.bedStatusLabel}>
        {isAvail && <><CheckCircle2 size={10} /> Available</>}
        {!isAvail && !isMaint && <><AlertCircle size={10} /> Occupied</>}
        {isMaint && <><Clock size={10} /> Maintenance</>}
        {selected && <><Star size={10} style={{ marginLeft: 4 }} /> Selected</>}
      </div>

      {/* Price */}
      <div className={styles.bedPrice}>{room.price}</div>

      {/* Occupied by */}
      {room.patientName && (
        <div className={styles.bedOccupiedBy}>
          <User size={9} /> {room.patientName.split(' ')[0]}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function RoomAllocation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { ipPatients, rooms, allocateRoomToIpPatient, doctors, updateRoom } = useApp();

  // ── Top-level tab ─────────────────────────────────────────────────────────
  const [pageTab, setPageTab] = useState(location.state?.showInventory ? 'inventory' : 'allocation'); // 'allocation' | 'inventory'

  // ── Inventory state ───────────────────────────────────────────────────────
  const [invSearch, setInvSearch]       = useState('');
  const [invWard,   setInvWard]         = useState('All');
  const [invStatus, setInvStatus]       = useState(location.state?.showInventory ? 'Occupied' : 'All');
  const [invType,   setInvType]         = useState('All');
  const [invView,   setInvView]         = useState('table'); // 'table' | 'grid'
  const [editingRoomStatus, setEditingRoomStatus] = useState(null);

  const wardOptions = useMemo(() =>
    ['All', ...new Set((rooms||[]).map(r=>r.ward).filter(Boolean))], [rooms]);
  const typeOptions = useMemo(() =>
    ['All', ...new Set((rooms||[]).map(r=>r.type).filter(Boolean))], [rooms]);

  const inventoryRooms = useMemo(() =>
    (rooms||[]).filter(r => {
      if (invWard   !== 'All' && r.ward   !== invWard)   return false;
      if (invStatus !== 'All' && r.status !== invStatus) return false;
      if (invType   !== 'All' && r.type   !== invType)   return false;
      if (invSearch) {
        const q = invSearch.toLowerCase();
        if (!(r.roomNo||'').toLowerCase().includes(q) &&
            !(r.id||'').toLowerCase().includes(q) &&
            !(r.block||'').toLowerCase().includes(q) &&
            !(r.ward||'').toLowerCase().includes(q) &&
            !(r.type||'').toLowerCase().includes(q) &&
            (r.patientName ? !r.patientName.toLowerCase().includes(q) : true))
          return false;
      }
      return true;
    }).sort((a, b) => {
      const o = {'Available':0,'Cleaning / Maintenance':1,'Occupied':2};
      return (o[a.status]??3)-(o[b.status]??3);
    }), [rooms, invSearch, invWard, invStatus, invType]);

  const statusCounts = useMemo(() => ({
    available:   (rooms||[]).filter(r=>r.status==='Available').length,
    occupied:    (rooms||[]).filter(r=>r.status==='Occupied').length,
    maintenance: (rooms||[]).filter(r=>r.status==='Cleaning / Maintenance').length,
  }), [rooms]);

  const handleStatusChange = (roomId, newStatus) => {
    if (updateRoom) {
      updateRoom(roomId, { status: newStatus, ...(newStatus==='Available' ? { patientId:null, patientName:null, assignedDoctor:null, admissionDate:null } : {}) });
    }
    setEditingRoomStatus(null);
  };

  // ── Step ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1); // 1=select patient, 2=patient details, 3=pick room, 4=confirm

  // Step 1
  const [searchIP, setSearchIP] = useState('');
  const [selectedIP, setSelectedIP] = useState(null);

  // Step 2 — Patient detail form
  const [department, setDepartment]   = useState('');
  const [admittingDoctor, setAdmittingDoctor] = useState('');
  const [careLevel, setCareLevel]     = useState('General');
  const [preferGender, setPreferGender] = useState('Mixed');
  const [specialReq, setSpecialReq]   = useState('');

  // Step 3 — Room selection
  const [mode, setMode]               = useState(null); // 'auto' | 'manual'
  const [manualFilter, setManualFilter] = useState('');
  const [wardFilter, setWardFilter]   = useState('All');
  const [statusFilter, setStatusFilter] = useState('Available');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [autoSuggested, setAutoSuggested] = useState(null);

  // Step 4 — Metadata
  const [admissionDateTime, setAdmissionDateTime] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [expectedDischarge, setExpectedDischarge] = useState('');
  const [allocatedBy, setAllocatedBy] = useState(STAFF[0]);
  const [allocationNotes, setAllocationNotes] = useState('');

  // Toast
  const [toast, setToast] = useState(null);

  // ── Derived data ──────────────────────────────────────────────────────────
  const activeIpPatients = useMemo(() =>
    ipPatients.filter(p => p.status !== 'Discharged'), [ipPatients]);

  const filteredIpPatients = useMemo(() =>
    activeIpPatients.filter(p =>
      !searchIP ||
      (p.patientName || '').toLowerCase().includes(searchIP.toLowerCase()) ||
      (p.patientId  || '').toLowerCase().includes(searchIP.toLowerCase())
    ), [activeIpPatients, searchIP]);


  const manualRooms = useMemo(() =>
    (rooms || [])
      .filter(r => {
        if (statusFilter !== 'All' && r.status !== statusFilter) return false;
        if (wardFilter !== 'All' && r.ward !== wardFilter) return false;
        if (manualFilter) {
          const q = manualFilter.toLowerCase();
          if (!(r.roomNo||'').toLowerCase().includes(q) &&
              !(r.type||'').toLowerCase().includes(q) &&
              !(r.block||'').toLowerCase().includes(q) &&
              !(r.ward||'').toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const o = { 'Available': 0, 'Cleaning / Maintenance': 1, 'Occupied': 2 };
        return (o[a.status] ?? 3) - (o[b.status] ?? 3);
      }), [rooms, manualFilter, wardFilter, statusFilter]);

  // ── Auto-suggest ──────────────────────────────────────────────────────────
  const autoSuggestRoom = (level, gender) => {
    const preferredTypes = CARE_ROOM_MAP[level] || CARE_ROOM_MAP['General'];
    const available = rooms.filter(r => r.status === 'Available');
    let best = null;
    for (const type of preferredTypes) {
      // Gender-matched first
      if (gender && gender !== 'Mixed') {
        best = available.find(r => r.type === type && (r.gender === gender || r.gender === 'Mixed'));
      }
      if (!best) best = available.find(r => r.type === type);
      if (best) break;
    }
    return best || available[0] || null;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelectPatient = (ip) => {
    setSelectedIP(ip);
    setDepartment(ip.department || '');
    setAdmittingDoctor(ip.doctorName || '');
    setCareLevel(ip.careLevel || 'General');
    setStep(2);
  };

  useEffect(() => {
    if (location.state?.patientId) {
      const pid = location.state.patientId;
      const patient = activeIpPatients.find(p => p.id === pid || p.patientId === pid);
      if (patient) {
        handleSelectPatient(patient);
      }
    }
  }, [location.state, activeIpPatients]);

  const handleGoToRoomStep = () => {
    setSelectedRoom(null);
    setMode(null);
    setAutoSuggested(null);
    setStep(3);
  };

  const handleAutoMode = () => {
    setMode('auto');
    setSelectedRoom(null);
    const s = autoSuggestRoom(careLevel, preferGender);
    setAutoSuggested(s);
    setSelectedRoom(s);
  };

  const handleManualMode = () => {
    setMode('manual');
    setSelectedRoom(null);
    setAutoSuggested(null);
  };

  const handleGoToConfirm = () => setStep(4);

  const handleConfirm = () => {
    if (!selectedIP || !selectedRoom) return;
    allocateRoomToIpPatient(selectedIP.id, selectedRoom.id, {
      admissionDateTime, expectedDischarge, allocatedBy, allocationNotes,
      department, admittingDoctor, careLevel,
    });
    showToast(`✓ Bed ${selectedRoom.roomNo}${selectedRoom.bedNo && selectedRoom.bedNo !== 'Single' ? '-'+selectedRoom.bedNo : ''} allocated to ${selectedIP.patientName}`);
    // Reset
    navigate('/ip-patients/stay', { state: { patientId: selectedIP.id } });
    setSelectedIP(null);
    setSelectedRoom(null);
    setMode(null);
    setAutoSuggested(null);
    setAdmissionDateTime(new Date().toISOString().slice(0, 16));
    setExpectedDischarge('');
    setAllocationNotes('');
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  // ── Step indicator ────────────────────────────────────────────────────────
  const steps = [
    { n: 1, label: 'Select Patient' },
    { n: 2, label: 'Patient Details' },
    { n: 3, label: 'Choose Room' },
    { n: 4, label: 'Confirm & Allocate' },
  ];

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div className={styles.toast}><CheckCircle2 size={15} /> {toast}</div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.headerIcon}><BedDouble size={22} /></div>
          <div>
            <h1 className={styles.title}>Patient Room Allocation</h1>
            <p className={styles.subtitle}>Assign beds to IP patients — automatically or manually</p>
          </div>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statPill} style={{ color: '#22c55e', background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' }}>
            <CheckCircle2 size={12} /> {statusCounts.available} Available
          </div>
          <div className={styles.statPill} style={{ color: '#f87171', background: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.3)' }}>
            <AlertCircle size={12} /> {statusCounts.occupied} Occupied
          </div>
          <div className={styles.statPill} style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.3)' }}>
            <Clock size={12} /> {statusCounts.maintenance} Maintenance
          </div>
        </div>
      </div>

      {/* ── PAGE TAB BAR ── */}
      <div className={styles.pageTabBar}>
        <button
          className={`${styles.pageTab} ${pageTab === 'allocation' ? styles.pageTabActive : ''}`}
          onClick={() => setPageTab('allocation')}
        >
          <BedDouble size={15} /> Room Allocation Wizard
        </button>
        <button
          className={`${styles.pageTab} ${pageTab === 'inventory' ? styles.pageTabActive : ''}`}
          onClick={() => setPageTab('inventory')}
        >
          <List size={15} /> Bed Inventory &amp; Status
        </button>
      </div>

      {/* ════════════════════════════════════════════════════
          BED INVENTORY PANEL
      ════════════════════════════════════════════════════ */}
      {pageTab === 'inventory' && (
        <div className={styles.inventorySection}>
          {/* Summary Stats */}
          <div className={styles.invStats}>
            <div className={styles.invStatCard} style={{ borderColor: 'rgba(34,197,94,.3)', background: 'rgba(34,197,94,.05)' }}>
              <div className={styles.invStatVal} style={{ color: '#22c55e' }}>{statusCounts.available}</div>
              <div className={styles.invStatLbl}>Available</div>
            </div>
            <div className={styles.invStatCard} style={{ borderColor: 'rgba(248,113,113,.3)', background: 'rgba(248,113,113,.05)' }}>
              <div className={styles.invStatVal} style={{ color: '#f87171' }}>{statusCounts.occupied}</div>
              <div className={styles.invStatLbl}>Occupied</div>
            </div>
            <div className={styles.invStatCard} style={{ borderColor: 'rgba(251,191,36,.3)', background: 'rgba(251,191,36,.05)' }}>
              <div className={styles.invStatVal} style={{ color: '#fbbf24' }}>{statusCounts.maintenance}</div>
              <div className={styles.invStatLbl}>Maintenance</div>
            </div>
            <div className={styles.invStatCard}>
              <div className={styles.invStatVal} style={{ color: '#2563eb' }}>{(rooms||[]).length}</div>
              <div className={styles.invStatLbl}>Total Beds</div>
            </div>
          </div>

          {/* Filters toolbar */}
          <div className={styles.invToolbar}>
            <div className={styles.invSearchWrap}>
              <Search size={13} className={styles.invSearchIcon} />
              <input className={styles.invSearchInput} placeholder="Search room ID, name, ward, patient..."
                value={invSearch} onChange={e => setInvSearch(e.target.value)} />
              {invSearch && <button className={styles.invClearBtn} onClick={() => setInvSearch('')}><X size={12}/></button>}
            </div>
            <select className={styles.invSelect} value={invWard} onChange={e=>setInvWard(e.target.value)}>
              {wardOptions.map(w=><option key={w} value={w}>{w==='All'?'All Wards':w}</option>)}
            </select>
            <select className={styles.invSelect} value={invStatus} onChange={e=>setInvStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Cleaning / Maintenance">Maintenance</option>
            </select>
            <select className={styles.invSelect} value={invType} onChange={e=>setInvType(e.target.value)}>
              {typeOptions.map(t=><option key={t} value={t}>{t==='All'?'All Types':t}</option>)}
            </select>
            <div className={styles.viewToggle}>
              <button className={`${styles.viewBtn} ${invView==='table'?styles.viewBtnActive:''}`} onClick={()=>setInvView('table')}><List size={13}/></button>
              <button className={`${styles.viewBtn} ${invView==='grid'?styles.viewBtnActive:''}`} onClick={()=>setInvView('grid')}><LayoutGrid size={13}/></button>
            </div>
          </div>

          <div className={styles.invCount}>
            Showing <strong>{inventoryRooms.length}</strong> of {(rooms||[]).length} beds
          </div>

          {/* ── TABLE VIEW ── */}
          {invView === 'table' && (
            <div className={styles.invTableWrap}>
              <table className={styles.invTable}>
                <thead>
                  <tr>
                    <th>Bed ID</th>
                    <th>Ward / Floor</th>
                    <th>Room No.</th>
                    <th>Room Type</th>
                    <th>Status</th>
                    <th>Special Equipment</th>
                    <th>Daily Tariff</th>
                    <th>Patient</th>
                    <th>Gender</th>
                    <th>Change Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryRooms.length === 0 ? (
                    <tr><td colSpan={10} className={styles.invTableEmpty}>No beds match your filters.</td></tr>
                  ) : inventoryRooms.map(room => {
                    const isAvail = room.status === 'Available';
                    const isMaint = room.status === 'Cleaning / Maintenance';
                    const eq = room.equipment || {};
                    return (
                      <tr key={room.id} className={isAvail ? styles.rowAvail : isMaint ? styles.rowMaint : styles.rowOccupied}>
                        <td className={styles.tdBedId}>{room.id}</td>
                        <td>
                          <div className={styles.tdWard}>
                            {room.ward && <span className={styles.wardTag}>{room.ward}</span>}
                            {room.floor && <span className={styles.floorTag}><MapPin size={9}/>{room.floor}</span>}
                          </div>
                          {room.block && <div className={styles.blockText}><Building2 size={9}/> {room.block}</div>}
                        </td>
                        <td className={styles.tdRoomNo}>
                          <Bed size={11} style={{color:'#94a3b8'}}/> {room.roomNo}{room.bedNo&&room.bedNo!=='Single'?`-${room.bedNo}`:''}
                        </td>
                        <td className={styles.tdType}>{room.type}</td>
                        <td>
                          <span className={styles.statusBadge}
                            style={{
                              color: isAvail?'#22c55e':isMaint?'#fbbf24':'#f87171',
                              background: isAvail?'rgba(34,197,94,.1)':isMaint?'rgba(251,191,36,.1)':'rgba(248,113,113,.1)',
                              border: `1px solid ${isAvail?'rgba(34,197,94,.3)':isMaint?'rgba(251,191,36,.3)':'rgba(248,113,113,.3)'}`,
                            }}
                          >
                            {isAvail?<CheckCircle2 size={10}/>:isMaint?<Wrench size={10}/>:<AlertCircle size={10}/>}
                            {room.status}
                          </span>
                        </td>
                        <td>
                          <div className={styles.eqRow}>
                            {eq.oxygen    && <span className={styles.eqTag} style={{color:'#0891b2',borderColor:'#0891b2'}}><Droplets size={9}/>O₂</span>}
                            {eq.monitor   && <span className={styles.eqTag} style={{color:'#7c3aed',borderColor:'#7c3aed'}}><Activity size={9}/>Monitor</span>}
                            {eq.ventilator&& <span className={styles.eqTag} style={{color:'#dc2626',borderColor:'#dc2626'}}><Wind size={9}/>Vent</span>}
                            {eq.cardiac   && <span className={styles.eqTag} style={{color:'#e11d48',borderColor:'#e11d48'}}><Heart size={9}/>ECG</span>}
                            {eq.isolation && <span className={styles.eqTag} style={{color:'#d97706',borderColor:'#d97706'}}><Shield size={9}/>Isolation</span>}
                            {!Object.values(eq).some(Boolean) && <span style={{color:'#94a3b8',fontSize:11}}>—</span>}
                          </div>
                        </td>
                        <td className={styles.tdTariff}>
                          <DollarSign size={11} style={{color:'#22c55e'}}/> {room.price}
                        </td>
                        <td className={styles.tdPatient}>
                          {room.patientName
                            ? <><span className={styles.patientDot}/>{room.patientName}</>
                            : <span style={{color:'#475569'}}>—</span>}
                          {room.admissionDate && <div style={{fontSize:10,color:'#94a3b8'}}>{room.admissionDate}</div>}
                        </td>
                        <td className={styles.tdGender}>
                          {room.gender ? (
                            <span style={{
                              fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:8,
                              color: room.gender==='Female'?'#db2777':room.gender==='Male'?'#2563eb':'#64748b',
                              background: room.gender==='Female'?'#fdf2f8':room.gender==='Male'?'#eff6ff':'#f8fafc',
                            }}>{room.gender}</span>
                          ) : '—'}
                        </td>
                        <td>
                          {editingRoomStatus === room.id ? (
                            <div className={styles.statusEditGroup}>
                              {['Available','Occupied','Cleaning / Maintenance'].map(s=>(
                                <button key={s} className={styles.statusEditBtn}
                                  style={s===room.status?{fontWeight:800,opacity:1}:{opacity:.6}}
                                  onClick={()=>handleStatusChange(room.id, s)}
                                >{s==='Available'?'✓ Avail':s==='Occupied'?'● Occ':'🔧 Maint'}</button>
                              ))}
                              <button className={styles.statusEditCancel} onClick={()=>setEditingRoomStatus(null)}><X size={11}/></button>
                            </div>
                          ) : (
                            <button className={styles.editStatusBtn} onClick={()=>setEditingRoomStatus(room.id)}>
                              <Edit2 size={11}/> Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── GRID VIEW ── */}
          {invView === 'grid' && (
            <div className={styles.invGrid}>
              {inventoryRooms.length === 0 ? (
                <div className={styles.invGridEmpty}>No beds match your filters.</div>
              ) : inventoryRooms.map(room => {
                const isAvail = room.status === 'Available';
                const isMaint = room.status === 'Cleaning / Maintenance';
                const eq = room.equipment || {};
                return (
                  <div key={room.id} className={styles.invGridCard}
                    style={{
                      borderColor: isAvail?'rgba(34,197,94,.35)':isMaint?'rgba(251,191,36,.35)':'rgba(248,113,113,.25)',
                      background:  isAvail?'rgba(34,197,94,.03)':isMaint?'rgba(251,191,36,.03)':'rgba(248,113,113,.03)',
                    }}
                  >
                    <div className={styles.invCardTop}>
                      <span className={styles.invCardId}>{room.id}</span>
                      <span className={styles.statusDot} style={{background:isAvail?'#22c55e':isMaint?'#fbbf24':'#f87171'}}/>
                    </div>
                    <div className={styles.invCardRoomNo}>
                      <Bed size={14}/> {room.roomNo}{room.bedNo&&room.bedNo!=='Single'?`-${room.bedNo}`:''}
                    </div>
                    <div className={styles.invCardType}>{room.type}</div>
                    {room.ward && <div className={styles.invCardWard}><Building2 size={9}/> {room.ward}</div>}
                    {room.floor && <div className={styles.invCardFloor}><MapPin size={9}/> {room.floor}</div>}
                    {room.gender && room.gender !== 'Mixed' && (
                      <div className={styles.invCardGender} style={{color:room.gender==='Female'?'#db2777':'#2563eb'}}>
                        <Users size={9}/> {room.gender}
                      </div>
                    )}
                    <div className={styles.invCardEquip}>
                      {eq.oxygen    && <span title="Oxygen" className={styles.eqDot} style={{background:'#0891b2'}}><Droplets size={8}/></span>}
                      {eq.monitor   && <span title="Monitor" className={styles.eqDot} style={{background:'#7c3aed'}}><Activity size={8}/></span>}
                      {eq.ventilator&& <span title="Ventilator" className={styles.eqDot} style={{background:'#dc2626'}}><Wind size={8}/></span>}
                      {eq.cardiac   && <span title="ECG" className={styles.eqDot} style={{background:'#e11d48'}}><Heart size={8}/></span>}
                      {eq.isolation && <span title="Isolation" className={styles.eqDot} style={{background:'#d97706'}}><Shield size={8}/></span>}
                    </div>
                    <div className={styles.invCardPrice}><DollarSign size={10}/> {room.price}</div>
                    {room.patientName && (
                      <div className={styles.invCardPatient}><User size={9}/> {room.patientName}</div>
                    )}
                    {!isAvail && (
                      <button className={styles.invCardFreeBtn}
                        onClick={() => handleStatusChange(room.id,'Available')}
                      >
                        <Check size={10}/> Mark Available
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ALLOCATION WIZARD (existing code below) ── */}
      {pageTab === 'allocation' && (<>
      {/* ── STEP INDICATOR ── */}
      <div className={styles.stepBar}>
        {steps.map((s, i) => (
          <div key={s.n} className={styles.stepBarItem}>
            <div
              className={`${styles.stepCircle} ${step === s.n ? styles.stepActive : step > s.n ? styles.stepDone : ''}`}
              onClick={() => step > s.n && setStep(s.n)}
              style={{ cursor: step > s.n ? 'pointer' : 'default' }}
            >
              {step > s.n ? <CheckCircle2 size={14} /> : s.n}
            </div>
            <span className={`${styles.stepLabel} ${step === s.n ? styles.stepLabelActive : ''}`}>{s.label}</span>
            {i < steps.length - 1 && <div className={`${styles.stepLine} ${step > s.n ? styles.stepLineDone : ''}`} />}
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════
          STEP 1 — SELECT PATIENT
      ════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className={styles.stepCard}>
          <div className={styles.stepCardHeader}>
            <User size={16} /> Select IP Patient for Room Allocation
            <span className={styles.stepCardCount}>{activeIpPatients.length} active</span>
          </div>

          <div className={styles.searchWrap}>
            <Search size={13} className={styles.searchIcon} />
            <input className={styles.searchInput} placeholder="Search by name or patient ID..."
              value={searchIP} onChange={e => setSearchIP(e.target.value)} />
            {searchIP && <button className={styles.clearBtn} onClick={() => setSearchIP('')}><X size={12} /></button>}
          </div>

          <div className={styles.ipList}>
            {filteredIpPatients.length === 0 ? (
              <div className={styles.emptyState}>
                <BedDouble size={40} strokeWidth={1.2} style={{ color: '#334155', marginBottom: 10 }} />
                <div style={{ color: '#64748b', fontSize: 14 }}>No active IP patients to allocate</div>
              </div>
            ) : filteredIpPatients.map(ip => (
              <div key={ip.id} className={styles.ipRow} onClick={() => handleSelectPatient(ip)}>
                <div className={styles.ipAvatar} style={{ background: avatarColor(ip.patientName) }}>
                  {getInitials(ip.patientName)}
                </div>
                <div className={styles.ipInfo}>
                  <div className={styles.ipName}>{ip.patientName}</div>
                  <div className={styles.ipMeta}>
                    #{ip.patientId}
                    {ip.age && ` · ${ip.age}Y`}
                    {ip.gender && ` · ${ip.gender === 'M' ? 'Male' : 'Female'}`}
                    {ip.ward && ` · ${ip.ward}`}
                  </div>
                  <div className={styles.ipDiag}>{ip.diagnosis || 'Awaiting diagnosis'}</div>
                </div>
                <div className={styles.ipRightCol}>
                  {ip.allocatedRoomNo ? (
                    <div className={styles.roomTag} style={{ color: '#22c55e', background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)' }}>
                      <Bed size={10} /> {ip.allocatedRoomNo}
                    </div>
                  ) : (
                    <div className={styles.roomTag} style={{ color: '#94a3b8', background: 'rgba(148,163,184,0.1)', borderColor: 'rgba(148,163,184,0.2)' }}>
                      <Clock size={10} /> Unassigned
                    </div>
                  )}
                  <ArrowRight size={14} className={styles.ipArrow} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          STEP 2 — PATIENT DETAILS
      ════════════════════════════════════════════════════ */}
      {step === 2 && selectedIP && (
        <div className={styles.stepCard}>
          <div className={styles.stepCardHeader}>
            <ClipboardList size={16} /> Patient Details & Care Requirements
          </div>

          {/* Patient snapshot */}
          <div className={styles.patientSnapshot}>
            <div className={styles.snapAvatar} style={{ background: avatarColor(selectedIP.patientName) }}>
              {getInitials(selectedIP.patientName)}
            </div>
            <div>
              <div className={styles.snapName}>{selectedIP.patientName}</div>
              <div className={styles.snapMeta}>
                ID: #{selectedIP.patientId}
                {selectedIP.age && ` · ${selectedIP.age}Y`}
                {selectedIP.gender && ` · ${selectedIP.gender === 'M' ? 'Male' : 'Female'}`}
              </div>
              {selectedIP.diagnosis && (
                <div className={styles.snapDiag}><Stethoscope size={11} /> {selectedIP.diagnosis}</div>
              )}
            </div>
            <button className={styles.changePatientBtn} onClick={() => setStep(1)}>
              <ArrowRight size={12} style={{ transform: 'rotate(180deg)' }} /> Change
            </button>
          </div>

          {/* Form fields */}
          <div className={styles.detailsGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}><Building2 size={12} /> Admitting Department</label>
              <select className={styles.formSelect} value={department} onChange={e => setDepartment(e.target.value)}>
                <option value="">Select department...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}><UserCheck size={12} /> Admitting Doctor</label>
              <select className={styles.formSelect} value={admittingDoctor} onChange={e => setAdmittingDoctor(e.target.value)}>
                <option value="">Select doctor...</option>
                {(doctors || []).map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
              </select>
              {selectedIP.doctorName && !admittingDoctor && (
                <div className={styles.prefill}>
                  <Info size={10} /> Pre-filled from admission: <strong>{selectedIP.doctorName}</strong>
                </div>
              )}
            </div>

            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.formLabel}><Activity size={12} /> Severity / Care Level <span style={{ color: '#f87171' }}>*</span></label>
              <div className={styles.careLevelRow}>
                {CARE_LEVELS.map(cl => (
                  <div
                    key={cl.value}
                    className={`${styles.careLevelCard} ${careLevel === cl.value ? styles.careLevelActive : ''}`}
                    style={careLevel === cl.value ? { borderColor: cl.color, boxShadow: `0 0 0 3px ${cl.color}22` } : {}}
                    onClick={() => setCareLevel(cl.value)}
                  >
                    <span className={styles.careLevelEmoji}>{cl.icon}</span>
                    <span className={styles.careLevelLabel} style={careLevel === cl.value ? { color: cl.color } : {}}>{cl.label}</span>
                    {careLevel === cl.value && <CheckCircle2 size={13} style={{ color: cl.color, marginLeft: 'auto' }} />}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}><Users size={12} /> Gender Preference</label>
              <select className={styles.formSelect} value={preferGender} onChange={e => setPreferGender(e.target.value)}>
                <option value="Mixed">No Preference (Mixed)</option>
                <option value="Male">Male Ward</option>
                <option value="Female">Female Ward</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}><Shield size={12} /> Special Requirements</label>
              <input
                className={styles.formInput}
                placeholder="e.g. isolation, ventilator, cardiac monitor..."
                value={specialReq}
                onChange={e => setSpecialReq(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.stepActions}>
            <button className={styles.btnSecondary} onClick={() => setStep(1)}>← Back</button>
            <button className={styles.btnPrimary} onClick={handleGoToRoomStep}>
              Continue to Room Selection →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          STEP 3 — CHOOSE ROOM
      ════════════════════════════════════════════════════ */}
      {step === 3 && selectedIP && (
        <div className={styles.stepCard}>
          <div className={styles.stepCardHeader}>
            <BedDouble size={16} /> Select Room &amp; Bed
          </div>

          {/* Summary bar */}
          <div className={styles.summaryBar}>
            <span className={styles.summaryItem}><User size={11} /> {selectedIP.patientName}</span>
            <span className={styles.summaryDot} />
            <span className={styles.summaryItem}><Activity size={11} /> {careLevel}</span>
            {department && <><span className={styles.summaryDot} /><span className={styles.summaryItem}><Building2 size={11} /> {department}</span></>}
            {preferGender !== 'Mixed' && <><span className={styles.summaryDot} /><span className={styles.summaryItem}><Users size={11} /> {preferGender}</span></>}
          </div>

          {/* Mode cards */}
          {!mode && (
            <div className={styles.modeCards}>
              <div className={styles.modeCard} onClick={handleAutoMode}>
                <div className={styles.modeCardIcon} style={{ background: 'rgba(37,99,235,0.12)', color: '#60a5fa' }}>
                  <Zap size={26} />
                </div>
                <div className={styles.modeCardTitle}>Auto Allocate</div>
                <div className={styles.modeCardDesc}>System picks the optimal available bed based on care level, ward & gender preference</div>
                <div className={styles.modeCardAction}>Select Automatically →</div>
              </div>
              <div className={styles.modeCard} onClick={handleManualMode}>
                <div className={styles.modeCardIcon} style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa' }}>
                  <HandMetal size={26} />
                </div>
                <div className={styles.modeCardTitle}>Manual Select</div>
                <div className={styles.modeCardDesc}>Browse the live bed map and hand-pick the exact bed for this patient</div>
                <div className={styles.modeCardAction}>Open Bed Map →</div>
              </div>
            </div>
          )}

          {/* ── AUTO RESULT ── */}
          {mode === 'auto' && (
            <div className={styles.autoSection}>
              <div className={styles.autoSectionHeader}>
                <Star size={14} style={{ color: '#fbbf24' }} />
                <span>Best Available Bed — Auto Suggested</span>
                <button className={styles.changeMode} onClick={() => { setMode(null); setSelectedRoom(null); }}>
                  <X size={12} /> Change Method
                </button>
              </div>
              {autoSuggested ? (
                <>
                  <div className={styles.autoResultCard}>
                    <div className={styles.autoResultLeft}>
                      <div className={styles.autoRoomLabel}>
                        <Bed size={20} />
                        Room {autoSuggested.roomNo}
                        {autoSuggested.bedNo && autoSuggested.bedNo !== 'Single' && `-${autoSuggested.bedNo}`}
                      </div>
                      <div className={styles.autoRoomType}>{autoSuggested.type}</div>
                      <div className={styles.autoRoomDetails}>
                        {autoSuggested.block && <span><Building2 size={11} /> {autoSuggested.block}</span>}
                        {autoSuggested.floor && <span><MapPin size={11} /> {autoSuggested.floor}</span>}
                        {autoSuggested.ward && <span><Tag size={11} /> {autoSuggested.ward}</span>}
                        {autoSuggested.gender && <span><Users size={11} /> {autoSuggested.gender}</span>}
                      </div>
                      {/* Equipment */}
                      {autoSuggested.equipment && (
                        <div className={styles.autoEquip}>
                          {Object.entries(EQ).map(([k, cfg]) => autoSuggested.equipment[k] ? (
                            <span key={k} className={styles.eqPillLg} style={{ color: cfg.color, borderColor: cfg.color + '55' }}>
                              {cfg.icon} {cfg.label}
                            </span>
                          ) : null)}
                        </div>
                      )}
                      <div className={styles.autoRoomPrice}>{autoSuggested.price}</div>
                      {autoSuggested.notes && (
                        <div className={styles.autoNotes}><Info size={10} /> {autoSuggested.notes}</div>
                      )}
                    </div>
                    <div className={styles.autoResultRight}>
                      <div className={styles.availGlow}><CheckCircle2 size={13} /> Available</div>
                      <button className={styles.tryAnotherBtn} onClick={handleAutoMode}>
                        <RefreshCw size={12} /> Try Another
                      </button>
                    </div>
                  </div>
                  <div className={styles.autoReason}>
                    💡 Matched <strong>{careLevel}</strong> care level
                    {preferGender !== 'Mixed' && <>, <strong>{preferGender}</strong> ward preference</>}
                    {department && <>, <strong>{department}</strong> department</>}.
                  </div>
                </>
              ) : (
                <div className={styles.noRoomAlert}>
                  <AlertCircle size={20} />
                  <div>
                    <div style={{ fontWeight: 700 }}>No Suitable Beds Available</div>
                    <div style={{ fontSize: 13, marginTop: 4, opacity: 0.8 }}>
                      No available beds match care level <strong>{careLevel}</strong>. Switch to Manual to browse all options.
                    </div>
                  </div>
                  <button className={styles.switchManualBtn} onClick={handleManualMode}>Browse Manually</button>
                </div>
              )}
            </div>
          )}

          {/* ── MANUAL BED MAP ── */}
          {mode === 'manual' && (
            <div className={styles.bedMapSection}>
              <div className={styles.bedMapHeader}>
                <div className={styles.bedMapHeaderLeft}>
                  <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14 }}>Live Bed Map</span>
                  <button className={styles.changeMode} onClick={() => { setMode(null); setSelectedRoom(null); }}>
                    <X size={12} /> Change Method
                  </button>
                </div>
                <div className={styles.bedMapFilters}>
                  {/* Status filter */}
                  <select className={styles.darkSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="All">All Status</option>
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Cleaning / Maintenance">Maintenance</option>
                  </select>
                  {/* Ward filter */}
                  <select className={styles.darkSelect} value={wardFilter} onChange={e => setWardFilter(e.target.value)}>
                    {wardOptions.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                  {/* Search */}
                  <div className={styles.darkSearchWrap}>
                    <Search size={12} className={styles.darkSearchIcon} />
                    <input className={styles.darkSearchInput} placeholder="Room, type, block..."
                      value={manualFilter} onChange={e => setManualFilter(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className={styles.bedLegend}>
                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} /> Available</span>
                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#f87171', boxShadow: '0 0 6px #f87171' }} /> Occupied</span>
                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#fbbf24', boxShadow: '0 0 6px #fbbf24' }} /> Maintenance</span>
                <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#818cf8', boxShadow: '0 0 6px #818cf8' }} /> Selected</span>
              </div>

              {/* Bed grid */}
              <div className={styles.bedGrid}>
                {manualRooms.length === 0 ? (
                  <div className={styles.noBeds}>No beds match your filters.</div>
                ) : manualRooms.map(room => (
                  <BedCard
                    key={room.id}
                    room={room}
                    selected={selectedRoom?.id === room.id}
                    onClick={r => setSelectedRoom(r)}
                  />
                ))}
              </div>

              {/* Selected preview */}
              {selectedRoom && (
                <div className={styles.selectedPreview}>
                  <CheckCircle2 size={15} style={{ color: '#22c55e', flexShrink: 0 }} />
                  <span>
                    Selected: <strong>Room {selectedRoom.roomNo}{selectedRoom.bedNo && selectedRoom.bedNo !== 'Single' ? `-${selectedRoom.bedNo}` : ''}</strong>
                    {' '}· {selectedRoom.type} · {selectedRoom.price}
                    {selectedRoom.block && ` · ${selectedRoom.block}`}
                  </span>
                  <button className={styles.clearSelBtn} onClick={() => setSelectedRoom(null)}><X size={12} /></button>
                </div>
              )}
            </div>
          )}

          {mode && selectedRoom && (
            <div className={styles.stepActions}>
              <button className={styles.btnSecondary} onClick={() => setStep(2)}>← Back</button>
              <button className={styles.btnPrimary} onClick={handleGoToConfirm}>
                Continue to Confirm →
              </button>
            </div>
          )}
          {!mode && (
            <div className={styles.stepActions}>
              <button className={styles.btnSecondary} onClick={() => setStep(2)}>← Back</button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          STEP 4 — CONFIRM & METADATA
      ════════════════════════════════════════════════════ */}
      {step === 4 && selectedIP && selectedRoom && (
        <div className={styles.stepCard}>
          <div className={styles.stepCardHeader}>
            <CalendarClock size={16} /> Confirm Allocation &amp; Record Metadata
          </div>

          <div className={styles.confirmLayout}>
            {/* Left — summary cards */}
            <div className={styles.confirmLeft}>
              <div className={styles.confirmSectionLabel}>Patient</div>
              <div className={styles.confirmCard}>
                <div className={styles.confirmRow}>
                  <span className={styles.confirmKey}>Name</span>
                  <span className={styles.confirmVal}><strong>{selectedIP.patientName}</strong></span>
                </div>
                <div className={styles.confirmRow}>
                  <span className={styles.confirmKey}>Patient ID</span>
                  <span className={styles.confirmVal}>#{selectedIP.patientId}</span>
                </div>
                {selectedIP.age && (
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmKey}>Age / Gender</span>
                    <span className={styles.confirmVal}>{selectedIP.age}Y · {selectedIP.gender === 'M' ? 'Male' : 'Female'}</span>
                  </div>
                )}
                {department && (
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmKey}>Department</span>
                    <span className={styles.confirmVal}>{department}</span>
                  </div>
                )}
                {admittingDoctor && (
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmKey}>Admitting Doctor</span>
                    <span className={styles.confirmVal}>{admittingDoctor}</span>
                  </div>
                )}
                <div className={styles.confirmRow}>
                  <span className={styles.confirmKey}>Care Level</span>
                  <span className={styles.confirmVal} style={{ fontWeight: 700, color: CARE_LEVELS.find(c=>c.value===careLevel)?.color || '#2563eb' }}>
                    {careLevel}
                  </span>
                </div>
              </div>

              <div className={styles.confirmSectionLabel} style={{ marginTop: 14 }}>Room / Bed</div>
              <div className={styles.confirmCard}>
                <div className={styles.confirmRow}>
                  <span className={styles.confirmKey}>Room / Bed</span>
                  <span className={styles.confirmVal}><strong>
                    {selectedRoom.roomNo}{selectedRoom.bedNo && selectedRoom.bedNo !== 'Single' ? `-${selectedRoom.bedNo}` : ''}
                  </strong></span>
                </div>
                <div className={styles.confirmRow}>
                  <span className={styles.confirmKey}>Type</span>
                  <span className={styles.confirmVal}>{selectedRoom.type}</span>
                </div>
                {selectedRoom.block && (
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmKey}>Block / Floor</span>
                    <span className={styles.confirmVal}>{selectedRoom.block}{selectedRoom.floor ? ` · ${selectedRoom.floor}` : ''}</span>
                  </div>
                )}
                {selectedRoom.ward && (
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmKey}>Ward</span>
                    <span className={styles.confirmVal}>{selectedRoom.ward}</span>
                  </div>
                )}
                <div className={styles.confirmRow}>
                  <span className={styles.confirmKey}>Daily Tariff</span>
                  <span className={styles.confirmVal} style={{ color: '#2563eb', fontWeight: 700 }}>{selectedRoom.price}</span>
                </div>
                {selectedRoom.equipment && Object.values(selectedRoom.equipment).some(Boolean) && (
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmKey}>Equipment</span>
                    <span className={styles.confirmVal}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {Object.entries(EQ).map(([k, cfg]) => selectedRoom.equipment[k] ? (
                          <span key={k} style={{ fontSize: 10, padding: '2px 6px', border: `1px solid ${cfg.color}55`, borderRadius: 6, color: cfg.color, display: 'flex', alignItems: 'center', gap: 3 }}>
                            {cfg.icon}{cfg.label}
                          </span>
                        ) : null)}
                      </div>
                    </span>
                  </div>
                )}
                <div className={styles.confirmRow}>
                  <span className={styles.confirmKey}>Method</span>
                  <span className={styles.confirmVal}>
                    {mode === 'auto'
                      ? <span style={{ color: '#2563eb', fontWeight: 600 }}><Zap size={11} /> Auto</span>
                      : <span style={{ color: '#7c3aed', fontWeight: 600 }}><HandMetal size={11} /> Manual</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Right — metadata form */}
            <div className={styles.confirmRight}>
              <div className={styles.confirmSectionLabel}>Allocation Metadata</div>

              <div className={styles.metaForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}><CalendarClock size={12} /> Admission Date &amp; Time <span style={{ color: '#f87171' }}>*</span></label>
                  <input type="datetime-local" className={styles.formInput}
                    value={admissionDateTime} onChange={e => setAdmissionDateTime(e.target.value)} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}><Calendar size={12} /> Expected Discharge Date</label>
                  <input type="date" className={styles.formInput}
                    value={expectedDischarge} onChange={e => setExpectedDischarge(e.target.value)}
                    min={admissionDateTime.slice(0, 10)} />
                  {expectedDischarge && admissionDateTime && (
                    <div className={styles.prefill}>
                      <Info size={10} />
                      {Math.ceil((new Date(expectedDischarge) - new Date(admissionDateTime)) / 86400000)} day(s) estimated
                      {selectedRoom.tariff && ` · Est. total: ₹${(Math.ceil((new Date(expectedDischarge) - new Date(admissionDateTime)) / 86400000) * selectedRoom.tariff).toLocaleString('en-IN')}`}
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}><UserCheck size={12} /> Allocated By <span style={{ color: '#f87171' }}>*</span></label>
                  <select className={styles.formSelect} value={allocatedBy} onChange={e => setAllocatedBy(e.target.value)}>
                    {STAFF.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}><Info size={12} /> Notes / Remarks</label>
                  <textarea className={styles.formTextarea} rows={3}
                    placeholder="Any special instructions, care notes..."
                    value={allocationNotes} onChange={e => setAllocationNotes(e.target.value)} />
                </div>
              </div>

              <div className={styles.stepActions} style={{ marginTop: 20 }}>
                <button className={styles.btnSecondary} onClick={() => setStep(3)}>← Back</button>
                <button className={styles.btnConfirm} onClick={handleConfirm}>
                  <BedDouble size={15} /> Confirm &amp; Allocate Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>)}
    </div>
  );
}
