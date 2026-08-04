import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Search, Plus, Filter, AlertTriangle, CheckCircle2, 
  ChevronRight, Trash2, Edit2, RefreshCw, X, ShieldAlert, Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './Pharmacy.module.css';

export default function PharmacyInventory() {
  const { pharmacyInventory, addPharmacyMedication, updatePharmacyMedication, deletePharmacyMedication } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExpiryBanner, setShowExpiryBanner] = useState(true);
  const [selectedRestock, setSelectedRestock] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [toast, setToast] = useState(null);

  // Add Med State
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('Antibiotic');
  const [newBatch, setNewBatch] = useState('BAT-2026-X99');
  const [newExpiry, setNewExpiry] = useState('2028-12-31');
  const [newStock, setNewStock] = useState('100');
  const [newMin, setNewMin] = useState('30');
  const [newPrice, setNewPrice] = useState('45');
  const [newSupplier, setNewSupplier] = useState('Sun Pharma India');
  const [newUnit, setNewUnit] = useState('Strip of 10');

  const categories = ['All', 'Antibiotic', 'Analgesic / Antipyretic', 'Cough & Cold', 'Antacid / PPI', 'Anti-Diabetic', 'Anti-Hypertensive', 'Cardiac / Lipid'];

  const filteredInventory = (pharmacyInventory || []).filter(med => {
    const matchCat = filter === 'All' || med.category === filter;
    const matchSearch = !search || med.name.toLowerCase().includes(search.toLowerCase()) || med.batchNo.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const lowStockCount = (pharmacyInventory || []).filter(m => m.stock <= m.minThreshold).length;

  const getDaysToExpiry = (expiryDate) => {
    if (!expiryDate) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };
  
  const expiring7 = (pharmacyInventory || []).filter(m => getDaysToExpiry(m.expiryDate) >= 0 && getDaysToExpiry(m.expiryDate) <= 7);
  const expiring30 = (pharmacyInventory || []).filter(m => getDaysToExpiry(m.expiryDate) > 7 && getDaysToExpiry(m.expiryDate) <= 30);
  const totalExpiring = expiring7.length + expiring30.length;

  const handleRestockSubmit = (e) => {
    e.preventDefault();
    if (!selectedRestock || !restockQty) return;
    const added = Number(restockQty);
    updatePharmacyMedication(selectedRestock.id, {
      stock: selectedRestock.stock + added,
      lastRestocked: new Date().toISOString().slice(0, 10),
    });
    setToast(`Restocked +${added} units for ${selectedRestock.name}. Total Stock: ${selectedRestock.stock + added}`);
    setTimeout(() => setToast(null), 3500);
    setSelectedRestock(null);
    setRestockQty('');
  };

  const handleCreateMedication = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addPharmacyMedication({
      name: newName.trim(),
      category: newCat,
      batchNo: newBatch,
      expiryDate: newExpiry,
      stock: Number(newStock) || 50,
      minThreshold: Number(newMin) || 20,
      price: Number(newPrice) || 50,
      supplier: newSupplier,
      unit: newUnit,
    });
    setToast(`Added "${newName.trim()}" to pharmacy inventory!`);
    setTimeout(() => setToast(null), 3500);
    setNewName('');
    setShowAddModal(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from inventory?`)) {
      deletePharmacyMedication(id);
      setToast(`Removed "${name}" from stock records.`);
      setTimeout(() => setToast(null), 3500);
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
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/pharmacy" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Pharmacy</Link> <ChevronRight size={14} /> <span>1. Inventory & Stock</span>
          </div>
          <h1 className={styles.pageTitle}>📦 Medication Inventory, Batch Tracking & Stock Control</h1>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> + Add New Medication
        </button>
      </div>

      {/* Alert Banner */}
      {showExpiryBanner && totalExpiring > 0 && (
        <div style={{ background: '#fff0f0', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: 12, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {expiring7.length > 0 && (
              <div style={{ color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <AlertTriangle size={18} /> {expiring7.length} medicine(s) expiring within 7 days!
              </div>
            )}
            {expiring30.length > 0 && (
              <div style={{ color: '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} /> {expiring30.length} medicine(s) expiring in 7-30 days.
              </div>
            )}
          </div>
          <button onClick={() => setShowExpiryBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {lowStockCount > 0 && (
        <div className={styles.alertBanner}>
          <div className={styles.alertContent}>
            <AlertTriangle size={22} />
            <span>⚠️ ATTENTION: {lowStockCount} item(s) are currently at or below minimum threshold. Please order from suppliers immediately!</span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className={styles.filterBar}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`${styles.filterBtn} ${filter === cat ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: 280, flexShrink: 0 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search medicine or batch..." 
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
              <th>Medication Name & ID</th>
              <th>Category</th>
              <th>Batch / Expiry</th>
              <th>Supplier Details</th>
              <th>Unit Price</th>
              <th>Stock Status</th>
              <th style={{ textAlign: 'right' }}>Stock Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map(med => {
              const isLow = med.stock <= med.minThreshold;
              const isCrit = med.stock === 0;
              const daysToExpiry = getDaysToExpiry(med.expiryDate);
              const rowStyle = daysToExpiry >= 0 && daysToExpiry <= 7 ? { backgroundColor: '#fee2e2' } : daysToExpiry > 7 && daysToExpiry <= 30 ? { backgroundColor: '#ffedd5' } : {};
              return (
                <tr key={med.id} style={rowStyle}>
                  <td>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>{med.name}</div>
                    <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>{med.id} • <span style={{ color: '#64748b' }}>{med.unit}</span></div>
                  </td>
                  <td><span style={{ fontWeight: 600, color: '#475569' }}>{med.category}</span></td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#334155' }}>Batch: {med.batchNo}</div>
                    <div style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>Exp: {med.expiryDate}</div>
                    {daysToExpiry >= 0 && daysToExpiry <= 30 && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: daysToExpiry <= 7 ? '#dc2626' : '#d97706', marginTop: 4 }}>
                        {daysToExpiry <= 7 ? '🔴' : '🟠'} Expires in {daysToExpiry} days
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{med.supplier}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Restocked: {med.lastRestocked}</div>
                  </td>
                  <td><strong style={{ fontSize: 16, color: '#0f172a' }}>₹ {med.price}</strong></td>
                  <td>
                    <div style={{ marginBottom: 4, fontWeight: 800, fontSize: 15, color: isCrit ? '#991b1b' : isLow ? '#d97706' : '#16a34a' }}>
                      {med.stock} <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>/ min {med.minThreshold}</span>
                    </div>
                    <span className={`${styles.badge} ${isCrit || isLow ? styles.badgeCritical : styles.badgeGood}`}>
                      ● {isCrit ? 'OUT OF STOCK' : isLow ? 'LOW STOCK ALERT' : 'Adequate Stock'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className={styles.actionBtn} onClick={() => setSelectedRestock(med)} style={{ marginRight: 6, borderColor: '#bfdbfe', background: '#eff6ff', color: '#2563eb' }}>
                      <RefreshCw size={13} /> + Restock
                    </button>
                    <button className={styles.actionBtn} onClick={() => handleDelete(med.id, med.name)} style={{ padding: '8px 10px', color: '#dc2626', borderColor: '#fecaca' }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Restock Modal */}
      {selectedRestock && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRestock(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Restock Medication</h3>
              <button onClick={() => setSelectedRestock(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{selectedRestock.name}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Current Stock: <strong>{selectedRestock.stock} {selectedRestock.unit}</strong> • Supplier: {selectedRestock.supplier}</div>
            </div>

            <form onSubmit={handleRestockSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Add Units Received from Supplier *</label>
                <input 
                  type="number" 
                  min="1" 
                  style={{ width: '100%', padding: '12px', borderRadius: 12, border: '2px solid #2563eb', fontSize: 16, fontWeight: 700 }} 
                  placeholder="e.g. 50" 
                  value={restockQty} 
                  onChange={e => setRestockQty(e.target.value)} 
                  required 
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedRestock(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm & Add to Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Register New Medication</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMedication}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Medication Brand & Generic Name *</label>
                <input type="text" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} placeholder="e.g. Tab. Azithromycin 500mg (Azithral)" value={newName} onChange={e => setNewName(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Category</label>
                  <select style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 600 }} value={newCat} onChange={e => setNewCat(e.target.value)}>
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Unit Packaging</label>
                  <input type="text" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={newUnit} onChange={e => setNewUnit(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Batch Number</label>
                  <input type="text" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={newBatch} onChange={e => setNewBatch(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Expiry Date</label>
                  <input type="date" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={newExpiry} onChange={e => setNewExpiry(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Initial Stock</label>
                  <input type="number" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={newStock} onChange={e => setNewStock(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Min Alert Threshold</label>
                  <input type="number" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={newMin} onChange={e => setNewMin(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Price / Unit (₹)</label>
                  <input type="number" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={newPrice} onChange={e => setNewPrice(e.target.value)} required />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Supplier & Distributor Details</label>
                <input type="text" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={newSupplier} onChange={e => setNewSupplier(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Medication to Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
