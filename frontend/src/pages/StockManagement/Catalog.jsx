import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Search, Plus, ChevronRight, Pencil, Trash2,
  AlertTriangle, CheckCircle2, X, RefreshCw
} from 'lucide-react';
import { stockApi } from '../../api/stockApi';
import styles from './Stock.module.css';

/*
  PRODUCT STRUCTURING (as per requirement):
  ─ Category  → "All Medicine" is the primary category
  ─ Generic Name  → INN / common name e.g. "Paracetamol"
  ─ HSN Code      → GST classification
  ─ Packing Type  → physical pack format e.g. "Strip of 10 Tabs", "Box of 6 Vials"
  ─ UoM           → order/issue unit e.g. "Strips", "Vials", "Units"
*/

const CATEGORIES = [
  'All Medicine', 'Consumable', 'Surgical', 'Diagnostic', 'OTC',
  'Tablet', 'Syrup', 'Injection', 'Capsule', 'Drops', 'Ointment'
];

const PACKING_TYPES = [
  'Strip of 10 Tablets', 'Strip of 15 Tablets',
  'Box of 1 Vial', 'Box of 6 Vials', 'Box of 10 Vials',
  'Bottle (60 ml)', 'Bottle (100 ml)', 'Bottle (200 ml)',
  'Box of 10 Ampoules', 'Tube (15 g)', 'Sachet',
  'Single Unit',
];

const UOM_OPTIONS = ['Strips', 'Vials', 'Tablets', 'Capsules', 'Bottles', 'Ampoules', 'Tubes', 'Sachets', 'Units'];

const EMPTY = {
  name: '', genericName: '', categoryType: 'All Medicine',
  sku: '', barcode: '', hsnCode: '',
  packingType: 'Strip of 10 Tablets', uom: 'Strips',
  taxRate: '', unitPrice: '', minStockLevel: '', initialStock: ''
};

