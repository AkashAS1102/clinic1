import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../api/api';
import { CheckCircle2, CreditCard } from 'lucide-react';

export default function InPatientStayPage() {
  const { admissions, dischargeIpPatient } = useApp();
  const [activeAdmissions, setActiveAdmissions] = useState([]);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [activeTab, setActiveTab] = useState('emar'); // 'emar' | 'billing'

  const [isDischarging, setIsDischarging] = useState(false);

  useEffect(() => {
    // Fetch admitted patients
    apiService.getTriageQueue()
      .catch(() => {})
      .finally(() => {
        const active = uniqueActives(admissions);
        setActiveAdmissions(active);
        if (active.length > 0) {
          setSelectedAdmission(active[0]);
        }
      });
  }, [admissions]);

  // Helper to mock bill items based on dates
  const getBillItems = (adm) => {
    const items = [
      { date: '2026-08-18', category: 'ROOM_RENT', desc: 'Daily Room Rent (ICU)', amount: 5000 },
      { date: '2026-08-18', category: 'NURSING', desc: 'Nursing Charges', amount: 500 },
      { date: '2026-08-18', category: 'CLINICAL', desc: 'Doctor Consultation - Dr. Smart', amount: 1500 },
      { date: '2026-08-18', category: 'PHARMACY', desc: 'Medications (4 items)', amount: 2400 },
      { date: '2026-08-19', category: 'ROOM_RENT', desc: 'Daily Room Rent (ICU)', amount: 5000 },
      { date: '2026-08-19', category: 'NURSING', desc: 'Nursing Charges', amount: 500 },
      { date: '2026-08-19', category: 'LAB', desc: 'Complete Blood Count', amount: 1200 },
    ];
    return items;
  };

  const uniqueActives = (recs) => {
    // just return dummy if empty, else filter out discharged
    if (!recs || recs.length === 0) return [
      { id: 'ADM-01', patientId: 'P-882019', admissionDate: '2026-08-18 10:00', acuityLevel: 'GENERAL', admissionStatus: 'ADMITTED', primaryDiagnosisIcd10: 'Hypertension', allocatedRoomId: 'RM-001', billStatus: 'PENDING' }
    ];
    return recs.filter(r => r.admissionStatus !== 'DISCHARGED');
  };

  const handleDischarge = () => {
    if (!selectedAdmission) return;
    setIsDischarging(true);
    setTimeout(() => {
      // Call the context discharge
      if (selectedAdmission.patientId) {
        dischargeIpPatient(selectedAdmission.patientId);
      } else {
        dischargeIpPatient(selectedAdmission.id);
      }
      setIsDischarging(false);
      setSelectedAdmission(null);
      alert('Patient has been discharged. Payment marked as completed and room set to Cleaning / Maintenance.');
      setActiveAdmissions(uniqueActives(admissions.filter(a => a.id !== selectedAdmission.id)));
    }, 1500);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">In-Patient EMR & Nursing Station</h1>
      <p className="page-subtitle">Manage admitted patients, record vitals, medications, and billing</p>
      
      <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
        {/* Left Column */}
        <div style={{ width: '280px', flexShrink: 0, borderRight: '1px solid var(--border)', paddingRight: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>Active Patients</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {
              activeAdmissions.length === 0 && <div style={{ color: '#64748b' }}>No active patients.</div>
            }
            {
              activeAdmissions.map(adm => (
                <div 
                  key={adm.id} 
                  onClick={() => setSelectedAdmission(adm)}
                  style={{ 
                    padding: '12px', 
                    border: selectedAdmission?.id === adm.id ? '1.5px solid var(--primary)' : '1px solid var(--border)', 
                    borderRadius: 'var(--radius-md)', 
                    backgroundColor: selectedAdmission?.id === adm.id ? 'var(--primary-light)' : '#fff', 
                    cursor: 'pointer' 
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '14px' }}>
                    {adm.patientId && adm.patientId !== '' ? adm.patientId : adm.id}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{adm.primaryDiagnosisIcd10}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 600 }}>{adm.acuityLevel}</div>
                </div>
              ))
            }
          </div>
        </div>
        
        {/* Right Column */}
        <div style={{ flex: 1 }}>
          {selectedAdmission ? (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                  Patient # {selectedAdmission.patientId || selectedAdmission.id} - Room {selectedAdmission.allocatedRoomId || 'NA' }
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '4px', border: '1px solid #e2e8f0' }}>
                  <button 
                    style={{ padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: activeTab === 'emar' ? '#fff' : 'transparent', fontWeight: activeTab === 'emar' ? 700 : 500, color: activeTab === 'emar' ? '#0d9488' : '#64748b', boxShadow: activeTab === 'emar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                    onClick={() => setActiveTab('emar')}
                  >
                    Nursing & eMAR
                  </button>
                  <button 
                    style={{ padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: activeTab === 'billing' ? '#fff' : 'transparent', fontWeight: activeTab === 'billing' ? 700 : 500, color: activeTab === 'billing' ? '#0d9488' : '#64748b', boxShadow: activeTab === 'billing' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                    onClick={() => setActiveTab('billing')}
                  >
                    Billing & Discharge
                  </button>
                </div>
              </div>
              <div className="card-body">
                {activeTab === 'emar' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Record Vitals Box */}
                    <div style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: '#f8fafc' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Record Vitals</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input type="text" placeholder="BP (e.g. 120/80)" className="form-input" />
                        <input type="number" placeholder="Heart Rate" className="form-input" />
                        <input type="number" placeholder="SpO2 %" className="form-input" />
                        <input type="number" placeholder="Temp (F)" className="form-input" />
                      </div>
                      <button className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>Save Vitals</button>
                    </div>
                    
                    {/* eMAR Box */}
                    <div style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: '#f8fafc' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>eMAR (Medication Admin)</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>Paracetamol 500mg (SOS)</span>
                          <button className="btn btn-outline btn-sm" style={{ color: 'var(--primary)', borderColor: 'var(--primary)', padding: '4px 10px' }}>Administer</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>Ceftriaxone 1g IV (STAT)</span>
                          <button className="btn btn-outline btn-sm" style={{ color: 'var(--primary)', borderColor: 'var(--primary)', padding: '4px 10px' }}>Administer</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'billing' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Billing Ledger Summary</h3>
                    <div className="tableCard" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                          <tr>
                            <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
                            <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</th>
                            <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</th>
                            <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getBillItems(selectedAdmission).map((item, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>{item.date}</td>
                              <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 500 }}>{item.category}</td>
                              <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{item.desc}</td>
                              <td style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>₹ {item.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#f1f5f9' }}>
                            <td colSpan="3" style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>Total Due:</td>
                            <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--primary-dark)', textAlign: 'right' }}>
                              ₹ {getBillItems(selectedAdmission).reduce((total, item) => total + item.amount, 0)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border)', gap: '16px' }}>
                      <button 
                        className="btn"
                        style={{ background: '#16a34a', color: 'white', display: 'flex', gap: '8px', alignItems: 'center' }}
                        onClick={handleDischarge}
                        disabled={isDischarging}
                      >
                        {isDischarging ? 'Completing...' : (
                          <>
                            <CreditCard size={16} /> Pay & Discharge Patient
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)' }}>
              Select a patient from the active list to manage their stay
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
