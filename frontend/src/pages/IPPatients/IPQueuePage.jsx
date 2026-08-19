import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../api/api';

export default function IPQueuePage() {
  const { admissions, setAdmissions, rooms, ipPatients, allocateRoomToIpPatient } = useApp();
  const [triageQueue, setTriageQueue] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Fetch triage queue from API
    const fetchQueue = async () => {
      try {
        const queue = await apiService.getTriageQueue();
        setTriageQueue(queue);
      } catch (err) {
        // use local state
        setTriageQueue(admissions.filter(a => a.admissionStatus === 'TRIAGE_PENDING'));
      }
    };
    fetchQueue();
  }, [admissions]);

  const handleAutoAllocate = (item) => {
    // 1. Find an available room
    const availableRooms = rooms.filter(r => r.status === 'Available');
    if (availableRooms.length === 0) {
      alert('No available beds to allocate!');
      return;
    }
    const selectedRoom = availableRooms[0];

    // 2. We need the legacy ipPatient object for allocateRoomToIpPatient to work
    // In our context, ipPatient might just be created.
    let legacyIp = ipPatients.find(p => p.patientId === item.patientId);
    if (!legacyIp) {
      // Create a dummy one if it doesn't exist yet so context doesn't crash
      legacyIp = { id: item.id || `IP-${Date.now()}`, patientId: item.patientId, patientName: item.patientId };
    }

    // 3. Allocate it automatically
    allocateRoomToIpPatient(legacyIp.id, selectedRoom.id, {
      admissionDateTime: new Date().toISOString(),
      admittingDoctor: item.admittingDoctorId,
      careLevel: item.acuityLevel
    });

    // 4. Update the admission record to 'ADMITTED' and link room
    const updatedAdmission = { ...item, admissionStatus: 'ADMITTED', allocatedRoomId: selectedRoom.id };
    apiService.admitToIp(updatedAdmission).catch(() => {}); // silent fail if offline
    setAdmissions(prev => prev.map(a => a.id === item.id ? updatedAdmission : a));

    alert(`Automatically allocated Bed ${selectedRoom.roomNo} - ${selectedRoom.bedNo} to ${item.patientId}`);
    
    // 5. Navigate to Room Allocator (inventory tab) to show the allocated list
    // RoomAllocation.jsx will need to parse this state to switch to 'inventory' tab, 
    // but by default if we just go there, it shows the allocator. 
    // We'll pass state to hint it.
    navigate('/room-booking/allocate', { state: { showInventory: true } });
  };

  return (
    <div className="page-container">
      <h1 className="page-title">IP Triage Queue</h1>
      <p className="page-subtitle">Manage patients waiting for bed allocation</p>
      
      <div className="card tableCard">
        <div className="card-body" style={{ padding: 0 }}>
          {triageQueue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              No patients in triage queue.
            </div>
          ) : (
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Patient ID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Admitting Doctor</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Acuity Level</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {triageQueue.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.patientId}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{item.admittingDoctorId}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${item.acuityLevel === 'CRITICAL' ? 'badge-red' : 'badge-yellow'}`}>
                        {item.acuityLevel}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button 
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                        onClick={() => handleAutoAllocate(item)}
                      >
                        Auto-Allocate Bed
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
