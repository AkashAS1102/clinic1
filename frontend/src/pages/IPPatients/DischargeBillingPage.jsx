import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../../api/api';
import { FileText, CheckCircle, LogOut, Receipt, Stethoscope } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function DischargeBillingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEncounterId = location.state?.encounterId || null;
  const { ipPatients, patients } = useApp();

  const [loading, setLoading] = useState(false);
  const [discharged, setDischarged] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'billing'

  const encounter = useMemo(() => {
    if (!initialEncounterId) return null;
    return ipPatients.find(p => p.patientId === initialEncounterId || p.id === initialEncounterId || p.encounterId === initialEncounterId);
  }, [ipPatients, initialEncounterId]);

  const patientRecord = useMemo(() => {
    if (!encounter) return null;
    return patients.find(p => p.id === encounter.patientId);
  }, [patients, encounter]);

  useEffect(() => {
    if (!initialEncounterId) {
      navigate('/ip-patients/queue');
    }
  }, [initialEncounterId, navigate]);

  const handleDischarge = async () => {
    if (!encounter) return;
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500)); 
      setDischarged(true);
    } catch (err) {
      alert("Discharge failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const [costs, setCosts] = useState([
    { item: 'Day & Room Cost (3 Days)', amount: 12000 },
    { item: 'Pharmacy / Medicine Cost', amount: 3450 },
    { item: 'Laboratory (Blood Panel, etc)', amount: 2100 },
    { item: 'Imaging & Scans (X-Ray)', amount: 1500 },
    { item: 'Nursing & Vitals Monitoring', amount: 800 },
    { item: 'Doctor Consultations (Primary)', amount: 3000 },
    { item: 'Extra Specialist Consults', amount: 1500 },
  ]);
  const [newCostItem, setNewCostItem] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('');

  if (!encounter) return <div style={{ padding: 40, textAlign: 'center' }}>Loading patient data...</div>;

  const handleAddCost = () => {
    if (newCostItem.trim() && newCostAmount) {
      setCosts([...costs, { item: newCostItem, amount: parseFloat(newCostAmount) }]);
      setNewCostItem('');
      setNewCostAmount('');
    }
  };
  
  const total = costs.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%', maxWidth: 800 }}>
        
        {discharged ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ margin: '0 0 12px', fontSize: 24, color: '#0f172a' }}>Discharge Complete</h2>
            <p style={{ color: '#475569', fontSize: 16 }}>Patient <strong>{encounter.patientName || encounter.patientId}</strong> has been successfully discharged.</p>
            <p style={{ color: '#ca8a04', fontSize: 14, marginTop: 12, background: '#fefce8', padding: '8px 16px', borderRadius: 8, display: 'inline-block' }}>
              Bed {encounter.bedId || encounter.allocatedRoomId || 'N/A'} is now in <strong>Cleaning/Buffer</strong> status for the next 2 hours.
            </p>
            <div style={{ marginTop: 32 }}>
              <button className="btn btn-primary" onClick={() => navigate('/ip-patients/queue')}>Return to Dashboard</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: 22, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <LogOut size={24} color="#3b82f6" /> Patient Discharge
              </h2>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{encounter.patientName || encounter.patientId}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Bed {encounter.bedId || encounter.allocatedRoomId || 'N/A'} | {encounter.doctorName || encounter.admittingDocId}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <button 
                onClick={() => setActiveTab('summary')}
                style={{
                  padding: '10px 20px', background: 'none', border: 'none', 
                  borderBottom: activeTab === 'summary' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === 'summary' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <Stethoscope size={16} /> Discharge Summary
              </button>
              <button 
                onClick={() => setActiveTab('billing')}
                style={{
                  padding: '10px 20px', background: 'none', border: 'none', 
                  borderBottom: activeTab === 'billing' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === 'billing' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <Receipt size={16} /> Discharge Billing
              </button>
            </div>

            {activeTab === 'summary' && (
              <div style={{ background: '#f1f5f9', borderRadius: 8, padding: 20, marginBottom: 32 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#334155', borderBottom: '1px solid #cbd5e1', paddingBottom: 8 }}>Clinical Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Admitting Diagnosis</div>
                    <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{encounter.diagnosis || 'Pending / Not set'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Admission Date</div>
                    <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{encounter.admissionDate ? new Date(encounter.admissionDate).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
                
                <h4 style={{ fontSize: 14, color: '#334155', margin: '16px 0 8px' }}>Discharge Medications</h4>
                {encounter.prescriptions && encounter.prescriptions.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-primary)', fontSize: 14 }}>
                    {encounter.prescriptions.map((rx, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        <strong>{rx.medicine}</strong> - {rx.dosage} ({rx.frequency}) 
                        {rx.instruction && ` [${rx.instruction}]`}
                        {rx.duration && ` for ${rx.duration}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>No discharge medications prescribed.</div>
                )}
                
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>Follow-up Instructions</div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', background: 'white', padding: 12, borderRadius: 6, border: '1px solid var(--border)' }}>
                    Please schedule a follow-up appointment in 1 week.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div style={{ background: '#f1f5f9', borderRadius: 8, padding: 20, marginBottom: 32 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#334155', borderBottom: '1px solid #cbd5e1', paddingBottom: 8 }}>Payment Breakdown</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                  <tbody>
                    {costs.map((c, i) => (
                      <tr key={i}>
                        <td style={{ padding: '12px 0', borderBottom: '1px dashed #cbd5e1', color: '#475569', fontSize: 14 }}>{c.item}</td>
                        <td style={{ padding: '12px 0', borderBottom: '1px dashed #cbd5e1', textAlign: 'right', fontWeight: 500, color: '#0f172a', fontSize: 14 }}>₹{c.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ padding: '16px 0 0', fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Grand Total</td>
                      <td style={{ padding: '16px 0 0', textAlign: 'right', fontWeight: 800, fontSize: 18, color: '#2563eb' }}>₹{total.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Add Extra Charges</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="text" 
                      placeholder="Description (e.g. Extra Supplies)" 
                      className="form-input" 
                      style={{ flex: 1 }}
                      value={newCostItem}
                      onChange={e => setNewCostItem(e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="Amount" 
                      className="form-input" 
                      style={{ width: 120 }}
                      value={newCostAmount}
                      onChange={e => setNewCostAmount(e.target.value)}
                    />
                    <button 
                      className="btn btn-primary" 
                      onClick={handleAddCost}
                      disabled={!newCostItem.trim() || !newCostAmount}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-outline" onClick={() => navigate('/ip-patients/queue')} disabled={loading}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={handleDischarge} 
                disabled={loading}
                style={{ background: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <CheckCircle size={16} /> {loading ? 'Processing...' : 'Confirm Discharge'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
