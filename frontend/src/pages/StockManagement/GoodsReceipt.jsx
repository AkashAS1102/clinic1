import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Truck, ChevronRight, CheckCircle2, ShieldCheck, AlertTriangle,
  ChevronDown, ChevronUp, XCircle, AlertCircle, Info, RefreshCw,
  Package, ClipboardCheck, BarChart2, Clock, Search, Eye,
  ArrowRight, FileText, Thermometer, Calendar, Hash, Tag,
  CheckSquare, X, Star, Award
} from 'lucide-react';
import { stockApi } from '../../api/stockApi';
import styles from './Stock.module.css';

/* ─────────────────────────────────────────────────────────────────────────────
   RESEARCH-BACKED GRN PAGE — based on NetSuite, ERPNext, MocDoc Hospital ERP:
   ────────────────────────────────────────────────────────────────────────────
   COMPONENTS ADDED:
   1. Rich KPI Cards       — POs awaiting, items pending, accepted value, rejection rate
   2. GRN Search / Filter  — Search POs by vendor or ID, filter by status
   3. PO Selection Sidebar — Enhanced cards with delivery deadline & value
   4. Progress Tracker     — Visual item-by-item completion bar
   5. Three-Way QC Form    — Received Qty + Batch# + Expiry + Temperature + QC Notes
   6. Discrepancy Engine   — Auto-flag partial / over-delivered items
   7. Inline Stock Hint    — Shows current stock level while verifying
   8. Accepted/Rejected Panels — Clear separation with undo capability
   9. GRN Summary Modal    — Review before final confirmation
  10. Toast Notifications  — Success/error feedback
─────────────────────────────────────────────────────────────────────────────── */

const DISC_META = {
  'Matched':             { color: '#16a34a', bg: '#dcfce7', label: '✓ Matched',          icon: '✅' },
  'Partial Fulfillment': { color: '#d97706', bg: '#fef9c3', label: '⚠ Partial Delivery', icon: '⚠️' },
  'Over-delivered':      { color: '#dc2626', bg: '#fee2e2', label: '↑ Over-delivered',   icon: '🔺' },
  'Pending':             { color: '#64748b', bg: '#f1f5f9', label: '— Pending',           icon: '⏳' },
};

const REJECTION_REASONS = [
  'Damaged in transit',
  'Expired / Short Expiry (< 6 months)',
  'Wrong Item Delivered',
  'Quantity Mismatch — Vendor Error',
  'Packaging Defect',
  'Temperature Breach (Cold Chain)',
  'Quality Failure / QC Rejected',
  'Other',
];

