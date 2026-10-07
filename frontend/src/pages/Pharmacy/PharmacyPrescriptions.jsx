import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ClipboardList, CheckCircle2, AlertCircle, Clock, ShieldAlert, 
  ChevronRight, ArrowRight, User, Stethoscope, FileText, Check, DollarSign, X, Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './Pharmacy.module.css';

export default function PharmacyPrescriptions() {
  const { pharmacyQueue, sendToCentralBilling } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [selectedRxForDispense, setSelectedRxForDispense] = useState(null);
  const [viewPaidRx, setViewPaidRx] = useState(null);

  const [toast, setToast] = useState(null);
  const [isDispensing, setIsDispensing] = useState(false);
  const [editableItems, setEditableItems] = useState([]);

  const queue = pharmacyQueue || [];

  const filteredQueue = queue.filter(q => {
    if (filter === 'Ready to Dispense') return q.status === 'Ready to Dispense';
    if (filter === 'Dispensed') return q.status === 'Dispensed' || q.status === 'Sent to Billing';
    return true;
  });

  const calculateDefaultQty = (dosageStr, daysStr) => {
    let dailyDose = 1;
    if (dosageStr) {
      const freqMatch = dosageStr.match(/(\d+)-(\d+)-(\d+)/);
      if (freqMatch) {
        dailyDose = parseInt(freqMatch[1]) + parseInt(freqMatch[2]) + parseInt(freqMatch[3]);
      }
    }
    let days = 1;
    const durationStr = (daysStr || dosageStr || '').toString().toLowerCase();
    const numMatch = durationStr.match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      if (durationStr.includes('week')) {
        days = num * 7;
      } else if (durationStr.includes('month')) {
        days = num * 30;
      } else {
        days = num;
      }
    }
    const total = Math.ceil((dailyDose > 0 ? dailyDose : 1) * (days > 0 ? days : 1));
    return total > 0 ? total : 1;
  };

  const handleOpenSaleBill = (rx) => {
    setSelectedRxForDispense(rx);
    setEditableItems(rx.items ? rx.items.map(i => ({ 
      ...i, 
      qty: i.qty || calculateDefaultQty(i.dosage, i.days) 
    })) : []);
  };

  const handleQtyChange = (idx, newQty) => {
    const updated = [...editableItems];
    updated[idx].qty = Math.max(0, parseInt(newQty) || 0);
    setEditableItems(updated);
  };

  const calculateTotal = () => {
    return editableItems.reduce((acc, item) => acc + ((item.price || 50) * item.qty), 0);
  };

  const handleSendToBilling = (e) => {
    e.preventDefault();
    if (!selectedRxForDispense) return;
    if (isDispensing) return;

    setIsDispensing(true);
    try {
      const total = calculateTotal();
      sendToCentralBilling(selectedRxForDispense.id, editableItems, total);
      setToast(`Sale Bill sent to Central Billing for ${selectedRxForDispense.patientName}!`);
      setTimeout(() => { setToast(null); }, 4000);
    } finally {
      setIsDispensing(false);
      setSelectedRxForDispense(null);
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
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/pharmacy" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Pharmacy</Link> <ChevronRight size={14} /> <span>2. E-Prescription Queue</span>
          </div>
          <h1 className={styles.pageTitle}>📋 E-Prescription Queue & Direct EMR Sync</h1>
        </div>

        <button className="btn btn-outline" onClick={() => navigate('/billing')}>
          <DollarSign size={16} /> Go to Central Billing
        </button>
      </div>

      {/* Info Header */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Stethoscope size={24} style={{ color: '#2563eb' }} />
          <div>
            <span style={{ fontWeight: 800, color: '#1e40af', fontSize: 15 }}>Real-Time Doctor EMR Sync Active</span>
            <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>Prescriptions entered by doctors in the Consultation View route directly here to eliminate manual entry errors.</div>
          </div>
        </div>
        <div className={`${styles.badge} ${styles.badgeReady}`} style={{ fontSize: 13, padding: '6px 14px' }}>
          ● {queue.filter(q => q.status === 'Ready to Dispense').length} Orders Pending
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['All', 'Ready to Dispense', 'Dispensed'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f} ({f === 'All' ? queue.length : queue.filter(q => f === 'Dispensed' ? (q.status === 'Dispensed' || q.status === 'Sent to Billing') : q.status === f).length})
            </button>
          ))}
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Prescription ID & Date</th>
              <th>Patient Details</th>
              <th>Doctor & Diagnosis</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQueue.map(rx => {
              const isPending = rx.status === 'Ready to Dispense';
              const isPaid = !isPending && (rx.status === 'Paid' || rx.status === 'Dispensed' || rx.status === 'Sent to Billing');
              return (
                <tr key={rx.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{rx.id}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{rx.createdAt || rx.date}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{rx.patientName} ({rx.age})</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>ID: {rx.patientId}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#334155' }}>Dr. {rx.doctorName}</div>
                   <div style={{ fontSize: 13, color: '#64748b' }}>{rx.diagnosis || 'General Consultation'}</div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${isPending ? styles.badgeReady : (isPaid ? styles.badgeDispensed : styles.badgeReady)}`} style={isPaid ? { background: '#dcfce7', color: '#16a34a', borderColor: '#bbf7d0' } : {}}>
                      {isPending ? '⏳ Pending' : (isPaid ? '💰 Paid' : '✔ Billed')}
                    </span>
                  </td>
                  <td>
                    {isPending ? (
                      <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => handleOpenSaleBill(rx)}>
                        <Eye size={14} /> View Sale Bill
                      </button>
                    ) : isPaid ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 13, background: '#10b981', color: 'white', borderColor: '#10b981', cursor: 'default' }} disabled>
                          Bill Paid
                        </button>
                        <button
                          title="View Medicines"
                          onClick={() => setViewPaidRx(rx)}
                          style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#2563eb' }}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 13 }} disabled>
                        Sent to Bill
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredQueue.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No prescriptions found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sale Bill Modal */}
      {selectedRxForDispense && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRxForDispense(null)}>
          <div className={styles.modalCard} style={{ maxWidth: 800 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Sale Bill - Adjust Quantities</h3>
              <button onClick={() => setSelectedRxForDispense(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Patient: {selectedRxForDispense.patientName} ({selectedRxForDispense.age})</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Doctor: Dr. {selectedRxForDispense.doctorName} • Rx ID: <strong>{selectedRxForDispense.id}</strong></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Total Payable</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>₹ {calculateTotal()}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSendToBilling}>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 15, color: '#334155' }}>Prescribed Medicines (Edit Quantity)</h4>
                <div className={styles.tableCard}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Medicine Name</th>
                        <th>Dosage & Duration</th>
                        <th>Unit Price</th>
                        <th style={{ width: 100 }}>Quantity</th>
                        <th>Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableItems.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700 }}>{item.name}</td>
                          <td style={{ fontSize: 13, color: '#64748b' }}>{item.dosage} ({item.days || '5 days'})</td>
                          <td>₹{item.price || 50}</td>
                          <td>
                            <input 
                              type="number" 
                              min="0" 
                              value={item.qty} 
                              onChange={(e) => handleQtyChange(idx, e.target.value)}
                              style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                          </td>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>₹{(item.price || 50) * item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fef08a', padding: 12, borderRadius: 10, fontSize: 12, color: '#854d0e', marginBottom: 20, fontWeight: 600 }}>
                💡 Notice: Confirming this will send the bill to the Central Billing desk. Stock will be temporarily reserved.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedRxForDispense(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  Send to Billing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Medicines Modal for Paid Bills */}
      {viewPaidRx && (
        <div className={styles.modalOverlay} onClick={() => setViewPaidRx(null)}>
          <div className={styles.modalCard} style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>
                <Eye size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: '#2563eb' }} />
                Medicines — {viewPaidRx.patientName}
              </h3>
              <button onClick={() => setViewPaidRx(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{viewPaidRx.patientName} ({viewPaidRx.age}) &nbsp;•&nbsp; ID: {viewPaidRx.patientId}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                Dr. {viewPaidRx.doctorName} &nbsp;•&nbsp; Rx: <strong>{viewPaidRx.id}</strong> &nbsp;•&nbsp; {viewPaidRx.diagnosis || 'General Consultation'}
              </div>
            </div>

            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine Name</th>
                    <th>Dosage</th>
                    <th>Duration</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewPaidRx.items || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No medicines recorded.</td>
                    </tr>
                  ) : (viewPaidRx.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ color: '#94a3b8', fontSize: 13 }}>{idx + 1}</td>
                      <td style={{ fontWeight: 700 }}>{item.name}</td>
                      <td style={{ fontSize: 13, color: '#64748b' }}>{item.dosage || '—'}</td>
                      <td style={{ fontSize: 13, color: '#64748b' }}>{item.days || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{item.qty ?? '—'}</td>
                      <td>₹{item.price || 50}</td>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>₹{(item.price || 50) * (item.qty || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setViewPaidRx(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
