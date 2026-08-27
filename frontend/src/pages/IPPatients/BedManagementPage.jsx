import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  BedDouble, Bed, Building2, CheckCircle2, AlertCircle, Clock, 
  Wrench, Droplets, Activity, Wind, Heart, Shield, User, 
  ChevronDown, ChevronRight, X, UserMinus
} from 'lucide-react';

const EQ_CONFIG = {
  oxygen:     { icon: <Droplets size={9} />, label: 'O₂',   color: '#0891b2' },
  monitor:    { icon: <Activity size={9} />, label: 'Mon',  color: '#7c3aed' },
  ventilator: { icon: <Wind size={9} />,     label: 'Vent', color: '#dc2626' },
  cardiac:    { icon: <Heart size={9} />,    label: 'ECG',  color: '#e11d48' },
  isolation:  { icon: <Shield size={9} />,   label: 'Iso',  color: '#d97706' },
};

export default function BedManagementPage() {
  const { rooms = [], ipPatients = [], allocateRoomToIpPatient } = useApp();
  const navigate = useNavigate();

  // State
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [activePatient, setActivePatient] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Derived Data
  const pendingAdmissions = useMemo(() => {
    return ipPatients.filter(p => !p.allocatedRoomId && p.status !== 'Discharged');
  }, [ipPatients]);

  const wards = useMemo(() => {
    const wardMap = new Map();
    rooms.forEach(r => {
      if (!r.ward) return;
      if (!wardMap.has(r.ward)) {
        wardMap.set(r.ward, { name: r.ward, roomsList: [], total: 0, available: 0 });
      }
      const w = wardMap.get(r.ward);
      w.total++;
      if (r.status === 'Available') w.available++;
      
      // Group by room number
      let roomObj = w.roomsList.find(x => x.id === r.roomNo);
      if (!roomObj) {
        roomObj = { id: r.roomNo, name: r.roomNo, beds: [] };
        w.roomsList.push(roomObj);
      }
      roomObj.beds.push(r);
    });
    return Array.from(wardMap.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [rooms]);

  const filteredBeds = useMemo(() => {
    let filtered = rooms;
    if (selectedWard) {
      filtered = filtered.filter(r => r.ward === selectedWard);
    }
    if (selectedRoomId) {
      filtered = filtered.filter(r => r.roomNo === selectedRoomId);
    }
    return filtered;
  }, [rooms, selectedWard, selectedRoomId]);

  // Handlers
  const handleBedClick = (bed) => {
    if (bed.status === 'Available') {
      if (!activePatient) {
        showToast('Select a patient from the queue above first', 'warning');
        return;
      }
      setConfirmModal({ patient: activePatient, bed });
    } else if (bed.status === 'Occupied') {
      const patientInitials = bed.patientName ? bed.patientName.split(' ').map(n=>n[0]).join('').substring(0,2) : '?';
      showToast(`Bed occupied by ${patientInitials}. Use Transfer flow to change.`, 'warning');
    }
  };

  const handleConfirmAllocation = () => {
    if (!confirmModal) return;
    const { patient, bed } = confirmModal;
    
    allocateRoomToIpPatient(patient.id, bed.id, {
      admittingDoctor: patient.doctorName,
      careLevel: patient.careLevel || 'General',
    });
    
    showToast(`✓ Assigned ${patient.patientName} to Bed ${bed.roomNo}-${bed.bedNo}`);
    setConfirmModal(null);
    setActivePatient(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc', padding: '20px 24px', boxSizing: 'border-box', gap: 20 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000, background: toast.type === 'success' ? '#16a34a' : '#f59e0b', color: 'white', padding: '12px 20px', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BedDouble size={24} style={{ color: '#0ea5e9' }} /> Bed Management
          </h1>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Allocate beds and monitor facility occupancy</div>
        </div>
      </div>

      {/* To-Admit Queue Carousel */}
      <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', flexShrink: 0 }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={16} /> To-Admit Queue ({pendingAdmissions.length})
        </h3>
        {pendingAdmissions.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
            <CheckCircle2 size={24} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
            No pending admissions. The queue is clear!
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
            {pendingAdmissions.map(p => {
              const isSelected = activePatient?.id === p.id;
              const isEmergency = p.priority === 'Emergency' || p.isUrgent;
              const isUrgent = p.priority === 'Urgent';
              return (
                <div 
                  key={p.id}
                  onClick={() => setActivePatient(isSelected ? null : p)}
                  style={{
                    minWidth: 260, padding: 12, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                    border: `2px solid ${isSelected ? '#0ea5e9' : isEmergency ? '#fca5a5' : isUrgent ? '#fcd34d' : '#e2e8f0'}`,
                    background: isSelected ? '#f0f9ff' : 'white',
                    boxShadow: isSelected ? '0 4px 12px rgba(14, 165, 233, 0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.patientName}
                    </div>
                    {isEmergency && <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 12, marginLeft: 8 }}>EMERGENCY</span>}
                    {!isEmergency && isUrgent && <span style={{ background: '#fffbeb', color: '#d97706', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 12, marginLeft: 8 }}>URGENT</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>ID: #{p.patientId}</div>
                  
                  <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 11, padding: '2px 8px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      {p.ward || 'Any Ward'}
                    </span>
                    {(Array.isArray(p.bedTags) ? p.bedTags : (p.bedTags ? p.bedTags.split(',') : [])).map(tag => (
                      <span key={tag} title={tag} style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
                        {EQ_CONFIG[tag]?.icon || tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
        
        {/* Left Pane: Spatial Tree */}
        <div style={{ width: 280, background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 14, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} /> Facility Layout
          </h3>
          
          <div 
            onClick={() => { setSelectedWard(null); setSelectedRoomId(null); }}
            style={{ 
              padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 8,
              background: (!selectedWard && !selectedRoomId) ? '#f1f5f9' : 'transparent',
              fontWeight: (!selectedWard && !selectedRoomId) ? 600 : 500,
              color: (!selectedWard && !selectedRoomId) ? '#0f172a' : '#475569',
            }}
          >
            All Wards & Units ({rooms.length} Beds)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {wards.map(w => {
              const isSelected = selectedWard === w.name;
              const pctAvail = w.total > 0 ? (w.available / w.total) * 100 : 0;
              const badgeColor = pctAvail > 50 ? '#16a34a' : pctAvail > 0 ? '#d97706' : '#dc2626';
              const badgeBg = pctAvail > 50 ? '#dcfce7' : pctAvail > 0 ? '#fef3c7' : '#fee2e2';

              return (
                <div key={w.name}>
                  <div 
                    onClick={() => { setSelectedWard(isSelected ? null : w.name); setSelectedRoomId(null); }}
                    style={{ 
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: isSelected && !selectedRoomId ? '#eff6ff' : 'transparent',
                      border: isSelected && !selectedRoomId ? '1px solid #bfdbfe' : '1px solid transparent',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: isSelected ? '#1d4ed8' : '#334155', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isSelected ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      {w.name}
                    </div>
                    <div style={{ background: badgeBg, color: badgeColor, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                      {w.available}/{w.total}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div style={{ paddingLeft: 24, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {w.roomsList.map(r => (
                        <div 
                          key={r.id}
                          onClick={() => setSelectedRoomId(r.id)}
                          style={{ 
                            padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
                            background: selectedRoomId === r.id ? '#e0f2fe' : 'transparent',
                            color: selectedRoomId === r.id ? '#0369a1' : '#64748b',
                            fontWeight: selectedRoomId === r.id ? 600 : 400,
                          }}
                        >
                          Room {r.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Grid */}
        <div style={{ flex: 1, background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 18, color: '#0f172a' }}>
            {selectedRoomId ? `Room ${selectedRoomId} Beds` : selectedWard ? `${selectedWard} Beds` : 'All Beds'}
          </h3>

          {filteredBeds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <BedDouble size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <div style={{ fontSize: 16 }}>No beds found matching the selection.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {filteredBeds.map(b => {
                let statusStyles = { bg: '#f3f4f6', border: '#e2e8f0', text: '#64748b', icon: <Bed size={14}/> };
                if (b.status === 'Available') {
                  statusStyles = { bg: '#f0fdf4', border: '#16a34a', text: '#16a34a', icon: <CheckCircle2 size={12}/> };
                } else if (b.status === 'Occupied') {
                  statusStyles = { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', icon: <UserMinus size={12}/> };
                } else if (b.status === 'Cleaning / Maintenance') {
                  statusStyles = { bg: '#fefce8', border: '#fef08a', text: '#d97706', icon: <Wrench size={12}/> };
                }

                const eq = b.equipment || {};
                const hasEq = Object.values(eq).some(Boolean);

                return (
                  <div 
                    key={b.id}
                    onClick={() => handleBedClick(b)}
                    style={{
                      border: `2px solid ${b.status === 'Available' && activePatient ? '#16a34a' : statusStyles.border}`,
                      borderRadius: 12, padding: '16px 12px', background: statusStyles.bg,
                      cursor: (b.status === 'Available' && activePatient) ? 'pointer' : 'default',
                      opacity: (b.status !== 'Available' && activePatient) ? 0.4 : 1,
                      transition: 'all 0.2s',
                      display: 'flex', flexDirection: 'column', position: 'relative',
                      boxShadow: (b.status === 'Available' && activePatient) ? '0 4px 12px rgba(22,163,74,0.2)' : 'none',
                    }}
                  >
                    {/* Top Right Bed ID */}
                    <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>#{b.id}</div>
                    
                    <BedDouble size={28} style={{ color: statusStyles.text, marginBottom: 8, alignSelf: 'center' }} />
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{b.roomNo}{b.bedNo && b.bedNo !== 'Single' ? `-${b.bedNo}` : ''}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{b.type}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 12, minHeight: 20 }}>
                      {eq.oxygen && <span title="Oxygen" style={{ color: EQ_CONFIG.oxygen.color }}>{EQ_CONFIG.oxygen.icon}</span>}
                      {eq.monitor && <span title="Monitor" style={{ color: EQ_CONFIG.monitor.color }}>{EQ_CONFIG.monitor.icon}</span>}
                      {eq.ventilator && <span title="Ventilator" style={{ color: EQ_CONFIG.ventilator.color }}>{EQ_CONFIG.ventilator.icon}</span>}
                      {eq.cardiac && <span title="ECG" style={{ color: EQ_CONFIG.cardiac.color }}>{EQ_CONFIG.cardiac.icon}</span>}
                      {eq.isolation && <span title="Isolation" style={{ color: EQ_CONFIG.isolation.color }}>{EQ_CONFIG.isolation.icon}</span>}
                      {!hasEq && <span style={{ fontSize: 10, color: '#cbd5e1' }}>Basic</span>}
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 12, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: statusStyles.text, fontSize: 11, fontWeight: 700 }}>
                      {statusStyles.icon}
                      {b.status === 'Cleaning / Maintenance' ? 'Maintenance' : b.status}
                    </div>

                    {/* Occupied Overlay Initial */}
                    {b.status === 'Occupied' && (
                      <div style={{ position: 'absolute', top: 8, left: 8, width: 22, height: 22, borderRadius: '50%', background: '#dc2626', color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={b.patientName}>
                        {b.patientName ? b.patientName.split(' ').map(n=>n[0]).join('').substring(0,2) : '?'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: 'white', padding: 0, borderRadius: 16, width: 440, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
              <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>Confirm Bed Allocation</h3>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
                Assign <strong style={{ color: '#0f172a' }}>{confirmModal.patient.patientName}</strong> (ID: #{confirmModal.patient.patientId}) to <strong style={{ color: '#0f172a' }}>Bed {confirmModal.bed.roomNo}-{confirmModal.bed.bedNo}</strong> in <strong style={{ color: '#0f172a' }}>{confirmModal.bed.ward}</strong>?
              </div>

              {/* Requirement Check */}
              {confirmModal.patient.bedTags && confirmModal.patient.bedTags.length > 0 && (
                <div style={{ marginTop: 20, background: '#f8fafc', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Requirement Match Check</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(Array.isArray(confirmModal.patient.bedTags) ? confirmModal.patient.bedTags : (confirmModal.patient.bedTags ? confirmModal.patient.bedTags.split(',') : [])).map(tag => {
                      const bedHasTag = confirmModal.bed.equipment?.[tag];
                      return (
                        <div key={tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {EQ_CONFIG[tag]?.icon} {EQ_CONFIG[tag]?.label || tag}
                          </span>
                          {bedHasTag ? (
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Match</span>
                          ) : (
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>✗ Missing</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setConfirmModal(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleConfirmAllocation} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#0ea5e9', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
