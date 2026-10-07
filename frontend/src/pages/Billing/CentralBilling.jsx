import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, CheckCircle2, DollarSign, Search, CreditCard, X, FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function CentralBilling() {
  const { centralBills, processCentralPayment } = useApp();
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI / GPay');
  const [toast, setToast] = useState(null);

  const uniqueBills = (centralBills || []).filter(
    (bill, idx, arr) => arr.findIndex(b => b.id === bill.id) === idx
  );
  const pendingBills = uniqueBills.filter(b => b.status === 'Pending');
  const paidBills = uniqueBills.filter(b => b.status === 'Paid');

  const filteredPending = pendingBills.filter(b => 
    !search || b.patientName.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase())
  );

  const handlePayment = (e) => {
    e.preventDefault();
    if (!selectedBill) return;

    processCentralPayment(selectedBill.id, paymentMethod);
    setToast(`Payment collected for ${selectedBill.patientName} (${selectedBill.id})!`);
    setTimeout(() => setToast(null), 4000);
    setSelectedBill(null);
  };

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', marginLeft: 260 }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#10b981', color: 'white', padding: '14px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Link to="/" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <span>Bill</span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DollarSign size={28} color="#2563eb" /> Bill
        </h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Pending Payments ({filteredPending.length})</h2>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search by Patient Name or Bill ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '13px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Bill ID & Date</th>
                <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Patient</th>
                <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Bill Type</th>
                <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Amount</th>
                <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPending.map(bill => (
                <tr key={bill.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{bill.id}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{bill.date}</div>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{bill.patientName}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>ID: {bill.patientId}</div>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ display: 'inline-block', padding: '4px 10px', background: '#eff6ff', color: '#2563eb', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
                      {bill.type}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '16px' }}>₹ {bill.totalAmount}</div>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <button 
                      onClick={() => setSelectedBill(bill)}
                      style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CreditCard size={14} /> Collect Payment
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPending.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No pending bills found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Recent Paid Bills ({paidBills.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '13px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Bill ID</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Patient</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Amount</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {paidBills.slice(0, 10).map(bill => (
              <tr key={bill.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>{bill.id}</td>
                <td style={{ padding: '12px', color: '#334155' }}>{bill.patientName}</td>
                <td style={{ padding: '12px', fontWeight: 700, color: '#10b981' }}>₹ {bill.totalAmount}</td>
                <td style={{ padding: '12px', color: '#64748b' }}>{bill.paymentMethod}</td>
              </tr>
            ))}
            {paidBills.length === 0 && (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No recently paid bills.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedBill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Collect Payment</h3>
              <button onClick={() => setSelectedBill(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Patient</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedBill.patientName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Bill ID</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedBill.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e2e8f0', marginTop: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Total Amount</span>
                <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '18px' }}>₹ {selectedBill.totalAmount}</span>
              </div>
            </div>

            <form onSubmit={handlePayment}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '15px' }}
                >
                  <option value="UPI / GPay">📱 UPI / Google Pay / PhonePe</option>
                  <option value="Cash">💵 Cash</option>
                  <option value="Credit Card">💳 Credit / Debit Card</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setSelectedBill(null)} style={{ padding: '10px 16px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', border: 'none', background: '#10b981', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
