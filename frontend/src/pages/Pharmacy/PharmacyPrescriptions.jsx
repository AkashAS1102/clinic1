import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ClipboardList, CheckCircle2, AlertCircle, Clock, ShieldAlert, 
  ChevronRight, ArrowRight, User, Stethoscope, FileText, Check, DollarSign, X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './Pharmacy.module.css';

export default function PharmacyPrescriptions() {
  const { pharmacyQueue, dispensePrescription } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [selectedRxForDispense, setSelectedRxForDispense] = useState(null);
  const [allergyReviewed, setAllergyReviewed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI / GPay');
  const [toast, setToast] = useState(null);
  const [isDispensing, setIsDispensing] = useState(false); // BUG-04 fix: dispense lock

  const queue = pharmacyQueue || [];

  const filteredQueue = queue.filter(q => {
    if (filter === 'Ready to Dispense') return q.status === 'Ready to Dispense';
    if (filter === 'Dispensed') return q.status === 'Dispensed';
    return true;
  });

  const handleDispenseConfirm = (e) => {
    e.preventDefault();
    if (!selectedRxForDispense) return;
    if (isDispensing) return; // BUG-04 fix: guard against double-click/re-entry

    setIsDispensing(true);
    try {
      const bill = dispensePrescription(selectedRxForDispense.id, paymentMethod);
      setToast(`Dispensed prescription #${selectedRxForDispense.id} for ${selectedRxForDispense.patientName}! Stock deducted and Invoice #${bill.id} generated.`);
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

        <button className="btn btn-outline" onClick={() => navigate('/pharmacy/billing')}>
          <FileText size={16} /> View Invoices & Receipts
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
              {f} ({f === 'All' ? queue.length : queue.filter(q => q.status === f).length})
            </button>
          ))}
        </div>
      </div>

      {/* Prescription Cards Grid */}
      <div className={styles.grid}>
        {filteredQueue.map(rx => {
          const isPending = rx.status === 'Ready to Dispense';
          return (
            <div key={rx.id} className={styles.rxCard} style={{ borderLeft: isPending ? '5px solid #2563eb' : '5px solid #10b981' }}>
              <div>
                <div className={styles.rxTop}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={styles.patientName}>{rx.patientName}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>({rx.age})</span>
                    </div>
                    <div className={styles.patientSub}>Patient ID: <strong style={{ color: '#0f172a' }}>{rx.patientId}</strong> • Token: <strong>{rx.token}</strong></div>
                  </div>
                  <span className={`${styles.badge} ${isPending ? styles.badgeReady : styles.badgeDispensed}`}>
                    {isPending ? '⏳ Ready to Dispense' : '✔ Dispensed & Billed'}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'flex', gap: 16, marginBottom: 8 }}>
                  <span>👨‍⚕️ Prescribed by: <strong>{rx.doctorName}</strong></span>
                  <span>🕒 Date: <strong>{rx.date}</strong></span>
                </div>

                {/* EMR Sync Box */}
                <div className={styles.emrBox}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>EMR CLINICAL SYNC</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>Diagnosis: {rx.diagnosis || 'General Consultation'}</div>

                  {rx.allergies && rx.allergies !== 'None Known' ? (
                    <div className={styles.allergyAlert}>
                      🚨 KNOWN ALLERGIES: {rx.allergies} — Verify meds before dispensing!
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
                      ✔ No known drug allergies in patient EMR.
                    </div>
                  )}
                </div>

                <div style={{ fontWeight: 800, fontSize: 13, color: '#475569', marginTop: 14 }}>PRESCRIBED MEDICATIONS ({rx.items?.length || 0})</div>
                <ul className={styles.medList}>
                  {rx.items?.map((item, idx) => (
                    <li key={idx} className={styles.medItem}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>Dosage: {item.dosage} • Duration: {item.days || '5 days'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 850, color: '#0f172a' }}>Qty: {item.qty}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>₹{item.price * item.qty}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Estimated Bill Amount</span>
                  <div style={{ fontSize: 18, fontWeight: 850, color: '#0f172a' }}>₹ {rx.totalAmount || 350}</div>
                </div>

                {isPending ? (
                  <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => { setSelectedRxForDispense(rx); setAllergyReviewed(false); }}>
                    <Check size={16} /> Dispense Meds & Bill
                  </button>
                ) : (
                  <button className={styles.actionBtn} onClick={() => navigate('/pharmacy/billing')}>
                    <FileText size={14} /> View Invoice Receipt
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispense Confirmation Modal */}
      {selectedRxForDispense && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRxForDispense(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Dispense Prescription & Checkout</h3>
              <button onClick={() => setSelectedRxForDispense(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Patient: {selectedRxForDispense.patientName} ({selectedRxForDispense.age})</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Doctor: {selectedRxForDispense.doctorName} • Prescription ID: <strong>{selectedRxForDispense.id}</strong></div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#2563eb', marginTop: 8 }}>Total Bill Payable: ₹ {selectedRxForDispense.totalAmount || 350}</div>
            </div>

            <form onSubmit={handleDispenseConfirm}>
              {selectedRxForDispense.allergies && selectedRxForDispense.allergies !== 'None Known' && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                  <div style={{ color: '#dc2626', fontWeight: 800, fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} /> 
                    <span>⚠️ ALLERGY ALERT: This patient has known allergies: {selectedRxForDispense.allergies}. You MUST confirm you have reviewed them before dispensing.</span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#7f1d1d' }}>
                    <input type="checkbox" checked={allergyReviewed} onChange={(e) => setAllergyReviewed(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    I have reviewed the patient allergies and confirmed this prescription is safe to dispense.
                  </label>
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Select Payment Collection Method *</label>
                <select 
                  style={{ width: '100%', padding: '12px', borderRadius: 12, border: '2px solid #2563eb', fontSize: 15, fontWeight: 700 }}
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI / GPay">📱 UPI / Google Pay / PhonePe</option>
                  <option value="Cash">💵 Hard Cash</option>
                  <option value="Credit Card (POS)">💳 Credit / Debit Card (POS Terminal)</option>
                </select>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fef08a', padding: 12, borderRadius: 10, fontSize: 12, color: '#854d0e', marginBottom: 20, fontWeight: 600 }}>
                💡 Notice: Confirming this dispensing action will automatically deduct item quantities from live inventory stock and generate a tax-compliant invoice in the billing module.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedRxForDispense(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={selectedRxForDispense.allergies && selectedRxForDispense.allergies !== 'None Known' && !allergyReviewed} style={{ opacity: (selectedRxForDispense.allergies && selectedRxForDispense.allergies !== 'None Known' && !allergyReviewed) ? 0.5 : 1, cursor: (selectedRxForDispense.allergies && selectedRxForDispense.allergies !== 'None Known' && !allergyReviewed) ? 'not-allowed' : 'pointer' }}>Confirm Dispense & Collect Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
