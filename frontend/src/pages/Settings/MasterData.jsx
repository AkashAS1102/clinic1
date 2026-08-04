import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Trash2, Plus, ArrowRight, Edit2, Check, X } from 'lucide-react';
import styles from './MasterData.module.css';

export default function MasterData() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    departments, setDepartments, 
    designations, setDesignations,
    blocks, setBlocks,
    floors, setFloors,
    roomTypes, setRoomTypes,
    clinicInfo, setClinicInfo
  } = useApp();
  
  const [activeTab, setActiveTab] = useState('departments');
  const [newValue, setNewValue] = useState('');
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['departments', 'designations', 'facility', 'clinic'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setNewValue('');
    navigate(`/settings/master-data?tab=${tab}`);
  };
  
  // States for Facility Structure
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [newBlockName, setNewBlockName] = useState('');
  const [newFloorName, setNewFloorName] = useState('');
  const [newRoomType, setNewRoomType] = useState('');

  // Auto-select first block and floor for better UX
  useEffect(() => {
    if (activeTab === 'facility') {
      if (blocks.length > 0 && !selectedBlock) {
        setSelectedBlock(blocks[0]);
      }
    }
  }, [activeTab, blocks, selectedBlock]);

  useEffect(() => {
    if (selectedBlock && floors[selectedBlock]?.length > 0 && !selectedFloor) {
      setSelectedFloor(floors[selectedBlock][0]);
    }
  }, [selectedBlock, floors, selectedFloor]);

  // Rename state
  const [editingItem, setEditingItem] = useState({ type: null, oldVal: null, newVal: '' });
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: null, item: null, parent: null });

  const startEdit = (type, val) => setEditingItem({ type, oldVal: val, newVal: val });
  const cancelEdit = () => setEditingItem({ type: null, oldVal: null, newVal: '' });
  const saveEdit = () => {
    const { type, oldVal, newVal } = editingItem;
    if (!newVal.trim() || newVal === oldVal) return cancelEdit();
    const val = newVal.trim();
    if (type === 'departments') {
      if (!departments.includes(val)) setDepartments(departments.map(d => d === oldVal ? val : d));
    } else if (type === 'designations') {
      if (!designations.includes(val)) setDesignations(designations.map(d => d === oldVal ? val : d));
    } else if (type === 'blocks') {
      if (!blocks.includes(val)) {
        setBlocks(blocks.map(b => b === oldVal ? val : b));
        if (floors[oldVal]) {
          const newFloors = { ...floors, [val]: floors[oldVal] };
          delete newFloors[oldVal];
          setFloors(newFloors);
        }
        if (selectedBlock === oldVal) setSelectedBlock(val);
      }
    } else if (type === 'floors') {
      const currentFloors = floors[selectedBlock] || [];
      if (!currentFloors.includes(val)) {
        setFloors({ ...floors, [selectedBlock]: currentFloors.map(f => f === oldVal ? val : f) });
        if (selectedFloor === oldVal) setSelectedFloor(val);
      }
    } else if (type === 'roomTypes') {
      if (!roomTypes.includes(val)) setRoomTypes(roomTypes.map(r => r === oldVal ? val : r));
    }
    cancelEdit();
  };

  const confirmDelete = (type, item, parent = null) => {
    setDeleteConfirm({ show: true, type, item, parent });
  };
  
  const executeDelete = () => {
    const { type, item, parent } = deleteConfirm;
    if (type === 'departments') handleDeleteSimple(item, 'departments');
    else if (type === 'designations') handleDeleteSimple(item, 'designations');
    else if (type === 'blocks') handleDeleteBlock(item);
    else if (type === 'floors') handleDeleteFloor(item, parent);
    else if (type === 'roomTypes') handleDeleteRoomType(item);
    setDeleteConfirm({ show: false, type: null, item: null, parent: null });
  };

  const handleAddSimple = () => {
    if (!newValue.trim()) return;
    const value = newValue.trim();

    if (activeTab === 'departments') {
      if (!departments.includes(value)) setDepartments([...departments, value]);
    } else if (activeTab === 'designations') {
      if (!designations.includes(value)) setDesignations([...designations, value]);
    }
    setNewValue('');
  };

  const handleDeleteSimple = (item, typeStr = activeTab) => {
    if (typeStr === 'departments') setDepartments(departments.filter(d => d !== item));
    else if (typeStr === 'designations') setDesignations(designations.filter(d => d !== item));
  };

  const handleAddBlock = () => {
    const val = newBlockName.trim();
    if (!val || blocks.includes(val)) return;
    setBlocks([...blocks, val]);
    if (!floors[val]) setFloors({ ...floors, [val]: [] });
    setNewBlockName('');
    setSelectedBlock(val);
  };

  const handleAddFloor = () => {
    const val = newFloorName.trim();
    if (!val || !selectedBlock) return;
    const currentFloors = floors[selectedBlock] || [];
    if (!currentFloors.includes(val)) {
      setFloors({ ...floors, [selectedBlock]: [...currentFloors, val] });
    }
    setNewFloorName('');
    setSelectedFloor(val);
  };

  const handleAddRoomType = () => {
    const val = newRoomType.trim();
    if (!val || roomTypes.includes(val)) return;
    setRoomTypes([...roomTypes, val]);
    setNewRoomType('');
  };

  const handleDeleteBlock = (block) => {
    setBlocks(blocks.filter(b => b !== block));
    const newFloors = { ...floors };
    delete newFloors[block];
    setFloors(newFloors);
    if (selectedBlock === block) {
      setSelectedBlock('');
      setSelectedFloor('');
    }
  };

  const handleDeleteFloor = (floor, block = selectedBlock) => {
    if (!block) return;
    const currentFloors = floors[block] || [];
    setFloors({
      ...floors,
      [block]: currentFloors.filter(f => f !== floor)
    });
    if (selectedFloor === floor) setSelectedFloor('');
  };

  const handleDeleteRoomType = (type) => {
    setRoomTypes(roomTypes.filter(t => t !== type));
  };

  const handleClinicInfoChange = (e) => {
    const { name, value } = e.target;
    setClinicInfo(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className="page-title">Master Data & Setup</h1>
        <p className="page-subtitle">Manage system departments, staff designations, and hospital structure.</p>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'departments' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('departments')}
        >
          Departments
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'designations' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('designations')}
        >
          Designations
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'facility' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('facility')}
        >
          Facility Structure
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'clinic' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('clinic')}
        >
          Clinic Info
        </button>
      </div>

      <div className={styles.card}>
        {activeTab !== 'facility' ? (
          <>
            <ul className={styles.list}>
              {(activeTab === 'departments' ? departments : designations).map((item, i) => (
                <li key={i} className={styles.listItem}>
                  {editingItem.type === activeTab && editingItem.oldVal === item ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                      <input type="text" className="form-input" style={{ padding: '4px 8px', height: 'auto', flex: 1 }} value={editingItem.newVal} onChange={e => setEditingItem(prev => ({...prev, newVal: e.target.value}))} onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus />
                      <button style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', padding: 4 }} onClick={saveEdit}><Check size={16} /></button>
                      <button style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 4 }} onClick={cancelEdit}><X size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <span>{item}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className={styles.deleteBtn} style={{ color: '#2563eb' }} onClick={() => startEdit(activeTab, item)} title="Rename">
                          <Edit2 size={16} />
                        </button>
                        <button className={styles.deleteBtn} onClick={() => confirmDelete(activeTab, item)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
              {(activeTab === 'departments' ? departments : designations).length === 0 && (
                <li style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                  No items found. Add one below.
                </li>
              )}
            </ul>
            <div className={styles.addForm}>
              <input 
                type="text"
                className={`form-input ${styles.addInput}`}
                placeholder={`New ${activeTab === 'departments' ? 'Department' : 'Designation'}...`}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSimple()}
              />
              <button className={`btn btn-primary ${styles.addBtn}`} onClick={handleAddSimple}>
                <Plus size={16} /> Add
              </button>
            </div>
          </>
        ) : (
          <div className={styles.facilityContainer} style={{ padding: '20px 0' }}>
            {/* 1. SELECT BLOCK */}
            <div style={{ marginBottom: 30 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                1. MANAGE BLOCKS
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                {blocks.map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', background: selectedBlock === b ? '#eff6ff' : '#f8fafc', border: `1px solid ${selectedBlock === b ? '#3b82f6' : '#e2e8f0'}`, color: selectedBlock === b ? '#1d4ed8' : '#475569', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => { if(editingItem.oldVal !== b) { setSelectedBlock(b); setSelectedFloor(''); }}}>
                    {editingItem.type === 'blocks' && editingItem.oldVal === b ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                        <input type="text" style={{ padding: '2px 6px', fontSize: 12, width: 80, border: '1px solid #cbd5e1', borderRadius: 4, outline: 'none' }} value={editingItem.newVal} onChange={e => setEditingItem(prev => ({...prev, newVal: e.target.value}))} onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus />
                        <Check size={14} style={{ color: '#16a34a', cursor: 'pointer' }} onClick={saveEdit} />
                        <X size={14} style={{ color: '#dc2626', cursor: 'pointer' }} onClick={cancelEdit} />
                      </div>
                    ) : (
                      <>
                        {b}
                        <Edit2 size={13} style={{ marginLeft: 8, color: '#2563eb', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); startEdit('blocks', b); }} />
                        <Trash2 size={13} style={{ marginLeft: 6, color: '#dc2626', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); confirmDelete('blocks', b); }} />
                      </>
                    )}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                  <input type="text" className="form-input" style={{ padding: '6px 10px', fontSize: 13, borderRadius: 16, width: 140 }} placeholder="+ New Block" value={newBlockName} onChange={e => setNewBlockName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddBlock()} />
                  <button className="btn btn-primary btn-sm" style={{ borderRadius: 16, padding: '6px 12px' }} onClick={handleAddBlock}>Add</button>
                </div>
              </div>
            </div>

            {/* 2. SELECT FLOOR */}
            {selectedBlock && (
              <div style={{ marginBottom: 30, paddingLeft: 20, borderLeft: '2px solid #e2e8f0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                  2. MANAGE FLOORS FOR {selectedBlock.toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  {(floors[selectedBlock] || []).map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', background: selectedFloor === f ? '#eff6ff' : '#f8fafc', border: `1px solid ${selectedFloor === f ? '#3b82f6' : '#e2e8f0'}`, color: selectedFloor === f ? '#1d4ed8' : '#475569', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => { if(editingItem.oldVal !== f) { setSelectedFloor(f); }}}>
                      {editingItem.type === 'floors' && editingItem.oldVal === f ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                          <input type="text" style={{ padding: '2px 6px', fontSize: 12, width: 80, border: '1px solid #cbd5e1', borderRadius: 4, outline: 'none' }} value={editingItem.newVal} onChange={e => setEditingItem(prev => ({...prev, newVal: e.target.value}))} onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus />
                          <Check size={14} style={{ color: '#16a34a', cursor: 'pointer' }} onClick={saveEdit} />
                          <X size={14} style={{ color: '#dc2626', cursor: 'pointer' }} onClick={cancelEdit} />
                        </div>
                      ) : (
                        <>
                          {f}
                          <Edit2 size={13} style={{ marginLeft: 8, color: '#2563eb', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); startEdit('floors', f); }} />
                          <Trash2 size={13} style={{ marginLeft: 6, color: '#dc2626', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); confirmDelete('floors', f, selectedBlock); }} />
                        </>
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                    <input type="text" className="form-input" style={{ padding: '6px 10px', fontSize: 13, borderRadius: 16, width: 140 }} placeholder="+ New Floor" value={newFloorName} onChange={e => setNewFloorName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddFloor()} />
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 16, padding: '6px 12px' }} onClick={handleAddFloor}>Add</button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SELECT ROOM TYPE */}
            {selectedFloor && (
              <div style={{ paddingLeft: 40, borderLeft: '2px solid #e2e8f0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                  3. MANAGE ROOM/BED TYPES (GLOBAL)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  {roomTypes.map(t => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 500 }}>
                      {editingItem.type === 'roomTypes' && editingItem.oldVal === t ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input type="text" style={{ padding: '2px 6px', fontSize: 12, width: 80, border: '1px solid #cbd5e1', borderRadius: 4, outline: 'none' }} value={editingItem.newVal} onChange={e => setEditingItem(prev => ({...prev, newVal: e.target.value}))} onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus />
                          <Check size={14} style={{ color: '#16a34a', cursor: 'pointer' }} onClick={saveEdit} />
                          <X size={14} style={{ color: '#dc2626', cursor: 'pointer' }} onClick={cancelEdit} />
                        </div>
                      ) : (
                        <>
                          {t}
                          <Edit2 size={13} style={{ marginLeft: 8, color: '#2563eb', cursor: 'pointer' }} onClick={() => startEdit('roomTypes', t)} />
                          <Trash2 size={13} style={{ marginLeft: 6, color: '#dc2626', cursor: 'pointer' }} onClick={() => confirmDelete('roomTypes', t)} />
                        </>
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                    <input type="text" className="form-input" style={{ padding: '6px 10px', fontSize: 13, borderRadius: 16, width: 140 }} placeholder="+ New Type" value={newRoomType} onChange={e => setNewRoomType(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddRoomType()} />
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 16, padding: '6px 12px' }} onClick={handleAddRoomType}>Add</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'clinic' && (
          <div style={{ padding: '20px', maxWidth: '600px' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Clinic Name</label>
              <input type="text" name="name" className="form-input" value={clinicInfo?.name || ''} onChange={handleClinicInfoChange} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Address</label>
              <textarea name="address" className="form-input" rows="3" value={clinicInfo?.address || ''} onChange={handleClinicInfoChange} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Phone</label>
                <input type="text" name="phone" className="form-input" value={clinicInfo?.phone || ''} onChange={handleClinicInfoChange} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Email</label>
                <input type="email" name="email" className="form-input" value={clinicInfo?.email || ''} onChange={handleClinicInfoChange} />
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>GSTIN</label>
              <input type="text" name="gstin" className="form-input" value={clinicInfo?.gstin || ''} onChange={handleClinicInfoChange} />
            </div>
            <button className="btn btn-primary" onClick={() => alert('Saved successfully!')}>Save Changes</button>
          </div>
        )}
      </div>

      {deleteConfirm.show && (
        <div className={styles.modalOverlay} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className={styles.modalCard} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', maxWidth: '400px', width: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Warning
            </h3>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              Are you sure you want to delete "{deleteConfirm.item}"? This action cannot be undone. Any records currently using this value will retain it but it will no longer appear in dropdown lists.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline" onClick={() => setDeleteConfirm({ show: false, type: null, item: null, parent: null })}>Cancel</button>
              <button className="btn btn-primary" style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }} onClick={executeDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
