import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCcw, Plus, ChevronRight, CheckCircle2,
  AlertTriangle, X, FileText
} from 'lucide-react';
import { stockApi } from '../../api/stockApi';
import styles from './Stock.module.css';

const REASON_CODES = ['Damaged in transit', 'Expired', 'Destroyed/Wastage', 'Wrong Item'];

const REASON_META = {
  'Damaged in transit': { cls: styles.badgeYellow, icon: '💥' },
  'Expired':            { cls: styles.badgeRed,    icon: '⏰' },
  'Destroyed/Wastage':  { cls: styles.badgePurple, icon: '🗑️' },
  'Wrong Item':         { cls: styles.badgeBlue,   icon: '❌' },
};

const EMPTY_FORM = { grnItemId: '', productId: '', productName: '', batchNumber: '', returnedQuantity: '', reasonCode: '' };

export default function PurchaseReturns() {
  const [returns, setReturns]   = useState([]);
  const [grnItems, setGrnItems] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [reasonFilter, setReasonFilter] = useState('All');

  const showToast = (msg, err = false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3500); };

  const load = async () => {
    setLoading(true);
    try {
      const [rets, grns] = await Promise.all([stockApi.getReturns(), stockApi.getGrnItems()]);
      setReturns(rets);
      setGrnItems(grns.filter(g => g.status === 'Verified'));
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onGrnSelect = grnItemId => {
    const grn = grnItems.find(g => g.id === grnItemId);
    setForm(f => ({
      ...f, grnItemId,
      productId:   grn?.productId   || '',
      productName: grn?.productName || '',
      batchNumber: grn?.batchNumber || '',
    }));
  };

  const submit = async e => {
    e.preventDefault();
    if (!form.grnItemId || !form.reasonCode || !form.returnedQuantity) {
      showToast('GRN item, reason code, and quantity are required.', true);
      return;
    }
    setSaving(true);
    try {
      await stockApi.processReturn({ ...form, returnedQuantity: Number(form.returnedQuantity) });
      setModal(false);
      setForm(EMPTY_FORM);
      showToast(`Return processed. Debit note generated for "${form.productName}".`);
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, true);
    } finally { setSaving(false); }
  };

  const visible = reasonFilter === 'All' ? returns : returns.filter(r => r.reasonCode === reasonFilter);

  const totalReturned = returns.reduce((s, r) => s + (r.returnedQuantity || 0), 0);
  const debitNotesPending = returns.filter(r => !r.debitNoteGenerated).length;
  const debitNotesGenerated = returns.filter(r => r.debitNoteGenerated).length;

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${toast.err ? styles.toastError : ''}`}><CheckCircle2 size={18} /> {toast.msg}</div>}

      {/* Header */}
      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Dashboard</Link>
            <ChevronRight size={14} />
            <span>Stock Management</span>
            <ChevronRight size={14} />
            <span>Purchase Returns</span>
          </div>
          <h1 className={styles.pageTitle}><RefreshCcw size={26} color="#2563eb" /> Purchase Returns & Debit Notes</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Process Return</button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {[
          { label: 'Total Returns',        value: returns.length,      icon: '↩️', color: '#eff6ff' },
          { label: 'Total Units Returned', value: totalReturned,       icon: '📦', color: '#fff1f2' },
          { label: 'Debit Notes Generated', value: debitNotesGenerated, icon: '📄', color: '#f0fdf4' },
          { label: 'Debit Notes Pending',  value: debitNotesPending,   icon: '⏳', color: '#fffbeb' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: s.color, fontSize: 24 }}>{s.icon}</div>
            <div>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statValue}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Reason breakdown mini cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {REASON_CODES.map(rc => {
          const count = returns.filter(r => r.reasonCode === rc).length;
          const meta  = REASON_META[rc];
          return (
            <div key={rc} style={{
              background: 'white', border: reasonFilter === rc ? '2px solid #2563eb' : '1px solid #e2e8f0',
              borderRadius: 14, padding: '12px 18px', cursor: 'pointer', transition: 'all 0.18s',
              display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }} onClick={() => setReasonFilter(prev => prev === rc ? 'All' : rc)}>
              <span style={{ fontSize: 20 }}>{meta.icon}</span>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{rc}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{count}</div>
              </div>
            </div>
          );
        })}
        {reasonFilter !== 'All' && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setReasonFilter('All')}>Clear filter</button>
          </div>
        )}
      </div>

      {/* Returns Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Product</th>
              <th>Batch</th>
              <th>Qty Returned</th>
              <th>Reason</th>
              <th>Debit Note</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className={styles.emptyRow}><td colSpan={7}>Loading returns…</td></tr>
            ) : visible.length === 0 ? (
              <tr className={styles.emptyRow}><td colSpan={7}>No purchase returns recorded yet.</td></tr>
            ) : visible.map(r => {
              const meta = REASON_META[r.reasonCode] || {};
              return (
                <tr key={r.id}>
                  <td><span style={{ color: '#2563eb', fontWeight: 700, fontFamily: 'monospace' }}>{r.id}</span></td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.productName}</div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#475569' }}>{r.batchNumber || '—'}</td>
                  <td>
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#dc2626' }}>{r.returnedQuantity}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}> units</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${meta.cls || styles.badgeGray}`}>
                      {meta.icon} {r.reasonCode}
                    </span>
                  </td>
                  <td>
                    {r.debitNoteGenerated ? (
                      <span className={`${styles.badge} ${styles.badgeGreen}`}><FileText size={11} /> Generated</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeGray}`}>Pending</span>
                    )}
                  </td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>{r.createdAt?.slice(0, 10) || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Process Return Modal */}
      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Process Return / RTV</h3>
              <button className={styles.modalCloseBtn} onClick={() => { setModal(false); setForm(EMPTY_FORM); }}><X size={20} /></button>
            </div>

            <form onSubmit={submit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select GRN Batch to Return *</label>
                <select className={styles.formSelect} value={form.grnItemId} onChange={e => onGrnSelect(e.target.value)} required>
                  <option value="">— Select a verified GRN item —</option>
                  {grnItems.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.productName} · Batch: {g.batchNumber} · Qty: {g.receivedQuantity}
                    </option>
                  ))}
                </select>
              </div>

              {form.productName && (
                <div className={`${styles.infoBox} ${styles.infoBoxBlue}`} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{form.productName}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
                    Batch: <strong>{form.batchNumber}</strong>
                  </div>
                </div>
              )}

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reason Code *</label>
                  <select className={styles.formSelect} value={form.reasonCode} onChange={e => setForm(f => ({ ...f, reasonCode: e.target.value }))} required>
                    <option value="">— Select reason —</option>
                    {REASON_CODES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quantity to Return *</label>
                  <input type="number" min="1" className={styles.formInput} value={form.returnedQuantity}
                    onChange={e => setForm(f => ({ ...f, returnedQuantity: e.target.value }))}
                    placeholder="e.g. 5" required />
                </div>
              </div>

              <div className={`${styles.alertBanner} ${styles.alertBannerWarn}`}>
                <div className={styles.alertContent}>
                  <AlertTriangle size={16} />
                  This will deduct returned quantity from active stock and auto-generate a Debit Note.
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="button" className="btn btn-outline" onClick={() => { setModal(false); setForm(EMPTY_FORM); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <RefreshCcw size={14} /> {saving ? 'Processing…' : 'Process Return & Generate Debit Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