export default function Catalog() {
  const [products, setProducts]   = useState([]);
  const [stockMap, setStockMap]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState(null);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3500); };

  const load = async () => {
    setLoading(true);
    try {
      const data = await stockApi.getProducts();
      setProducts(data);
      const sm = {};
      await Promise.all(data.map(async p => {
        try { sm[p.id] = (await stockApi.getCurrentStock(p.id)).currentStock; }
        catch { sm[p.id] = 0; }
      }));
      setStockMap(sm);
    } catch { /* offline – show empty state */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = p  => { setForm({ ...EMPTY, ...p }); setEditId(p.id); setModal(true); };

  const save = async e => {
    e.preventDefault();
    if (!form.name?.trim()) { showToast('Product Name is required.', true); return; }
    if (!form.sku?.trim())  { showToast('SKU is required.', true); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        taxRate:       parseFloat(form.taxRate)       || 0,
        unitPrice:     parseFloat(form.unitPrice)     || 0,
        minStockLevel: parseInt(form.minStockLevel)   || 0,
        initialStock:  parseInt(form.initialStock)    || 0,
      };
      if (editId) await stockApi.updateProduct(editId, payload);
      else        await stockApi.createProduct(payload);
      setModal(false);
      showToast(editId ? `"${form.name}" updated.` : `"${form.name}" added to catalog.`);
      await load();
    } catch (err) { showToast(err.response?.data?.message || err.message, true); }
    finally { setSaving(false); }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from catalog?`)) return;
    try { await stockApi.deleteProduct(id); setProducts(p => p.filter(x => x.id !== id)); showToast(`"${name}" removed.`); }
    catch (err) { showToast(err.message, true); }
  };

  const ALL_CATS = ['All', ...CATEGORIES];

  const filtered = products.filter(p => {
    const matchCat  = catFilter === 'All' || p.categoryType === catFilter;
    const matchSrch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.genericName?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSrch;
  });

  const lowCount  = products.filter(p => typeof stockMap[p.id] === 'number' && p.minStockLevel && stockMap[p.id] <= p.minStockLevel).length;
  const totalVal  = products.reduce((s, p) => s + ((stockMap[p.id] || 0) * (p.unitPrice || 0)), 0);
  const categories = new Set(products.map(p => p.categoryType).filter(Boolean));

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.err ? styles.toastError : ''}`}>
          <CheckCircle2 size={18} /> {toast.msg}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Dashboard</Link>
            <ChevronRight size={14} />
            <span>Stock Management</span>
            <ChevronRight size={14} />
            <span>Product Master</span>
          </div>
          <h1 className={styles.pageTitle}>
            <Package size={26} color="#2563eb" /> Product Master (Catalog)
          </h1>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add New Product
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        {[
          { label: 'Total Products',     value: products.length,           icon: '📦', color: '#eff6ff' },
          { label: 'Low Stock Alerts',   value: lowCount,                  icon: '⚠️', color: '#fff1f2' },
          { label: 'Product Categories', value: categories.size,           icon: '🏷️', color: '#f0fdf4' },
          { label: 'Est. Inventory Value', value: `₹ ${totalVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: '💰', color: '#fef9c3' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: s.color, fontSize: 24 }}>{s.icon}</div>
            <div>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statValue} style={{ fontSize: typeof s.value === 'string' && s.value.length > 6 ? 18 : 26 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Low-stock banner ───────────────────────────────────────────────── */}
      {lowCount > 0 && (
        <div className={`${styles.alertBanner} ${styles.alertBannerRed}`}>
          <div className={styles.alertContent}>
            <AlertTriangle size={20} />
            ⚠️ {lowCount} product(s) are at or below minimum stock level — raise a Purchase Order immediately!
          </div>
        </div>
      )}

      {/* ── Filter & Search ────────────────────────────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          {ALL_CATS.map(c => (
            <button key={c}
              className={`${styles.filterBtn} ${catFilter === c ? styles.filterBtnActive : ''}`}
              onClick={() => setCatFilter(c)}>
              {c === 'All Medicine' ? '💊 All Medicine' : c}
            </button>
          ))}
        </div>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Search name, generic or SKU…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product Name &amp; Generic Name</th>
              <th>Category</th>
              <th>HSN Code</th>
              <th>Packing Type</th>
              <th>UoM</th>
              <th>Tax</th>
              <th>Unit Price</th>
              <th>Min Stock</th>
              <th>Current Stock</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className={styles.emptyRow}><td colSpan={10}>Loading products…</td></tr>
            ) : filtered.length === 0 ? (
              <tr className={styles.emptyRow}>
                <td colSpan={10}>
                  No products found.{' '}
                  <button className="btn btn-ghost btn-sm" onClick={openAdd}>+ Add your first product</button>
                </td>
              </tr>
            ) : filtered.map(p => {
              const stock = stockMap[p.id];
              const isLow = typeof stock === 'number' && p.minStockLevel && stock <= p.minStockLevel;
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{p.name}</div>
                    {p.genericName && (
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        🔬 {p.genericName}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#2563eb', fontFamily: 'monospace', marginTop: 2 }}>{p.sku}</div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${p.categoryType === 'All Medicine' ? styles.badgeBlue : styles.badgeGray}`}>
                      {p.categoryType === 'All Medicine' ? '💊 ' : ''}{p.categoryType || '—'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#475569', fontFamily: 'monospace' }}>{p.hsnCode || '—'}</td>
                  <td style={{ fontSize: 13, color: '#334155' }}>{p.packingType || p.uom || '—'}</td>
                  <td style={{ color: '#64748b' }}>{p.uom || '—'}</td>
                  <td style={{ color: '#64748b' }}>{p.taxRate != null ? `${p.taxRate}%` : '—'}</td>
                  <td><strong style={{ color: '#0f172a' }}>₹ {p.unitPrice ?? '—'}</strong></td>
                  <td>{p.minStockLevel ?? '—'}</td>
                  <td>
                    <div style={{ fontWeight: 800, fontSize: 16, color: isLow ? '#dc2626' : '#16a34a' }}>
                      {typeof stock === 'number' ? stock : '—'}
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', marginLeft: 4 }}>{p.uom}</span>
                    </div>
                    {isLow && (
                      <span className={`${styles.badge} ${styles.badgeRed} ${styles.badgePulse}`}>LOW STOCK</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className={styles.actionBtn} onClick={() => openEdit(p)}
                      style={{ marginRight: 6, color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button className={styles.actionBtn} onClick={() => remove(p.id, p.name)}
                      style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fff1f2' }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add / Edit Modal ────────────────────────────────────────────────── */}
      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(false)}>
          <div className={`${styles.modalCard} ${styles.modalCardWide}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editId ? '✏️ Edit Product' : '📦 Register New Product'}
              </h3>
              <button className={styles.modalCloseBtn} onClick={() => setModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={save}>
              {/* Section: Identification */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Product Identification
                </div>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Product / Brand Name *</label>
                    <input className={styles.formInput} value={form.name} onChange={e => f('name', e.target.value)}
                      placeholder="e.g. Crocin 500mg" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Generic Name (INN)</label>
                    <input className={styles.formInput} value={form.genericName} onChange={e => f('genericName', e.target.value)}
                      placeholder="e.g. Paracetamol" />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>The active ingredient / common name</span>
                  </div>
                </div>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>SKU (Stock Keeping Unit) *</label>
                    <input className={styles.formInput} value={form.sku} onChange={e => f('sku', e.target.value)}
                      placeholder="e.g. MED-PARA-500" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Barcode / QR Code</label>
                    <input className={styles.formInput} value={form.barcode} onChange={e => f('barcode', e.target.value)}
                      placeholder="Scan or enter barcode" />
                  </div>
                </div>
              </div>

              {/* Section: Classification */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Classification &amp; Packing
                </div>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Category</label>
                    <select className={styles.formSelect} value={form.categoryType} onChange={e => f('categoryType', e.target.value)}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Default: All Medicine</span>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Unit of Measurement (UoM)</label>
                    <select className={styles.formSelect} value={form.uom} onChange={e => f('uom', e.target.value)}>
                      {UOM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Used in PO / GRN quantities</span>
                  </div>
                </div>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Packing Type</label>
                    <select className={styles.formSelect} value={form.packingType} onChange={e => f('packingType', e.target.value)}>
                      {PACKING_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Physical pack format</span>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>HSN Code (GST)</label>
                    <input className={styles.formInput} value={form.hsnCode} onChange={e => f('hsnCode', e.target.value)}
                      placeholder="e.g. 30049099" />
                  </div>
                </div>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>GST / Tax Rate (%)</label>
                    <input type="number" className={styles.formInput} value={form.taxRate} onChange={e => f('taxRate', e.target.value)}
                      placeholder="e.g. 12" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Initial / Current Stock Qty</label>
                    <input type="number" className={styles.formInput} value={form.initialStock} onChange={e => f('initialStock', e.target.value)}
                      placeholder="e.g. 50" disabled={!!editId} />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{editId ? 'Cannot be changed here' : 'Set opening balance'}</span>
                  </div>
                </div>
              </div>

              {/* Section: Pricing & Stock */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Pricing &amp; Stock Thresholds
                </div>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Unit Price (₹)</label>
                    <input type="number" className={styles.formInput} value={form.unitPrice} onChange={e => f('unitPrice', e.target.value)}
                      placeholder="Price per UoM" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Min Stock Level (Alert Trigger)</label>
                    <input type="number" className={styles.formInput} value={form.minStockLevel} onChange={e => f('minStockLevel', e.target.value)}
                      placeholder="e.g. 100 strips" />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>A low-stock alert is triggered when stock drops below this</span>
                  </div>
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><RefreshCw size={14} /> Saving…</> : editId ? 'Update Product' : '+ Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
