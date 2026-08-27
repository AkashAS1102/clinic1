import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BedDouble, Plus, Trash2, Edit2, Check, X, Search,
  Info, AlertCircle, Grid, Activity, Tag, Layers, Droplets, Wind, Heart, Shield
} from 'lucide-react';
import styles from './DeptDesig.module.css';

const ROOM_COLORS = [
  '#0891b2', '#2563eb', '#7c3aed', '#db2777', '#ea580c',
  '#16a34a', '#d97706', '#dc2626', '#059669', '#6366f1'
];

function stringColor(name) {
  const str = name || '';
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h + str.charCodeAt(i)) % ROOM_COLORS.length;
  return ROOM_COLORS[h];
}

export default function RoomManager() {
  const { rooms = [], setRooms, roomTypes = [], setRoomTypes } = useApp() || {};
  const [activeTab, setActiveTab] = useState('rooms'); 
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // Bulk Mode
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkStart, setBulkStart] = useState('101');
  const [bulkEnd, setBulkEnd] = useState('110');

  // Form State for New Room
  const [newRoom, setNewRoom] = useState({
    block: '', floor: '', ward: '', roomNo: '', bedNo: '',
    type: (roomTypes && roomTypes[0]) || '', careLevel: 'General', tariff: '',
    eqOxygen: false, eqMonitor: false, eqVentilator: false, eqCardiac: false, eqIso: false
  });

  // Form State for New Type
  const [newType, setNewType] = useState('');
  
  // Edit State
  const [editTypeItem, setEditTypeItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // --- ROOM TYPES LOGIC ---
  const filteredTypes = useMemo(() => 
    (roomTypes || []).filter(t => !search || String(t || '').toLowerCase().includes(search.toLowerCase())),
  [roomTypes, search]);

  const handleAddType = () => {
    if (!newType.trim()) return;
    if ((roomTypes || []).includes(newType.trim())) {
      showToast('Room Type already exists', 'error');
      return;
    }
    setRoomTypes([...(roomTypes || []), newType.trim()]);
    setNewType('');
    showToast('Room Type added successfully');
  };

  const handleUpdateType = (oldName, newName) => {
    if (!newName.trim() || oldName === newName) {
      setEditTypeItem(null);
      return;
    }
    if ((roomTypes || []).includes(newName.trim())) {
      showToast('Room Type already exists', 'error');
      return;
    }
    setRoomTypes((roomTypes || []).map(t => t === oldName ? newName.trim() : t));
    
    // Update all rooms that use this type
    setRooms((rooms || []).map(r => r.type === oldName ? { ...r, type: newName.trim() } : r));
    
    setEditTypeItem(null);
    showToast(`Renamed to "${newName.trim()}"`);
  };

  const handleDeleteType = (type) => {
    const inUse = (rooms || []).some(r => r.type === type);
    if (inUse) {
      showToast(`Cannot delete "${type}" because it is currently assigned to rooms.`, 'error');
      setDeleteConfirm(null);
      return;
    }
    setRoomTypes((roomTypes || []).filter(t => t !== type));
    setDeleteConfirm(null);
    showToast(`Room Type "${type}" deleted`, 'info');
  };

  // --- ROOM LOGIC ---
  const filteredRooms = useMemo(() => 
    (rooms || []).filter(r => 
      !search || 
      String(r.roomNo || '').toLowerCase().includes(search.toLowerCase()) ||
      String(r.ward || '').toLowerCase().includes(search.toLowerCase()) ||
      String(r.type || '').toLowerCase().includes(search.toLowerCase())
    ),
  [rooms, search]);

  const handleAddRoom = () => {
    if (isBulkMode) {
      if (!bulkStart || !bulkEnd || !newRoom.ward || !newRoom.block || !newRoom.tariff) {
        showToast('Please fill all required fields (Block, Ward, Room Range, Tariff)', 'error');
        return;
      }
    } else {
      if (!newRoom.roomNo || !newRoom.ward || !newRoom.block || !newRoom.tariff) {
        showToast('Please fill all required fields (Block, Ward, Room No, Tariff)', 'error');
        return;
      }
    }
    
    let generatedRooms = [];
    if (isBulkMode) {
      const start = parseInt(bulkStart) || 1;
      const end = Math.max(start, parseInt(bulkEnd) || start);
      for (let i = start; i <= end; i++) {
        const newId = `RMI${Date.now().toString().slice(-6)}-${i}`;
        generatedRooms.push({
          id: newId,
          block: newRoom.block,
          floor: newRoom.floor,
          ward: newRoom.ward,
          roomNo: String(i),
          bedNo: newRoom.bedNo || '',
          type: newRoom.type || (roomTypes && roomTypes[0]) || 'General Bed',
          careLevel: newRoom.careLevel,
          gender: 'Mixed',
          price: `₹ ${Number(newRoom.tariff).toLocaleString()} / day`,
          tariff: Number(newRoom.tariff),
          equipment: {
            oxygen: newRoom.eqOxygen,
            monitor: newRoom.eqMonitor,
            ventilator: newRoom.eqVentilator,
            cardiac: newRoom.eqCardiac,
            isolation: newRoom.eqIso
          },
          status: 'Available',
          patientId: null, patientName: null, assignedDoctor: null, assignedNurse: null, admissionDate: null, notes: 'Auto-generated room.'
        });
      }
    } else {
      const newId = `RM-${Date.now().toString().slice(-6)}`;
      generatedRooms.push({
        id: newId,
        block: newRoom.block,
        floor: newRoom.floor,
        ward: newRoom.ward,
        roomNo: newRoom.roomNo,
        bedNo: newRoom.bedNo || 'A',
        type: newRoom.type || (roomTypes && roomTypes[0]) || 'General Bed',
        careLevel: newRoom.careLevel,
        gender: 'Mixed',
        price: `₹ ${Number(newRoom.tariff).toLocaleString()} / day`,
        tariff: Number(newRoom.tariff),
        equipment: {
          oxygen: newRoom.eqOxygen,
          monitor: newRoom.eqMonitor,
          ventilator: newRoom.eqVentilator,
          cardiac: newRoom.eqCardiac,
          isolation: newRoom.eqIso
        },
        status: 'Available',
        patientId: null, patientName: null, assignedDoctor: null, assignedNurse: null, admissionDate: null, notes: 'Newly added room.'
      });
    }
    
    setRooms(prev => [...generatedRooms, ...(prev || [])]);
    showToast(isBulkMode ? `Generated rooms ${bulkStart} to ${bulkEnd} in ${newRoom.ward}` : `Room ${newRoom.roomNo} added to ${newRoom.ward}`);
    
    setNewRoom(prev => ({
      ...prev, roomNo: '', bedNo: '', eqOxygen: false, eqMonitor: false, eqVentilator: false, eqCardiac: false, eqIso: false
    }));
  };

  const handleDeleteRoom = (roomId) => {
    const room = (rooms || []).find(r => r.id === roomId);
    if (room && room.status === 'Occupied') {
      showToast('Cannot delete an occupied room.', 'error');
      setDeleteConfirm(null);
      return;
    }
    setRooms((rooms || []).filter(r => r.id !== roomId));
    setDeleteConfirm(null);
    showToast('Room deleted', 'info');
  };

  return (
    <div className={styles.page}>
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : toast.type === 'info' ? styles.toastInfo : ''}`}>
          {toast.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon} style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
            <BedDouble size={20} />
          </div>
          <div>
            <h1 className={styles.title}>Room & Bed Directory</h1>
            <p className={styles.subtitle}>Manage physical facility beds, blocks, and room types</p>
          </div>
        </div>
        <div className={styles.headerBadge} style={{ color: '#0f766e', background: 'rgba(13,148,136,.1)', borderColor: 'rgba(13,148,136,.25)' }}>
          <BedDouble size={13} /> {(rooms || []).length} Total Beds
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: '#0d9488' }}>{(rooms || []).length}</div>
          <div className={styles.statLbl}>Total Beds</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: '#2563eb' }}>{(roomTypes || []).length}</div>
          <div className={styles.statLbl}>Room Types</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: '#16a34a' }}>{(rooms || []).filter(r => r.status === 'Available').length}</div>
          <div className={styles.statLbl}>Available Beds</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: '#dc2626' }}>{(rooms || []).filter(r => r.status === 'Occupied').length}</div>
          <div className={styles.statLbl}>Occupied Beds</div>
        </div>
      </div>
      
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        <button 
          onClick={() => { setActiveTab('rooms'); setSearch(''); }}
          style={{ padding: '8px 16px', background: activeTab === 'rooms' ? '#0f766e' : 'transparent', color: activeTab === 'rooms' ? 'white' : '#64748b', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Grid size={14} /> Room Directory
        </button>
        <button 
          onClick={() => { setActiveTab('types'); setSearch(''); }}
          style={{ padding: '8px 16px', background: activeTab === 'types' ? '#0f766e' : 'transparent', color: activeTab === 'types' ? 'white' : '#64748b', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Layers size={14} /> Room Types
        </button>
      </div>

      <div className={styles.layout} style={{ gridTemplateColumns: activeTab === 'rooms' ? '380px 1fr' : '280px 1fr', gap: '24px' }}>
        {/* Left — Add panel */}
        <div className={styles.leftPanel}>
          {activeTab === 'rooms' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className={styles.panelTitle} style={{ fontSize: 15, margin: 0 }}><Plus size={16} /> {isBulkMode ? 'Bulk Generate Beds' : 'Add New Bed'}</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#0f766e', cursor: 'pointer', background: 'rgba(13,148,136,0.1)', padding: '4px 8px', borderRadius: 6 }}>
                  <input type="checkbox" checked={isBulkMode} onChange={e => setIsBulkMode(e.target.checked)} />
                  Bulk Mode
                </label>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18, background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Block / Wing *</label>
                  <input className={styles.addInput} placeholder="e.g. Block A" value={newRoom.block} onChange={e => setNewRoom({...newRoom, block: e.target.value})} />
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Floor</label>
                    <input className={styles.addInput} placeholder="e.g. 1st Floor" value={newRoom.floor} onChange={e => setNewRoom({...newRoom, floor: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Ward Name *</label>
                    <input className={styles.addInput} placeholder="e.g. General" value={newRoom.ward} onChange={e => setNewRoom({...newRoom, ward: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {isBulkMode ? (
                    <>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Start Room No *</label>
                        <input type="number" className={styles.addInput} placeholder="101" value={bulkStart} onChange={e => setBulkStart(e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>End Room No *</label>
                        <input type="number" className={styles.addInput} placeholder="110" value={bulkEnd} onChange={e => setBulkEnd(e.target.value)} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 2 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Room No *</label>
                        <input className={styles.addInput} placeholder="e.g. 101" value={newRoom.roomNo} onChange={e => setNewRoom({...newRoom, roomNo: e.target.value})} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Bed ID</label>
                        <input className={styles.addInput} placeholder="e.g. A" value={newRoom.bedNo} onChange={e => setNewRoom({...newRoom, bedNo: e.target.value})} />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Room Type</label>
                  <select className={styles.addInput} style={{ appearance: 'auto' }} value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value})}>
                    {(roomTypes || []).map(rt => <option key={rt} value={rt}>{rt}</option>) }
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Care Level</label>
                    <select className={styles.addInput} style={{ appearance: 'auto' }} value={newRoom.careLevel} onChange={e => setNewRoom({...newRoom, careLevel: e.target.value})}>
                      <option>General</option>
                      <option>High Dependency (HDU)</option>
                      <option>Critical / ICU</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>Daily Tariff (₹) *</label>
                    <input type="number" className={styles.addInput} placeholder="0" value={newRoom.tariff} onChange={e => setNewRoom({...newRoom, tariff: e.target.value})} />
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 10, display: 'block' }}>Available Equipment</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                      <input type="checkbox" checked={newRoom.eqOxygen} onChange={e => setNewRoom({...newRoom, eqOxygen: e.target.checked})} /> O2
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                      <input type="checkbox" checked={newRoom.eqMonitor} onChange={e => setNewRoom({...newRoom, eqMonitor: e.target.checked})} /> Monitor
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                      <input type="checkbox" checked={newRoom.eqVentilator} onChange={e => setNewRoom({...newRoom, eqVentilator: e.target.checked})} /> Ventilator
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                      <input type="checkbox" checked={newRoom.eqCardiac} onChange={e => setNewRoom({...newRoom, eqCardiac: e.target.checked})} /> Cardiac
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                      <input type="checkbox" checked={newRoom.eqIso} onChange={e => setNewRoom({...newRoom, eqIso: e.target.checked})} /> Isolation
                    </label>
                  </div>
                </div>
              </div>

              <button className={styles.addBtn} style={{ marginTop: 20, background: '#0f766e' }} onClick={handleAddRoom}>
                <Plus size={14} /> {isBulkMode ? 'Generate Beds' : 'Add Bed to Inventory'}
              </button>
            </>
          ) : (
            <>
              <div className={styles.panelTitle}><Plus size={14} /> Add Room Type</div>
              <input
                className={styles.addInput}
                placeholder="e.g. VIP Suite, Maternity Bed..."
                value={newType}
                onChange={e => setNewType(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddType()}
                style={{ marginTop: 15 }}
              />
              <button className={styles.addBtn} onClick={handleAddType} disabled={!newType.trim()} style={{ background: '#0f766e' }}>
                <Plus size={14} /> Add Type
              </button>
              <div className={styles.tipBox}>
                <Info size={12} />
                Room Types define the category of the physical bed. Used to group and price rooms.
              </div>
            </>
          )}
        </div>

        {/* Right — List */}
        <div className={styles.rightPanel}>
          <div className={styles.listHeader}>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder={`Search ${activeTab}...`} 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className={styles.searchInput}
              />
              {search && <button onClick={() => setSearch('')} className={styles.clearBtn}><X size={12} /></button>}
            </div>
            <div className={styles.listCount}>
              {activeTab === 'rooms' ? filteredRooms.length : filteredTypes.length} found
            </div>
          </div>

          <div className={styles.deptList}>
            {activeTab === 'rooms' ? (
              filteredRooms.length === 0 ? (
                <div className={styles.emptyState}>No rooms match your search.</div>
              ) : (
                filteredRooms.map(room => (
                  <div key={room.id} className={styles.deptRow}>
                    <div className={styles.deptRowMain}>
                      <div className={styles.deptAvatar} style={{ background: stringColor(room.type) + '15', color: stringColor(room.type) }}>
                        <BedDouble size={16} />
                      </div>
                      <div className={styles.deptInfo}>
                        <div className={styles.deptName}>Room {room.roomNo} <span style={{ color: '#94a3b8' }}>-</span> {room.bedNo}</div>
                        <div className={styles.deptMeta}>
                          <span><Tag size={10} /> {room.type}</span>
                          <span>•</span>
                          <span>{room.ward} Ward ({room.block})</span>
                        </div>
                      </div>
                      <div className={styles.deptActions}>
                        <button className={styles.iconBtn} style={{ color: '#ef4444' }} onClick={() => setDeleteConfirm(room.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {deleteConfirm === room.id && (
                      <div className={styles.deleteConfirm}>
                        <AlertCircle size={14} color="#dc2626" />
                        <span>Delete this bed?</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                          <button onClick={() => handleDeleteRoom(room.id)} className={styles.delConfirmBtn}>Delete</button>
                          <button onClick={() => setDeleteConfirm(null)} className={styles.delCancelBtn}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )
            ) : (
              filteredTypes.length === 0 ? (
                <div className={styles.emptyState}>No room types match your search.</div>
              ) : (
                filteredTypes.map(type => (
                  <div key={type} className={styles.deptRow}>
                    <div className={styles.deptRowMain}>
                      <div className={styles.deptAvatar} style={{ background: stringColor(type) + '15', color: stringColor(type) }}>
                        <Tag size={16} />
                      </div>
                      
                      {editTypeItem === type ? (
                        <div style={{ flex: 1 }}>
                          <input 
                            autoFocus
                            defaultValue={type}
                            className={styles.editInput}
                            onBlur={e => handleUpdateType(type, e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpdateType(type, e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className={styles.deptInfo}>
                          <div className={styles.deptName}>{type}</div>
                          <div className={styles.deptMeta}>{(rooms || []).filter(r => r.type === type).length} beds</div>
                        </div>
                      )}

                      <div className={styles.deptActions}>
                        <button className={styles.iconBtn} onClick={() => setEditTypeItem(type)}>
                          <Edit2 size={14} />
                        </button>
                        <button className={styles.iconBtn} style={{ color: '#ef4444' }} onClick={() => setDeleteConfirm(type)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {deleteConfirm === type && (
                      <div className={styles.deleteConfirm}>
                        <AlertCircle size={14} color="#dc2626" />
                        <span>Delete this room type?</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                          <button onClick={() => handleDeleteType(type)} className={styles.delConfirmBtn}>Delete</button>
                          <button onClick={() => setDeleteConfirm(null)} className={styles.delCancelBtn}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}