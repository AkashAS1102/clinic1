import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Receipt, Printer, RotateCcw, CheckCircle2, ChevronRight, 
  Search, FileText, AlertCircle, DollarSign, X, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './Pharmacy.module.css';

export default function PharmacyBilling() {
  const { pharmacyBills, returnPharmacyBill, clinicInfo } = useApp();
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'returns'
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedReturnBill, setSelectedReturnBill] = useState(null);
  const [returnReason, setReturnReason] = useState('Patient reported drug allergy / Doctor modified prescription.');
  const [toast, setToast] = useState(null);

  const bills = pharmacyBills || [];

  const filteredBills = bills.filter(b => {
    const matchSearch = !search || b.id.toLowerCase().includes(search.toLowerCase()) || b.patientName.toLowerCase().includes(search.toLowerCase()) || b.patientId.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'invoices') return matchSearch && b.status === 'Paid';
    if (activeTab === 'returns') return matchSearch && b.status.includes('Returned');
    return matchSearch;
  });

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    if (!selectedReturnBill || !returnReason.trim()) return;

    returnPharmacyBill(selectedReturnBill.id, returnReason.trim());
    setToast(`Return processed for Invoice #${selectedReturnBill.id}. Stock items restored to inventory and refund initiated!`);
    setTimeout(() => setToast(null), 4000);
    setSelectedReturnBill(null);
    setActiveTab('returns');
  };

  const handlePrint = () => {
    window.print();
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
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/pharmacy" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Pharmacy</Link> <ChevronRight size={14} /> <span>3. Billing & Returns</span>
          </div>
          <h1 className={styles.pageTitle}>🧾 Tax Invoices, Automated Computations & Returns Management</h1>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className={styles.filterBar}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className={`${styles.filterBtn} ${activeTab === 'invoices' ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveTab('invoices')}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Receipt size={15} /> Paid Invoices & Receipts ({bills.filter(b => b.status === 'Paid').length})
          </button>
          <button 
            className={`${styles.filterBtn} ${activeTab === 'returns' ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveTab('returns')}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <RotateCcw size={15} /> Returned Meds & Refunds ({bills.filter(b => b.status.includes('Returned')).length})
          </button>
        </div>

        <div style={{ position: 'relative', width: 280 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search invoice or patient..." 
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 100, border: '1.5px solid #cbd5e1', fontSize: 13, outline: 'none' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Invoice ID & Date</th>
              <th>Patient Details</th>
              <th>Items</th>
              <th>Subtotal</th>
              <th>GST (12%) / Disc</th>
              <th>Total Net</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map(bill => {
              const isReturned = bill.status.includes('Returned');
              return (
                <tr key={bill.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>{bill.id}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{bill.date}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{bill.patientName}</div>
                    <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>ID: {bill.patientId}</div>
                  </td>
                  <td><span style={{ fontWeight: 700, color: '#475569' }}>{bill.itemsCount} Item(s)</span></td>
                  <td><span style={{ fontWeight: 600, color: '#475569' }}>₹ {bill.subtotal}</span></td>
                  <td>
                    <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>+₹{bill.gst} GST</div>
                    <div style={{ fontSize: 11, color: '#dc2626' }}>-₹{bill.discount} Disc</div>
                  </td>
                  <td><strong style={{ fontSize: 17, color: '#0f172a' }}>₹ {bill.total}</strong></td>
                  <td>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{bill.paymentMethod}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${isReturned ? styles.badgeLow : styles.badgeDispensed}`}>
                      ● {bill.status}
                    </span>
                    {isReturned && bill.returnReason && (
                      <div style={{ fontSize: 11, color: '#854d0e', marginTop: 2, maxWidth: 180 }}>
                        Reason: {bill.returnReason}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className={styles.actionBtn} onClick={() => setSelectedReceipt(bill)} style={{ marginRight: 6 }}>
                      <Printer size={13} /> Receipt
                    </button>
                    {!isReturned && (
                      <button className={styles.actionBtn} onClick={() => setSelectedReturnBill(bill)} style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fff1f2' }}>
                        <RotateCcw size={13} /> Return
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredBills.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: 40, color: '#64748b', fontStyle: 'italic' }}>
                  No billing or return records found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className={styles.modalOverlay} onClick={() => setSelectedReceipt(null)}>
          <div className={styles.modalCard} style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>OFFICIAL TAX RECEIPT</span>
              <button onClick={() => setSelectedReceipt(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.receiptBox}>
              <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: 14, marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>🏥 {clinicInfo?.name?.toUpperCase() || 'AAROGYA CLINIC PHARMACY'}</h3>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Licensed Chemist & Druggist • GSTIN: {clinicInfo?.gstin || '29AAACA1234A1Z8'}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{clinicInfo?.address || '123 Healthcare Blvd, Bangalore, Karnataka'}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{clinicInfo?.phone || '+91 80 1234 5678'} | {clinicInfo?.email || 'info@aarogya.in'}</div>
              </div>

              <div className={styles.receiptRow}>
                <span>Invoice No: <strong>{selectedReceipt.id}</strong></span>
                <span>Date: {selectedReceipt.date}</span>
              </div>
              <div className={styles.receiptRow} style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: 10, marginBottom: 10 }}>
                <span>Patient: <strong>{selectedReceipt.patientName}</strong></span>
                <span>ID: {selectedReceipt.patientId}</span>
              </div>

              <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 8 }}>DISPENSED ITEMS ({selectedReceipt.items?.length || 1})</div>
              {selectedReceipt.items?.map((it, idx) => (
                <div key={idx} className={styles.receiptRow}>
                  <span>{it.name} (x{it.qty || 1})</span>
                  <span>₹ {(it.price || 50) * (it.qty || 1)}</span>
                </div>
              ))}

              <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: 12, marginTop: 14 }}>
                <div className={styles.receiptRow}>
                  <span>Subtotal Amount:</span>
                  <span>₹ {selectedReceipt.subtotal}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span>CGST + SGST (12%):</span>
                  <span style={{ color: '#16a34a' }}>+₹ {selectedReceipt.gst}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span>Patient Benefit Discount (5%):</span>
                  <span style={{ color: '#dc2626' }}>-₹ {selectedReceipt.discount}</span>
                </div>
                <div className={styles.receiptRow} style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: 8, marginTop: 8 }}>
                  <span>NET PAYABLE TOTAL:</span>
                  <span>₹ {selectedReceipt.total}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b', marginTop: 20, borderTop: '1px dashed #cbd5e1', paddingTop: 12 }}>
                <div>Payment Mode: {selectedReceipt.paymentMethod}</div>
                <div style={{ marginTop: 4, fontWeight: 700, color: '#0f172a' }}>Thank you for visiting Aarogya Clinic. Get well soon!</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setSelectedReceipt(null)}>Close</button>
              <button type="button" className="btn btn-primary" onClick={handlePrint}>
                <Printer size={16} /> Print Official Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return & Refund Modal */}
      {selectedReturnBill && (
        <div className={styles.modalOverlay} onClick={() => setSelectedReturnBill(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RotateCcw size={22} /> Process Medication Return & Refund
              </h3>
              <button onClick={() => setSelectedReturnBill(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 16, background: '#fff1f2', borderRadius: 14, border: '1px solid #fecaca', marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#991b1b' }}>Invoice #{selectedReturnBill.id} — Total Refund: ₹ {selectedReturnBill.total}</div>
              <div style={{ fontSize: 13, color: '#7f1d1d', marginTop: 4 }}>Patient: {selectedReturnBill.patientName} ({selectedReturnBill.patientId})</div>
            </div>

            <form onSubmit={handleReturnSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Reason for Return / Refund *</label>
                <textarea 
                  rows="3" 
                  style={{ width: '100%', padding: '12px', borderRadius: 12, border: '2px solid #fca5a5', fontSize: 14, outline: 'none' }} 
                  value={returnReason} 
                  onChange={e => setReturnReason(e.target.value)} 
                  required
                />
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 10, fontSize: 12, color: '#475569', marginBottom: 20, fontWeight: 600 }}>
                💡 Automated Action: Submitting this form will automatically re-add the returned medication quantities back into live Pharmacy Inventory stock and update sales reports.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedReturnBill(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }}>Confirm Return & Restock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
