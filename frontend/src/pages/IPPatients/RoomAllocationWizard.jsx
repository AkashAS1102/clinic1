import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BedDouble, CheckCircle2, User, Building2, AlertCircle, Search, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RoomAllocationWizard() {
  const { ipPatients = [], rooms = [], allocateRoomToIpPatient } = useApp();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [allocatingPatient, setAllocatingPatient] = useState(null);
  
  // Form state
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  // 1. Pending Patients
  const pendingAdmissions = useMemo(() => {
    return ipPatients.filter(p => !p.allocatedRoomId && p.status !== 'Discharged');
  }, [ipPatients]);

  // 2. Filtered queue
  const filteredQueue = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return pendingAdmissions.filter(p => 
      (p.patientName || '').toLowerCase().includes(q) ||
      (p.patientId || '').toLowerCase().includes(q)
    );
  }, [pendingAdmissions, searchTerm]);

  // 3. Wards and Beds
  const availableRooms = useMemo(() => rooms.filter(r => r.status === 'Available'), [rooms]);
  const wards = useMemo(() => [...new Set(availableRooms.map(r => r.ward).filter(Boolean))], [availableRooms]);
  const bedsInSelectedWard = useMemo(() => availableRooms.filter(r => r.ward === selectedWard), [availableRooms, selectedWard]);

  const handleAllocate = () => {
    if (!allocatingPatient || !selectedRoom) return;
    allocateRoomToIpPatient(allocatingPatient.id, selectedRoom, {
      admittingDoctor: allocatingPatient.doctorName,
      careLevel: allocatingPatient.careLevel || 'General'
    });
    setAllocatingPatient(null);
    setSelectedWard('');
    setSelectedRoom('');
    // Optionally redirect to IP Queue
    navigate('/ip-patients/queue');
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
          <BedDouble size={24} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Room Allocation</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Process pending IP admissions and assign beds</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Left Column: Queue */}
        <div style={{ flex: 1, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="#64748b" /> Pending Admissions ({pendingAdmissions.length})
            </h2>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 8 }} />
              <input 
                type="text" 
                placeholder="Search patient..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ padding: '6px 12px 6px 32px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, width: 200 }}
              />
            </div>
          </div>
          
          <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
            {filteredQueue.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                <CheckCircle2 size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <div>No pending admissions found.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: 12, textAlign: 'left' }}>
                    <th style={{ padding: '12px 20px', fontWeight: 600 }}>Patient</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600 }}>Priority</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600 }}>Pref. Ward</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: allocatingPatient?.id === p.id ? '#f0fdf4' : 'white' }}>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{p.patientName}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>#{p.patientId} • Dr. {p.doctorName}</div>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        {p.priority === 'Emergency' ? (
                          <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>EMERGENCY</span>
                        ) : p.priority === 'Urgent' ? (
                          <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>URGENT</span>
                        ) : (
                          <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>ROUTINE</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: 13, color: '#475569' }}>
                        {p.ward || 'Any'}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <button 
                          onClick={() => {
                            setAllocatingPatient(p);
                            if (p.ward && wards.includes(p.ward)) setSelectedWard(p.ward);
                            else setSelectedWard('');
                            setSelectedRoom('');
                          }}
                          style={{
                            padding: '6px 12px', background: allocatingPatient?.id === p.id ? '#16a34a' : '#f8fafc',
                            color: allocatingPatient?.id === p.id ? 'white' : '#0f172a', border: '1px solid #cbd5e1',
                            borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6
                          }}
                        >
                          {allocatingPatient?.id === p.id ? 'Selected' : 'Assign Bed'} <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Allocation Form */}
        <div style={{ width: 400, flexShrink: 0, opacity: allocatingPatient ? 1 : 0.5, pointerEvents: allocatingPatient ? 'auto' : 'none', transition: 'all 0.2s' }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 16, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={20} color="#3b82f6" /> Bed Assignment
            </h3>
            
            {allocatingPatient ? (
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Allocating for:</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{allocatingPatient.patientName}</div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Reason: {allocatingPatient.admissionReason || 'Not specified'}</div>
                {allocatingPatient.bedTags && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>
                    <strong>Needs:</strong> {Array.isArray(allocatingPatient.bedTags) ? allocatingPatient.bedTags.join(', ') : allocatingPatient.bedTags}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 12, border: '1px dashed #cbd5e1', borderRadius: 8, color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
                Select a patient from the queue first.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Select Ward / Unit</label>
                <select 
                  value={selectedWard} 
                  onChange={e => { setSelectedWard(e.target.value); setSelectedRoom(''); }}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                >
                  <option value="">-- Choose Ward --</option>
                  {wards.map(w => (
                    <option key={w} value={w}>{w} ({availableRooms.filter(r => r.ward === w).length} available)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Select Bed</label>
                <select 
                  value={selectedRoom} 
                  onChange={e => setSelectedRoom(e.target.value)}
                  disabled={!selectedWard}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                >
                  <option value="">-- Choose Bed --</option>
                  {bedsInSelectedWard.map(b => {
                    const tagString = Object.keys(b.equipment || {}).filter(k => b.equipment[k]).join(', ');
                    return (
                      <option key={b.id} value={b.id}>
                        {b.roomNo}-{b.bedNo} ({b.type}) {tagString ? `[${tagString}]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button 
                onClick={handleAllocate}
                disabled={!selectedRoom}
                style={{
                  marginTop: 10, width: '100%', padding: '12px', background: selectedRoom ? '#2563eb' : '#94a3b8',
                  color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
                  cursor: selectedRoom ? 'pointer' : 'not-allowed', transition: 'all 0.2s'
                }}
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