export default function GoodsReceipt() {
  const navigate = useNavigate();

  const [pendingPOs, setPendingPOs]   = useState([]);
  const [allPOs, setAllPOs]           = useState([]);   // for KPIs
  const [stockMap, setStockMap]       = useState({});
  const [loadingPOs, setLoadingPOs]   = useState(true);
  const [activePO, setActivePO]       = useState(null);
  const [items, setItems]             = useState([]);
  const [expanded, setExpanded]       = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [toast, setToast]             = useState(null);
  const [poSearch, setPoSearch]       = useState('');
  const [confirmModal, setConfirmModal] = useState(false);

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 4500);
  };

  // ── Load Data ──────────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoadingPOs(true);
    try {
      const [all, products] = await Promise.all([stockApi.getPOs(), stockApi.getProducts()]);
      setAllPOs(all);
      setPendingPOs(all.filter(p => ['Sent', 'Partially Received'].includes(p.status)));

      const sm = {};
      await Promise.all(products.map(async p => {
        try { sm[p.id] = (await stockApi.getCurrentStock(p.id)).currentStock; }
        catch { sm[p.id] = 0; }
      }));
      setStockMap(sm);
    } catch { }
    finally { setLoadingPOs(false); }
  };

  useEffect(() => { loadAll(); }, []);

  // ── KPI Metrics ────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const accepted = items.filter(i => i.decision === 'accepted');
    const rejected = items.filter(i => i.decision === 'rejected');
    const acceptedValue = accepted.reduce((s, i) =>
      s + ((parseFloat(i.unitCost) || 0) * (parseInt(i.receivedQuantity) || 0)), 0);
    const rejectionRate = items.length > 0 ? Math.round((rejected.length / items.length) * 100) : 0;
    return {
      pendingPOsCount: pendingPOs.length,
      pendingItems: items.filter(i => i.decision === 'pending').length,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      acceptedValue,
      rejectionRate,
      completedGRNs: allPOs.filter(p => p.status === 'Completed').length,
    };
  }, [pendingPOs, items, allPOs]);

  // ── Select PO ─────────────────────────────────────────────────────────────
  const selectPO = (po) => {
    setActivePO(po);
    const workItems = (po.items || []).map(item => ({
      ...item,
      receivedQuantity:   item.quantityReceived ?? '',
      batchNumber:        '',
      expiryDate:         '',
      storageTemp:        '',
      qcNotes:            '',
      decision:           'pending',
      rejectionReason:    '',
      discrepancyStatus:  'Pending',
    }));
    setItems(workItems);
    if (workItems.length > 0) setExpanded({ [workItems[0].id]: true });
    else setExpanded({});
    setConfirmModal(false);
  };

  const toggle = id => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // ── Discrepancy Engine ─────────────────────────────────────────────────────
  const updateItem = useCallback((id, key, val) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [key]: val };
      if (key === 'receivedQuantity') {
        const ordered  = parseInt(item.quantityRequired) || 0;
        const received = parseInt(val) || 0;
        if (!val || val === '') updated.discrepancyStatus = 'Pending';
        else if (received === ordered) updated.discrepancyStatus = 'Matched';
        else if (received < ordered)   updated.discrepancyStatus = 'Partial Fulfillment';
        else                           updated.discrepancyStatus = 'Over-delivered';
      }
      return updated;
    }));
  }, []);

  // ── Accept Item ────────────────────────────────────────────────────────────
  const acceptItem = (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (!item.batchNumber?.trim())    { showToast('Batch number is required before accepting.', true); return; }
    if (!item.expiryDate?.trim())     { showToast('Expiry date is required before accepting.', true); return; }
    if (!item.receivedQuantity)       { showToast('Enter the received quantity first.', true); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, decision: 'accepted' } : i));
    setExpanded(e => ({ ...e, [id]: false }));
    showToast(`✅ "${item.productName}" accepted — ${item.receivedQuantity} ${item.uom || 'units'} queued for stock.`);
  };

  // ── Reject Item ────────────────────────────────────────────────────────────
  const rejectItem = (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (!item.rejectionReason?.trim()) { showToast('Select a rejection reason first.', true); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, decision: 'rejected' } : i));
    setExpanded(e => ({ ...e, [id]: false }));
    showToast(`❌ "${item.productName}" rejected — will be routed to Purchase Returns.`);
  };

  const undecide = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, decision: 'pending' } : i));
    setExpanded(e => ({ ...e, [id]: true }));
  };

  // ── Submit GRN ─────────────────────────────────────────────────────────────
  const submitGRN = async () => {
    const accepted = items.filter(i => i.decision === 'accepted');
    const rejected = items.filter(i => i.decision === 'rejected');
    const pending  = items.filter(i => i.decision === 'pending');

    if (pending.length > 0) {
      showToast(`${pending.length} item(s) still pending — Accept or Reject each item first.`, true);
      return;
    }
    if (accepted.length === 0) {
      showToast('No items accepted. Nothing to post to stock.', true);
      return;
    }

    setSubmitting(true);
    setConfirmModal(false);
    try {
      for (const item of accepted) {
        const saved = await stockApi.saveGrnItem({
          poId:             activePO.id,
          poItemId:         item.id,
          productId:        item.productId,
          productName:      item.productName,
          batchNumber:      item.batchNumber,
          expiryDate:       item.expiryDate,
          orderedQuantity:  parseInt(item.quantityRequired),
          receivedQuantity: parseInt(item.receivedQuantity),
          qcPassed:         true,
          storageTemp:      item.storageTemp,
          qcNotes:          item.qcNotes,
        });
        await stockApi.verifyGrnItem(saved.id, { verifiedBy: 'Staff' });
      }
      for (const item of rejected) {
        if (item.productId) {
          await stockApi.processReturn({
            productId:        item.productId,
            productName:      item.productName,
            batchNumber:      item.batchNumber || 'N/A',
            returnedQuantity: parseInt(item.receivedQuantity) || parseInt(item.quantityRequired),
            reasonCode:       item.rejectionReason || 'Rejected at GRN',
          });
        }
      }

      showToast(
        `🎉 GRN Confirmed! ${accepted.length} item(s) added to stock.` +
        (rejected.length > 0 ? ` ${rejected.length} rejected item(s) sent to Returns.` : '')
      );
      setActivePO(null);
      setItems([]);
      await loadAll();
      if (rejected.length > 0) {
        setTimeout(() => navigate('/stock-management/returns'), 2200);
      }
    } catch (err) {
      showToast('GRN submission failed: ' + (err.response?.data?.message || err.message), true);
    } finally { setSubmitting(false); }
  };

  // ── Derived State ──────────────────────────────────────────────────────────
  const acceptedItems = items.filter(i => i.decision === 'accepted');
  const rejectedItems = items.filter(i => i.decision === 'rejected');
  const pendingItems  = items.filter(i => i.decision === 'pending');
  const allDecided    = items.length > 0 && pendingItems.length === 0;
  const progressPct   = items.length > 0 ? Math.round(((items.length - pendingItems.length) / items.length) * 100) : 0;

  const filteredPOs = pendingPOs.filter(po =>
    !poSearch ||
    po.vendorName?.toLowerCase().includes(poSearch.toLowerCase()) ||
    po.id?.toLowerCase().includes(poSearch.toLowerCase())
  );

  // ── Sub-components ─────────────────────────────────────────────────────────
  const DiscBadge = ({ status }) => {
    const m = DISC_META[status] || DISC_META['Pending'];
    return (
      <span style={{
        background: m.bg, color: m.color, borderRadius: 20,
        padding: '3px 10px', fontSize: 12, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>
        {m.icon} {m.label}
      </span>
    );
  };

  const isNearExpiry = (dateStr) => {
    if (!dateStr) return false;
    const months = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24 * 30);
    return months < 6;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page} style={{ position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.err ? '#dc2626' : '#16a34a', color: 'white',
          padding: '14px 22px', borderRadius: 14, display: 'flex',
          alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14,
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)', maxWidth: 460,
        }}>
          {toast.err ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.msg}
        </div>
      )}

      {/* ══ 1. PAGE HEADER ══════════════════════════════════════════════════ */}
      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Dashboard</Link>
            <ChevronRight size={14} />
            <span>Stock Management</span>
            <ChevronRight size={14} />
            <span style={{ color: '#0f172a', fontWeight: 700 }}>Goods Receipt (GRN)</span>
          </div>
          <h1 className={styles.pageTitle}>
            <Truck size={26} color="#2563eb" />
            Goods Receipt Note (GRN)
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginLeft: 8 }}>— Inwarding & Quality Check</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadAll}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
          {allDecided && (
            <button
              className="btn btn-primary"
              onClick={() => setConfirmModal(true)}
              disabled={submitting}
              style={{ gap: 8 }}
            >
              <ShieldCheck size={16} />
              {submitting ? 'Posting…' : `Confirm GRN (${acceptedItems.length} ✓ / ${rejectedItems.length} ✗)`}
            </button>
          )}
        </div>
      </div>

      {/* ══ 2. KPI CARDS ════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>

        <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 26 }}>📋</div>
          <div>
            <div className={styles.statLabel} style={{ color: '#3b82f6' }}>POs Awaiting Delivery</div>
            <div className={styles.statValue} style={{ color: '#1d4ed8' }}>{kpis.pendingPOsCount}</div>
            <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 2 }}>Select to inward</div>
          </div>
        </div>

        <div className={styles.statCard} style={{ background: activePO ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : 'white', border: activePO ? '1px solid #fde68a' : '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 26 }}>⏳</div>
          <div>
            <div className={styles.statLabel} style={{ color: '#d97706' }}>Items to Verify</div>
            <div className={styles.statValue} style={{ color: '#b45309' }}>{kpis.pendingItems}</div>
            {activePO && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 2 }}>In active GRN</div>}
          </div>
        </div>

        <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac' }}>
          <div style={{ fontSize: 26 }}>✅</div>
          <div>
            <div className={styles.statLabel} style={{ color: '#16a34a' }}>Accepted to Stock</div>
            <div className={styles.statValue} style={{ color: '#15803d' }}>{kpis.acceptedCount}</div>
            {kpis.acceptedValue > 0 && (
              <div style={{ fontSize: 11, color: '#4ade80', marginTop: 2 }}>₹ {kpis.acceptedValue.toLocaleString('en-IN')}</div>
            )}
          </div>
        </div>

        <div className={styles.statCard} style={{ background: kpis.rejectedCount > 0 ? 'linear-gradient(135deg, #fff1f2, #ffe4e6)' : 'white', border: kpis.rejectedCount > 0 ? '1px solid #fca5a5' : '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 26 }}>❌</div>
          <div>
            <div className={styles.statLabel} style={{ color: '#dc2626' }}>Rejected / Returns</div>
            <div className={styles.statValue} style={{ color: '#b91c1c' }}>{kpis.rejectedCount}</div>
            {kpis.rejectionRate > 0 && <div style={{ fontSize: 11, color: '#f87171', marginTop: 2 }}>{kpis.rejectionRate}% rejection rate</div>}
          </div>
        </div>

        <div className={styles.statCard}>
          <div style={{ fontSize: 26 }}>🏆</div>
          <div>
            <div className={styles.statLabel}>GRNs Completed</div>
            <div className={styles.statValue}>{kpis.completedGRNs}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>All time</div>
          </div>
        </div>

      </div>

      {/* Partial Delivery Rule Banner */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Info size={18} color="#2563eb" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: '#1e40af' }}>
          <strong>Partial Delivery Rule:</strong> If you ordered 10 but only received 8 — enter <strong>8</strong> as received quantity.
          Only <strong>8</strong> will be added to stock. The remaining 2 stays open on the PO as "Partially Received."
          {' '}<strong>Batch number</strong> and <strong>expiry date</strong> are mandatory for every accepted item.
        </div>
      </div>

      {/* ══ 3. MAIN LAYOUT ══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT: PO SELECTOR SIDEBAR ──────────────────────────────────── */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, overflow: 'hidden', position: 'sticky', top: 20 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              📦 Dispatched POs — Select to Inward
            </div>
            {/* PO Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={poSearch}
                onChange={e => setPoSearch(e.target.value)}
                placeholder="Search vendor or PO..."
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ padding: 12, maxHeight: '60vh', overflowY: 'auto' }}>
            {loadingPOs ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>
                <RefreshCw size={18} style={{ display: 'block', margin: '0 auto 8px' }} />
                Loading POs…
              </div>
            ) : filteredPOs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 14px', color: '#94a3b8', fontSize: 13, background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
                {poSearch ? 'No matching POs found.' : (
                  <>No POs in "Sent" status.<br /><span style={{ fontSize: 12, marginTop: 4, display: 'block' }}>Approve a Draft PO first.</span></>
                )}
              </div>
            ) : filteredPOs.map(po => {
              const isActive = activePO?.id === po.id;
              const isOverdue = po.expectedDeliveryDate && new Date(po.expectedDeliveryDate) < new Date();
              return (
                <div
                  key={po.id}
                  onClick={() => selectPO(po)}
                  style={{
                    padding: '12px 14px', borderRadius: 12, marginBottom: 8, cursor: 'pointer',
                    border: isActive ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                    background: isActive ? '#eff6ff' : (isOverdue ? '#fffbeb' : 'white'),
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#2563eb', fontSize: 12, fontFamily: 'monospace' }}>{po.id}</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginTop: 3 }}>{po.vendorName}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{(po.items || []).length} item(s)</span>
                    <span style={{ fontWeight: 700 }}>₹ {(po.totalCost || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {po.expectedDeliveryDate && (
                    <div style={{ fontSize: 11, marginTop: 4, color: isOverdue ? '#dc2626' : '#64748b', fontWeight: isOverdue ? 700 : 400 }}>
                      {isOverdue ? '⚠️ Overdue:' : '📅 Expected:'} {po.expectedDeliveryDate}
                    </div>
                  )}
                  <div style={{ marginTop: 6 }}>
                    <span style={{
                      background: po.status === 'Partially Received' ? '#ede9fe' : '#dbeafe',
                      color: po.status === 'Partially Received' ? '#7c3aed' : '#2563eb',
                      borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700
                    }}>
                      {po.status === 'Partially Received' ? '📦 Partially Received' : '📤 Sent'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: VERIFICATION PANEL ──────────────────────────────────── */}
        <div>
          {!activePO ? (
            /* Empty State */
            <div style={{
              background: 'white', border: '1.5px dashed #e2e8f0', borderRadius: 20,
              padding: 60, textAlign: 'center',
            }}>
              <Truck size={52} color="#e2e8f0" style={{ display: 'block', margin: '0 auto 20px' }} />
              <div style={{ fontWeight: 800, color: '#64748b', fontSize: 18, marginBottom: 8 }}>
                Select a dispatched PO to begin GRN verification
              </div>
              <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>
                Verify batch numbers, expiry dates, and actual received quantities.<br />
                Accept items to add to stock — or Reject if items are damaged or incorrect.
              </div>
              <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { icon: '1️⃣', text: 'Select PO from left' },
                  { icon: '2️⃣', text: 'Verify each item' },
                  { icon: '3️⃣', text: 'Accept or Reject' },
                  { icon: '4️⃣', text: 'Confirm GRN' },
                ].map(s => (
                  <div key={s.text} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>
                    {s.icon} {s.text}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Active PO Summary Bar */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Active GRN Session</div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a' }}>
                      {activePO.id} &nbsp;·&nbsp;
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>{activePO.vendorName}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ color: '#d97706', fontWeight: 700 }}>⏳ {pendingItems.length} pending</span>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>✅ {acceptedItems.length} accepted</span>
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>❌ {rejectedItems.length} rejected</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {allDecided && (
                      <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                        ✓ All items decided
                      </span>
                    )}
                    <button
                      onClick={() => { setActivePO(null); setItems([]); }}
                      style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748b' }}
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {items.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Verification Progress</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb' }}>{progressPct}%</span>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: 100, height: 8, overflow: 'hidden' }}>
                      <div style={{
                        width: `${progressPct}%`, height: '100%', borderRadius: 100,
                        background: progressPct === 100 ? '#16a34a' : '#2563eb',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
                      <span>{items.length} total items</span>
                      <span>·</span>
                      <span style={{ color: '#16a34a' }}>{acceptedItems.length} accepted</span>
                      <span>·</span>
                      <span style={{ color: '#dc2626' }}>{rejectedItems.length} rejected</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── PENDING ITEMS ─────────────────────────────────────────── */}
              {pendingItems.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <AlertTriangle size={16} color="#d97706" />
                    <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Awaiting Verification</span>
                    <span style={{ background: '#fef9c3', color: '#d97706', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{pendingItems.length}</span>
                  </div>

                  {pendingItems.map((item, idx) => {
                    const currentStock = stockMap[item.productId];
                    const nearExpiry = isNearExpiry(item.expiryDate);
                    return (
                      <div
                        key={item.id}
                        style={{
                          background: 'white', border: '1.5px solid #e2e8f0',
                          borderRadius: 16, marginBottom: 12, overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                      >
                        {/* Card Header — click to toggle */}
                        <div
                          onClick={() => toggle(item.id)}
                          style={{
                            padding: '14px 18px', display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', cursor: 'pointer', background: expanded[item.id] ? '#f8fafc' : 'white',
                            borderBottom: expanded[item.id] ? '1px solid #f1f5f9' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>{idx + 1}</div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>{item.productName}</div>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                {item.productSku && <span style={{ fontFamily: 'monospace', marginRight: 8 }}>{item.productSku}</span>}
                                Ordered: <strong>{item.quantityRequired} {item.uom || 'units'}</strong>
                                {typeof currentStock === 'number' && (
                                  <span style={{ marginLeft: 10, color: currentStock < 20 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                                    · Stock: {currentStock}
                                  </span>
                                )}
                              </div>
                            </div>
                            <DiscBadge status={item.discrepancyStatus} />
                          </div>
                          {expanded[item.id] ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                        </div>

                        {/* Expanded QC Form */}
                        {expanded[item.id] && (
                          <div style={{ padding: '20px 18px' }}>

                            {/* Qty comparison */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                                  📦 Ordered Quantity (PO)
                                </label>
                                <input
                                  className={styles.formInput}
                                  value={`${item.quantityRequired} ${item.uom || 'units'}`}
                                  readOnly
                                  style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                                  ✅ Actual Received Quantity *
                                </label>
                                <input
                                  type="number" min="0"
                                  className={styles.formInput}
                                  placeholder={`Enter qty (${item.uom || 'units'})`}
                                  value={item.receivedQuantity}
                                  onChange={e => updateItem(item.id, 'receivedQuantity', e.target.value)}
                                  style={{ border: item.receivedQuantity ? '2px solid #2563eb' : '1.5px solid #e2e8f0' }}
                                />
                                {item.uom && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>in {item.uom}</div>}
                              </div>
                            </div>

                            {/* Discrepancy Alerts */}
                            {item.discrepancyStatus === 'Partial Fulfillment' && (
                              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10 }}>
                                <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                  <div style={{ fontWeight: 700, color: '#92400e', fontSize: 13 }}>Partial Delivery Detected</div>
                                  <div style={{ color: '#b45309', fontSize: 13, marginTop: 3 }}>
                                    Ordered <strong>{item.quantityRequired}</strong>, received only <strong>{item.receivedQuantity}</strong> {item.uom}.
                                    &nbsp;→ Only <strong>{item.receivedQuantity} {item.uom}</strong> will be added to stock. PO stays "Partially Received."
                                  </div>
                                </div>
                              </div>
                            )}
                            {item.discrepancyStatus === 'Over-delivered' && (
                              <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10 }}>
                                <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                                <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 700 }}>
                                  Over-delivered! Received more than ordered. Verify with vendor before accepting excess units.
                                </div>
                              </div>
                            )}

                            {/* Batch & Expiry */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                                  <Hash size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Batch Number *
                                </label>
                                <input
                                  className={styles.formInput}
                                  value={item.batchNumber}
                                  placeholder="e.g. BAT-2026-001"
                                  onChange={e => updateItem(item.id, 'batchNumber', e.target.value)}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                                  <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Expiry Date *
                                </label>
                                <input
                                  type="date"
                                  className={styles.formInput}
                                  value={item.expiryDate}
                                  onChange={e => updateItem(item.id, 'expiryDate', e.target.value)}
                                  style={{ border: nearExpiry && item.expiryDate ? '2px solid #f59e0b' : undefined }}
                                />
                                {nearExpiry && item.expiryDate && (
                                  <div style={{ fontSize: 11, color: '#d97706', marginTop: 3, fontWeight: 700 }}>
                                    ⚠️ Near Expiry — less than 6 months
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Optional: Storage Temp & QC Notes */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                                  <Thermometer size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Storage Temp (°C)
                                </label>
                                <input
                                  type="number"
                                  className={styles.formInput}
                                  value={item.storageTemp}
                                  placeholder="e.g. 2–8°C (optional)"
                                  onChange={e => updateItem(item.id, 'storageTemp', e.target.value)}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                                  <FileText size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />QC Notes
                                </label>
                                <input
                                  className={styles.formInput}
                                  value={item.qcNotes}
                                  placeholder="Optional inspection notes"
                                  onChange={e => updateItem(item.id, 'qcNotes', e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Rejection Reason */}
                            <div style={{ marginBottom: 16 }}>
                              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                                Rejection Reason <span style={{ color: '#94a3b8', fontWeight: 400 }}>(required only if rejecting)</span>
                              </label>
                              <select
                                className={styles.formSelect}
                                value={item.rejectionReason}
                                onChange={e => updateItem(item.id, 'rejectionReason', e.target.value)}
                              >
                                <option value="">— Select reason if rejecting —</option>
                                {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>

                            {/* Accept / Reject Buttons */}
                            <div style={{ display: 'flex', gap: 10, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                              <button
                                type="button"
                                onClick={() => acceptItem(item.id)}
                                style={{
                                  flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                                  background: '#16a34a', color: 'white', fontWeight: 800, fontSize: 14,
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                }}
                              >
                                <CheckCircle2 size={16} /> Accept — Add to Stock
                              </button>
                              <button
                                type="button"
                                onClick={() => rejectItem(item.id)}
                                style={{
                                  flex: 1, padding: '12px', borderRadius: 12,
                                  border: '2px solid #fca5a5', background: '#fff1f2',
                                  color: '#dc2626', fontWeight: 800, fontSize: 14,
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                }}
                              >
                                <XCircle size={16} /> Reject (Damaged / Return)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── ACCEPTED ITEMS ───────────────────────────────────────── */}
              {acceptedItems.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Accepted — Ready for Stock Ledger</span>
                    <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{acceptedItems.length}</span>
                  </div>
                  {acceptedItems.map(item => (
                    <div
                      key={item.id}
                      style={{
                        background: '#f0fdf4', border: '1.5px solid #86efac',
                        borderRadius: 12, padding: '12px 16px', marginBottom: 8,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#14532d', fontSize: 14 }}>{item.productName}</div>
                        <div style={{ fontSize: 12, color: '#166534', marginTop: 3 }}>
                          <span>Batch: <strong>{item.batchNumber}</strong></span>
                          <span style={{ margin: '0 8px' }}>·</span>
                          <span>Expiry: <strong>{item.expiryDate}</strong></span>
                          <span style={{ margin: '0 8px' }}>·</span>
                          <span style={{ color: '#15803d', fontWeight: 700 }}>{item.receivedQuantity} {item.uom} → Stock ↑</span>
                          {isNearExpiry(item.expiryDate) && <span style={{ marginLeft: 8, color: '#d97706', fontWeight: 700 }}>⚠️ Near Expiry</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <DiscBadge status={item.discrepancyStatus} />
                        <button
                          onClick={() => undecide(item.id)}
                          style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', background: 'white', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          ↩ Undo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── REJECTED ITEMS ───────────────────────────────────────── */}
              {rejectedItems.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <XCircle size={16} color="#dc2626" />
                    <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Rejected — Will go to Purchase Returns</span>
                    <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{rejectedItems.length}</span>
                  </div>
                  {rejectedItems.map(item => (
                    <div
                      key={item.id}
                      style={{
                        background: '#fff1f2', border: '1.5px solid #fca5a5',
                        borderRadius: 12, padding: '12px 16px', marginBottom: 8,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 14 }}>{item.productName}</div>
                        <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 3 }}>
                          Reason: <strong>{item.rejectionReason}</strong>
                          <span style={{ margin: '0 8px' }}>·</span>
                          Qty: {item.receivedQuantity || item.quantityRequired} {item.uom}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>❌ Rejected</span>
                        <button
                          onClick={() => undecide(item.id)}
                          style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', background: 'white', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          ↩ Undo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── CONFIRM GRN BANNER (bottom) ──────────────────────────── */}
              {allDecided && (
                <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 16, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#14532d', fontSize: 15, marginBottom: 4 }}>🎉 All items verified — Ready to confirm GRN</div>
                    <div style={{ fontSize: 13, color: '#166534' }}>
                      <strong>{acceptedItems.length}</strong> item(s) will be added to inventory.
                      {rejectedItems.length > 0 && <> <strong>{rejectedItems.length}</strong> rejected item(s) will be routed to Purchase Returns.</>}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setConfirmModal(true)}
                    disabled={submitting}
                    style={{ gap: 8, fontSize: 15, padding: '12px 24px' }}
                  >
                    <ShieldCheck size={18} />
                    {submitting ? 'Posting to Stock…' : 'Confirm GRN & Update Stock'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══ GRN CONFIRMATION MODAL ══════════════════════════════════════════ */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 20, maxWidth: 540, width: '100%', boxShadow: '0 30px 80px rgba(0,0,0,0.2)', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>🛡️ Confirm GRN Submission</h3>
              <button onClick={() => setConfirmModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>PO: {activePO?.id} — {activePO?.vendorName}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#15803d' }}>{acceptedItems.length}</div>
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>Items → Stock</div>
                </div>
                <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#dc2626' }}>{rejectedItems.length}</div>
                  <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 700 }}>Items → Returns</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20, maxHeight: 200, overflowY: 'auto' }}>
              {acceptedItems.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.productName}</span>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>+{item.receivedQuantity} {item.uom}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#1e40af' }}>
              <Info size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              This action is <strong>irreversible</strong>. Accepted quantities will be posted to the inventory ledger immediately.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmModal(false)} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                Go Back
              </button>
              <button
                onClick={submitGRN}
                disabled={submitting}
                style={{ flex: 2, padding: 12, borderRadius: 12, border: 'none', background: '#16a34a', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <ShieldCheck size={16} />
                {submitting ? 'Posting to Stock…' : 'Yes, Confirm GRN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
