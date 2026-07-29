import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart3, Package, Pill, DollarSign, AlertTriangle, 
  TrendingUp, Clock, CheckCircle2, ChevronRight, ArrowUpRight, ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './Pharmacy.module.css';

export default function PharmacyDashboard() {
  const { pharmacyInventory, pharmacyQueue, pharmacyBills } = useApp();
  const navigate = useNavigate();

  const inventory = pharmacyInventory || [];
  const queue = pharmacyQueue || [];
  const bills = pharmacyBills || [];

  const totalStockValue = inventory.reduce((acc, med) => acc + ((med?.stock || 0) * (med?.price || 0)), 0);
  const lowStockItems = inventory.filter(med => med && (med.stock || 0) <= (med.minThreshold || 0));
  const dispensedToday = queue.filter(q => q && q.status === 'Dispensed').length;
  const totalRevenueToday = bills.filter(b => b && b.status === 'Paid').reduce((acc, b) => acc + (b?.total || 0), 0);

  const cashCollection = bills.filter(b => b && b.status === 'Paid' && (b.paymentMethod || '').includes('Cash')).reduce((a, b) => a + (b?.total || 0), 0);
  const upiCollection = bills.filter(b => b && b.status === 'Paid' && ((b.paymentMethod || '').includes('UPI') || (b.paymentMethod || '').includes('GPay'))).reduce((a, b) => a + (b?.total || 0), 0);
  const cardCollection = bills.filter(b => b && b.status === 'Paid' && ((b.paymentMethod || '').includes('Credit') || (b.paymentMethod || '').includes('Card'))).reduce((a, b) => a + (b?.total || 0), 0);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/pharmacy" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Pharmacy</Link> <ChevronRight size={14} /> <span>Analytics & Overview</span>
          </div>
          <h1 className={styles.pageTitle}>📊 Pharmacy Executive Analytics & Stock Snapshot</h1>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => navigate('/pharmacy/inventory')}>
            <Package size={16} /> Manage Inventory
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/pharmacy/prescriptions')}>
            <Pill size={16} /> E-Prescription Queue ({queue.filter(q => q.status === 'Ready to Dispense').length})
          </button>
        </div>
      </div>

      {/* Automated Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className={styles.alertBanner}>
          <div className={styles.alertContent}>
            <ShieldAlert size={24} style={{ flexShrink: 0 }} />
            <div>
              <span>AUTOMATED STOCK ALERT: {lowStockItems.length} medication(s) have fallen below their critical threshold!</span>
              <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2 }}>
                Immediate restock order recommended for: {lowStockItems.slice(0, 3).map(m => m.name).join(', ')}
              </div>
            </div>
          </div>
          <button className="btn btn-outline" style={{ background: 'white', color: '#991b1b', borderColor: '#fca5a5' }} onClick={() => navigate('/pharmacy/inventory')}>
            Review Stock
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <DollarSign />
          </div>
          <div>
            <div className={styles.statTitle}>Total Inventory Valuation</div>
            <div className={styles.statValue}>₹ {totalStockValue.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dcfce7', color: '#16a34a' }}>
            <TrendingUp />
          </div>
          <div>
            <div className={styles.statTitle}>Today's Pharmacy Revenue</div>
            <div className={styles.statValue}>₹ {totalRevenueToday.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f3e8ff', color: '#7e22ce' }}>
            <Pill />
          </div>
          <div>
            <div className={styles.statTitle}>Dispensed Prescriptions</div>
            <div className={styles.statValue}>{dispensedToday} Orders</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: lowStockItems.length > 0 ? '#fee2e2' : '#fef9c3', color: lowStockItems.length > 0 ? '#dc2626' : '#d97706' }}>
            <AlertTriangle />
          </div>
          <div>
            <div className={styles.statTitle}>Low Stock / Threshold Alerts</div>
            <div className={styles.statValue}>{lowStockItems.length} Items</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Revenue Snapshot & Turnover Rates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 24, marginBottom: 24 }}>
        {/* Cash Flow Summary */}
        <div className={styles.tableCard} style={{ margin: 0, padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={20} style={{ color: '#16a34a' }} /> Daily Cash Flow Summary
          </h3>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Breakdown of sales collections across billing payment methods.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
              <span style={{ fontWeight: 700, color: '#334155' }}>📱 UPI / GPay / PhonePe</span>
              <strong style={{ fontSize: 16, color: '#0f172a' }}>₹ {upiCollection.toLocaleString('en-IN')}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
              <span style={{ fontWeight: 700, color: '#334155' }}>💳 Credit / Debit Cards (POS)</span>
              <strong style={{ fontSize: 16, color: '#0f172a' }}>₹ {cardCollection.toLocaleString('en-IN')}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
              <span style={{ fontWeight: 700, color: '#334155' }}>💵 Hard Cash Collections</span>
              <strong style={{ fontSize: 16, color: '#0f172a' }}>₹ {cashCollection.toLocaleString('en-IN')}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 16, background: '#0f172a', color: 'white', borderRadius: 12, marginTop: 6 }}>
              <span style={{ fontWeight: 700 }}>Total Net Receipts</span>
              <strong style={{ fontSize: 18 }}>₹ {totalRevenueToday.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Stock Turnover & Fast Movers */}
        <div className={styles.tableCard} style={{ margin: 0 }}>
          <div className={styles.tableHeader}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} style={{ color: '#2563eb' }} /> Top Dispensed Medications (Turnover)
            </h3>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Real-Time Snapshot</span>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Medication Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Turnover Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.slice(0, 5).map(m => {
                const isLow = m.stock <= m.minThreshold;
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Batch: {m.batchNo} • ₹{m.price}</div>
                    </td>
                    <td><span style={{ fontWeight: 600, color: '#475569' }}>{m.category}</span></td>
                    <td>
                      <strong style={{ fontSize: 15, color: isLow ? '#dc2626' : '#0f172a' }}>{m.stock}</strong>
                      <span style={{ fontSize: 11, color: '#64748b' }}> {m.unit}</span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${isLow ? styles.badgeCritical : styles.badgeGood}`}>
                        ● {isLow ? 'Fast Mover / Restock' : 'Stable Turnover'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
