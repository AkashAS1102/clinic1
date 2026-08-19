import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../api/api';

export default function BedManagementPage() {
  const { beds, setBeds, rooms, setRooms } = useApp();
  const [matrix, setMatrix] = useState({ wards: [], rooms: [], beds: [] });

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        const data = await apiService.getBedsMatrix();
        setMatrix(data);
      } catch (err) {
        // Fallback or empty
      }
    };
    fetchMatrix();
  }, []);

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Bed Management</h1>
          <p className="page-subtitle">View and allocate beds across all wards</p>
        </div>
        <button className="btn btn-primary">
          Bulk Generate Beds
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {matrix.wards.map(ward => (
          <div key={ward.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ background: '#f8fafc', padding: '14px 16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{ward.name}</h2>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{ward.block} - {ward.floor}</p>
              </div>
            </div>
            <div className="card-body" style={{ padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {matrix.beds.filter(b => matrix.rooms.find(r => r.id === b.roomId && r.wardId === ward.id)).map(bed => {
                  let bgColor = 'var(--bg)';
                  let borderColor = 'var(--border)';
                  let textColor = 'var(--text-primary)';
                  
                  if (bed.status === 'AVAILABLE') {
                    bgColor = '#f0fdf4';
                    borderColor = '#bbf7d0';
                    textColor = '#166534';
                  } else if (bed.status === 'OCCUPIED') {
                    bgColor = '#fef2f2';
                    borderColor = '#fecaca';
                    textColor = '#991b1b';
                  } else {
                    bgColor = '#fefce8';
                    borderColor = '#fef08a';
                    textColor = '#854d0e';
                  }

                  return (
                    <div key={bed.id} style={{ padding: '12px', border: '1.5px solid', borderRadius: 'var(--radius-sm)', textAlign: 'center', backgroundColor: bgColor, borderColor: borderColor, color: textColor }}>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{bed.bedCode}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase' }}>{bed.status}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {matrix.wards.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          No wards or beds configured. Use Bulk Generate to set up.
        </div>
      )}
    </div>
  );
}
