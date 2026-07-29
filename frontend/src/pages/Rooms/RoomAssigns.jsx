import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bed, UserPlus, LogOut, CheckCircle2, ChevronRight, 
  Search, Filter, User, Stethoscope, UserCheck, X, Plus, Trash2, Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './RoomAssigns.module.css';

export default function RoomAssigns() {
  const { rooms, updateRoom, addRoom, deleteRoom, blocks, floors, patients, doctors, nurses } = useApp();
  const [blockFilter, setBlockFilter] = useState('All');
  const [floorFilter, setFloorFilter] = useState('All');
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Assign Form State
  const [patientId, setPatientId] = useState('');
  const [assignedDoc, setAssignedDoc] = useState('Dr. Arjun Mehta');
  const [assignedNurse, setAssignedNurse] = useState('Sister Anjali Nair');
  const [notes, setNotes] = useState('');

  // Add Bed State
  const [newBedBlock, setNewBedBlock] = useState(blocks[0] || 'Block A');
  const [newBedFloor, setNewBedFloor] = useState(floors[0] || 'Ground Floor');
  const [newBedRoomNo, setNewBedRoomNo] = useState('');
  const [newBedNo, setNewBedNo] = useState('');
  const [newBedType, setNewBedType] = useState('General Bed');
  const [newBedPrice, setNewBedPrice] = useState('₹ 1,500 / day');

  const filteredRooms = (rooms || []).filter(r => {
    if (blockFilter !== 'All' && r.block !== blockFilter) return false;
    if (floorFilter !== 'All' && r.floor !== floorFilter) return false;
    return true;
  });

  const openAssignModal = (room) => {
    setSelectedRoom(room);
    if (room.status === 'Occupied') {
      setPatientId(room.patientId || '');
      setAssignedDoc(room.assignedDoctor || 'Dr. Arjun Mehta');
      setAssignedNurse(room.assignedNurse || 'Sister Anjali Nair');
      setNotes(room.notes || '');
    } else {
      setPatientId(patients[0]?.id || '');
      setAssignedDoc('Dr. Arjun Mehta');
      setAssignedNurse('Sister Anjali Nair');
      setNotes('Routine admission monitored.');
    }
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!selectedRoom) return;

    const pat = patients.find(p => p.id === patientId) || { fullName: 'New Patient', id: patientId };

    updateRoom(selectedRoom.id, {
      status: 'Occupied',
      patientId: pat.id,
      patientName: pat.fullName,
      assignedDoctor: assignedDoc,
      assignedNurse: assignedNurse,
      admissionDate: new Date().toISOString().slice(0, 10),
      notes: notes || 'Assigned via Manager Portal.',
    });

    setToast(`Bed ${selectedRoom.bedNo} in Room ${selectedRoom.roomNo} successfully assigned to ${pat.fullName}!`);
    setTimeout(() => setToast(null), 3500);
    setSelectedRoom(null);
  };

  const handleDischarge = (room) => {
    if (window.confirm(`Are you sure you want to discharge patient ${room.patientName} from Room ${room.roomNo}?`)) {
      updateRoom(room.id, {
        status: 'Available',
        patientId: null,
        patientName: null,
        assignedDoctor: null,
        assignedNurse: null,
        admissionDate: null,
        notes: 'Room cleaned and ready for admission.',
      });
      setToast(`Discharged ${room.patientName}. Room ${room.roomNo} is now Available.`);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleCreateBed = (e) => {
    e.preventDefault();
    if (!newBedRoomNo.trim() || !newBedNo.trim()) return;
    addRoom({
      block: newBedBlock,
      floor: newBedFloor,
      roomNo: newBedRoomNo.trim(),
      bedNo: newBedNo.trim(),
      type: newBedType,
      price: newBedPrice || '₹ 1,500 / day',
      status: 'Available',
      notes: 'New bed registered and sanitized.',
    });
    setToast(`Added Room ${newBedRoomNo.trim()} - Bed ${newBedNo.trim()} to ${newBedBlock}, ${newBedFloor}!`);
    setTimeout(() => setToast(null), 3500);
    setNewBedRoomNo('');
    setNewBedNo('');
    setShowAddBedModal(false);
  };

  const handleDeleteRoom = (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name} from the hospital inventory?`)) {
      deleteRoom(id);
      setToast(`Removed ${name} from records.`);
      setTimeout(() => setToast(null), 3500);
    }
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
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Hospital Head</Link> <ChevronRight size={14} /> <span>Room & Bed Allocation</span>
          </div>
          <h1 className={styles.pageTitle}>🛏️ Live Ward & Bed Allocation Board</h1>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => setShowAddBedModal(true)}>
            <Plus size={16} /> + Add New Bed / Room
          </button>
        </div>
      </div>

      <div className={styles.filterBar} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>Block:</label>
          <select 
            className="form-select"
            style={{ minWidth: '200px' }}
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
          >
            <option value="All">All Blocks</option>
            {blocks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>Floor:</label>
          <select 
            className="form-select"
            style={{ minWidth: '150px' }}
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
          >
            <option value="All">All Floors</option>
            {floors.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600, color: '#64748b' }}>
          Showing {filteredRooms.length} Beds
        </div>
      </div>

      <div className={styles.grid}>
        {filteredRooms.map(room => (
          <div key={room.id} className={styles.roomCard}>
            <div>
              <div className={styles.cardTop}>
                <div>
                  <h3 className={styles.roomNo}>Room {room.roomNo} | Bed {room.bedNo}</h3>
                  <div className={styles.wardName}>{room.block} • {room.floor}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`${styles.statusBadge} ${room.status === 'Occupied' ? styles.statusOcc : room.status === 'Available' ? styles.statusAvail : styles.statusMaint}`}>
                    ● {room.status}
                  </span>
                  <button 
                    onClick={() => handleDeleteRoom(room.id, `Room ${room.roomNo} Bed ${room.bedNo}`)} 
                    style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                    title="Delete Bed"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <span className={styles.price}>{room.price}</span> • <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{room.type}</span>
              </div>

              {room.status === 'Occupied' ? (
                <div className={styles.patientBox}>
                  <div className={styles.patName}>
                    <User size={16} style={{ color: '#2563eb' }} />
                    <span>{room.patientName}</span>
                    <span style={{ fontSize: 11, background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 6 }}>#{room.patientId}</span>
                  </div>
                  <div className={styles.docInfo}>
                    <div>🩺 Doc: <strong>{room.assignedDoctor}</strong></div>
                    <div>💉 Nurse: <strong>{room.assignedNurse}</strong></div>
                    <div>🗓️ Admitted: <strong>{room.admissionDate}</strong></div>
                    {room.notes && <div style={{ marginTop: 6, fontStyle: 'italic', color: '#334155' }}>"{room.notes}"</div>}
                  </div>
                </div>
              ) : (
                <div className={styles.emptyBox}>
                  {room.status === 'Available' ? '🛏️ Bed is currently vacant and ready for new patient admission.' : '🔧 Room under maintenance or sanitization.'}
                </div>
              )}
            </div>

            <div className={styles.cardActions}>
              {room.status === 'Occupied' ? (
                <>
                  <button className={`${styles.btnAction} ${styles.btnAssign}`} onClick={() => openAssignModal(room)}>
                    Transfer / Edit
                  </button>
                  <button className={`${styles.btnAction} ${styles.btnDischarge}`} onClick={() => handleDischarge(room)}>
                    <LogOut size={15} /> Discharge
                  </button>
                </>
              ) : (
                <button className={`${styles.btnAction} ${styles.btnAssign}`} style={{ width: '100%' }} onClick={() => openAssignModal(room)}>
                  <UserPlus size={15} /> Assign Patient Bed
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredRooms.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b', fontSize: 16 }}>
            No beds found matching the selected Block and Floor.
          </div>
        )}
      </div>

      {/* Add Bed Modal */}
      {showAddBedModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddBedModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Add New Bed / Suite</h3>
              <button onClick={() => setShowAddBedModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBed}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Block *</label>
                  <select 
                    style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 600 }}
                    value={newBedBlock}
                    onChange={e => setNewBedBlock(e.target.value)}
                  >
                    {blocks.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Floor *</label>
                  <select 
                    style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 600 }}
                    value={newBedFloor}
                    onChange={e => setNewBedFloor(e.target.value)}
                  >
                    {floors.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Room Number *</label>
                  <input 
                    type="text" 
                    style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }}
                    placeholder="e.g. 101, ICU-1"
                    value={newBedRoomNo}
                    onChange={e => setNewBedRoomNo(e.target.value)}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Bed Identifier *</label>
                  <input 
                    type="text" 
                    style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }}
                    placeholder="e.g. A, B, 01, Single"
                    value={newBedNo}
                    onChange={e => setNewBedNo(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Bed Type</label>
                  <select 
                    style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 600 }}
                    value={newBedType}
                    onChange={e => setNewBedType(e.target.value)}
                  >
                    <option value="General Bed">General Bed</option>
                    <option value="ICU Ventilator Bed">ICU Ventilator Bed</option>
                    <option value="Private AC Suite">Private AC Suite</option>
                    <option value="Isolation Bed">Isolation Bed</option>
                    <option value="OT Table">OT Table</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Price / Day</label>
                  <input 
                    type="text" 
                    style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }}
                    placeholder="e.g. ₹ 1,500 / day"
                    value={newBedPrice}
                    onChange={e => setNewBedPrice(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddBedModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save New Bed</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {selectedRoom && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRoom(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Assign Bed: Room {selectedRoom.roomNo} - Bed {selectedRoom.bedNo}</h3>
              <button onClick={() => setSelectedRoom(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Select Patient *</label>
                <select style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 600 }} value={patientId} onChange={e => setPatientId(e.target.value)} required>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} (#{p.id})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Attending Physician *</label>
                <select style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 600 }} value={assignedDoc} onChange={e => setAssignedDoc(e.target.value)}>
                  {doctors.map(d => (
                    <option key={d.id} value={d.name}>{d.name} ({d.specialty || 'General'})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Assigned Nurse Station</label>
                <select style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 600 }} value={assignedNurse} onChange={e => setAssignedNurse(e.target.value)}>
                  {nurses.map(n => (
                    <option key={n.id} value={n.fullName || n.name}>{n.fullName || n.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Clinical Notes / Monitoring Instructions</label>
                <textarea style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, minHeight: 70 }} placeholder="e.g. Check O2 sat every 4 hrs..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedRoom(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Bed Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
