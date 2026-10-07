import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Plus, ChevronRight, CheckCircle2, XCircle, X,
  Trash2, PackagePlus, Search, Filter, Eye, Printer, RefreshCw,
  AlertTriangle, Clock, TrendingUp, DollarSign, Package,
  ChevronDown, ChevronUp, FileText, Truck, BarChart2, ArrowRight,
  Flag, Info
} from 'lucide-react';
import { stockApi } from '../../api/stockApi';
import styles from './Stock.module.css';

/* ─────────────────────────────────────────────────────────────────────────────
   RESEARCH-BACKED COMPONENTS (from ERPNext, Odoo, NetSuite, ProcureDesk):
   1. KPI Cards — Pipeline Value, Overdue, Pending Approval, Monthly Spend
   2. Status Lifecycle Stepper — Visual workflow tracker
   3. Advanced Filter Bar — Text search + Status + Date range filter
   4. Enhanced Data Grid — Sortable, with real-time stock indicators
   5. PO Detail Drawer — Click-to-expand PO details sidebar
   6. Priority Flagging — Critical/Emergency tagging
   7. Create PO Modal — Multi-section form with stock level hints
   8. Toast Notifications
───────────────────────────────────────────────────────────────────────────── */

const PO_STATUSES = ['Draft', 'Pending Approval', 'Sent', 'Partially Received', 'Completed'];
const PRIORITY_OPTIONS = ['Normal', 'High', 'Critical / Emergency'];

const STATUS_META = {
  'Draft':              { color: '#64748b', bg: '#f1f5f9', icon: '📝', step: 0 },
  'Pending Approval':   { color: '#d97706', bg: '#fef9c3', icon: '⏳', step: 1 },
  'Sent':               { color: '#2563eb', bg: '#dbeafe', icon: '📤', step: 2 },
  'Partially Received': { color: '#7c3aed', bg: '#ede9fe', icon: '📦', step: 3 },
  'Completed':          { color: '#16a34a', bg: '#dcfce7', icon: '✅', step: 4 },
  'Cancelled':          { color: '#dc2626', bg: '#fee2e2', icon: '❌', step: -1 },
};

const PRIORITY_META = {
  'Normal':                { color: '#64748b', bg: '#f1f5f9', icon: '🔵' },
  'High':                  { color: '#d97706', bg: '#fef3c7', icon: '🟡' },
  'Critical / Emergency':  { color: '#dc2626', bg: '#fee2e2', icon: '🔴' },
};

const EMPTY_HEADER = {
  vendorName: '', poDate: new Date().toISOString().split('T')[0],
  expectedDeliveryDate: '', notes: '', priority: 'Normal'
};
const EMPTY_ROW = {
  productId: '', productName: '', productSku: '', uom: '',
  packingType: '', quantityRequired: '', unitCost: ''
};

export default function PurchaseOrders() {
  const [pos, setPos]               = useState([]);
  const [catalog, setCatalog]       = useState([]);
  const [stockMap, setStockMap]     = useState({});       // productId → currentStock
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery]   = useState('');
  const [dateFilter, setDateFilter]     = useState('');
  const [sortBy, setSortBy]         = useState('date_desc');
  const [modal, setModal]           = useState(false);
  const [detailPo, setDetailPo]     = useState(null);    // PO shown in detail drawer
  const [header, setHeader]         = useState(EMPTY_HEADER);
  const [lineItems, setLineItems]   = useState([{ ...EMPTY_ROW }]);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Data Loading ─────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const [poData, catData] = await Promise.all([
        stockApi.getPOs(),
        stockApi.getProducts(),
      ]);
      setPos(poData);
      setCatalog(catData);

      // Load current stock for each catalog product (for stock hints in line items)
      const sm = {};
      await Promise.all(catData.map(async p => {
        try { sm[p.id] = (await stockApi.getCurrentStock(p.id)).currentStock; }
        catch { sm[p.id] = 0; }
      }));
      setStockMap(sm);
    } catch { /* offline */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── KPI Metrics ──────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const active = pos.filter(p => !['Completed', 'Cancelled'].includes(p.status));
    const thisMonth = pos.filter(p => {
      if (!p.poDate) return false;
      const d = new Date(p.poDate);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const overdue = pos.filter(p => {
      if (!p.expectedDeliveryDate || ['Completed', 'Cancelled'].includes(p.status)) return false;
      return new Date(p.expectedDeliveryDate) < new Date();
    });
    return {
      drafts:           pos.filter(p => p.status === 'Draft').length,
      pendingApproval:  pos.filter(p => p.status === 'Pending Approval').length,
      awaitingDelivery: pos.filter(p => p.status === 'Sent' || p.status === 'Partially Received').length,
      pipelineValue:    active.reduce((s, p) => s + (p.totalCost || 0), 0),
      monthlySpend:     thisMonth.reduce((s, p) => s + (p.totalCost || 0), 0),
      overdueCount:     overdue.length,
      completedTotal:   pos.filter(p => p.status === 'Completed').length,
    };
  }, [pos]);

  // ── Filtering & Sorting ──────────────────────────────────────────────────
  const visible = useMemo(() => {
    let list = pos.filter(p => {
      const sMatch = statusFilter === 'All' || p.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const qMatch = !q ||
        p.vendorName?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q);
      const dMatch = !dateFilter || (p.poDate || '').startsWith(dateFilter);
      return sMatch && qMatch && dMatch;
    });

    if (sortBy === 'date_desc')  list = [...list].sort((a, b) => (b.poDate || '').localeCompare(a.poDate || ''));
    if (sortBy === 'date_asc')   list = [...list].sort((a, b) => (a.poDate || '').localeCompare(b.poDate || ''));
    if (sortBy === 'value_desc') list = [...list].sort((a, b) => (b.totalCost || 0) - (a.totalCost || 0));
    if (sortBy === 'vendor')     list = [...list].sort((a, b) => (a.vendorName || '').localeCompare(b.vendorName || ''));
    return list;
  }, [pos, statusFilter, searchQuery, dateFilter, sortBy]);

  // ── Line Item Helpers ────────────────────────────────────────────────────
  const addRow    = () => setLineItems(r => [...r, { ...EMPTY_ROW }]);
  const removeRow = idx => setLineItems(r => r.filter((_, i) => i !== idx));

  const pickProduct = (idx, productId) => {
    const prod = catalog.find(p => p.id === productId);
    setLineItems(rows => rows.map((row, i) => i !== idx ? row : {
      ...row, productId,
      productName: prod?.name        || '',
      productSku:  prod?.sku         || '',
      uom:         prod?.uom         || '',
      packingType: prod?.packingType || '',
      unitCost:    prod?.unitPrice   ?? '',
    }));
  };

  const updateRow = (idx, key, val) =>
    setLineItems(rows => rows.map((row, i) => i !== idx ? row : { ...row, [key]: val }));

  const runningTotal = lineItems.reduce(
    (s, r) => s + ((parseFloat(r.unitCost) || 0) * (parseInt(r.quantityRequired) || 0)), 0
  );

  // ── Create PO ────────────────────────────────────────────────────────────
  const create = async e => {
    e.preventDefault();
    if (!header.vendorName?.trim()) { showToast('Vendor name is required.', true); return; }
    const filledItems = lineItems.filter(r => r.productId && r.quantityRequired);
    if (filledItems.length === 0) { showToast('Add at least one product line item.', true); return; }

    setSaving(true);
    try {
      const totalCost = filledItems.reduce(
        (s, r) => s + ((parseFloat(r.unitCost) || 0) * parseInt(r.quantityRequired)), 0
      );
      await stockApi.createPO({
        ...header, status: 'Draft', totalCost,
        items: filledItems.map(r => ({
          ...r,
          quantityRequired: parseInt(r.quantityRequired),
          quantityReceived: 0,
          unitCost: parseFloat(r.unitCost) || 0,
        })),
      });
      setModal(false);
      setHeader(EMPTY_HEADER);
      setLineItems([{ ...EMPTY_ROW }]);
      showToast('✅ Purchase Order created as Draft. Approve to send to vendor.');
      await load();
    } catch (err) { showToast(err.response?.data?.message || err.message, true); }
    finally { setSaving(false); }
  };

  // ── PO Lifecycle Actions ─────────────────────────────────────────────────
  const approve = async id => {
    try {
      const updated = await stockApi.approvePO(id);
      setPos(p => p.map(x => x.id === id ? updated : x));
      if (detailPo?.id === id) setDetailPo(updated);
      showToast('PO approved — awaiting vendor dispatch.');
    } catch (err) { showToast(err.response?.data?.message || err.message, true); }
  };

  const sendToVendor = async id => {
    try {
      const updated = await stockApi.sendPO(id);
      setPos(p => p.map(x => x.id === id ? updated : x));
      if (detailPo?.id === id) setDetailPo(updated);
      showToast('✅ PO sent to vendor — status updated to "Sent". Now awaiting delivery.');
    } catch (err) { showToast(err.response?.data?.message || err.message, true); }
  };

  const cancel = async id => {
    if (!window.confirm('Cancel this Purchase Order? This cannot be undone.')) return;
    try {
      const updated = await stockApi.cancelPO(id);
      setPos(p => p.map(x => x.id === id ? updated : x));
      if (detailPo?.id === id) setDetailPo(null);
      showToast('Purchase Order cancelled.');
    } catch (err) { showToast(err.response?.data?.message || err.message, true); }
  };

  // ── Sub-components ───────────────────────────────────────────────────────
  const StatusBadge = ({ status }) => {
    const m = STATUS_META[status] || STATUS_META['Draft'];
    return (
      <span style={{
        background: m.bg, color: m.color,
        borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
      }}>
        {m.icon} {status}
      </span>
    );
  };

  const PriorityBadge = ({ priority }) => {
    const m = PRIORITY_META[priority] || PRIORITY_META['Normal'];
    return (
      <span style={{
        background: m.bg, color: m.color,
        borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: 3,
      }}>
        {m.icon} {priority}
      </span>
    );
  };

  // Status Stepper — lifecycle visualization
  const StatusStepper = ({ status }) => {
    const currentStep = STATUS_META[status]?.step ?? -1;
    if (currentStep === -1) return (
      <div style={{ padding: '8px 14px', background: '#fee2e2', borderRadius: 8, color: '#dc2626', fontWeight: 700, fontSize: 13 }}>
        ❌ Cancelled
      </div>
    );
    const steps = ['Draft', 'Pending Approval', 'Sent', 'Partially Received', 'Completed'];
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16 }}>
        {steps.map((s, i) => {
          const done = i <= currentStep;
          const active = i === currentStep;
          return (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: done ? '#2563eb' : '#e2e8f0',
                  color: done ? 'white' : '#94a3b8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800,
                  boxShadow: active ? '0 0 0 4px #bfdbfe' : 'none',
                  transition: 'all 0.2s',
                }}>
                  {done && i < currentStep ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: 10, color: done ? '#2563eb' : '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap', maxWidth: 60, textAlign: 'center' }}>
                  {s}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < currentStep ? '#2563eb' : '#e2e8f0', marginBottom: 16, transition: 'all 0.2s' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const isOverdue = po =>
    po.expectedDeliveryDate &&
    !['Completed', 'Cancelled'].includes(po.status) &&
    new Date(po.expectedDeliveryDate) < new Date();

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.page} style={{ position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.err ? '#dc2626' : '#16a34a', color: 'white',
          padding: '14px 22px', borderRadius: 14, display: 'flex',
          alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14,
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)', maxWidth: 420,
        }}>
          {toast.err ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
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
            <span style={{ color: '#0f172a', fontWeight: 700 }}>Purchase Orders</span>
          </div>
          <h1 className={styles.pageTitle}>
            <ShoppingCart size={26} color="#2563eb" />
            Purchase Orders
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginLeft: 8 }}>
              ({pos.length} total)
            </span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={load}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}
            title="Refresh"
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { setHeader(EMPTY_HEADER); setLineItems([{ ...EMPTY_ROW }]); setModal(true); }}
            style={{ gap: 6 }}
          >
            <Plus size={16} /> Create PO
          </button>
        </div>
      </div>

      {/* ══ 2. KPI METRIC CARDS ════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 22 }}>

        <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe', cursor: 'pointer' }} onClick={() => setStatusFilter('Draft')}>
          <div style={{ fontSize: 28 }}>📝</div>
          <div>
            <div className={styles.statLabel} style={{ color: '#3b82f6' }}>Drafts</div>
            <div className={styles.statValue} style={{ color: '#1d4ed8' }}>{metrics.drafts}</div>
            <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 2 }}>Click to filter</div>
          </div>
        </div>

        <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a', cursor: 'pointer' }} onClick={() => setStatusFilter('Pending Approval')}>
          <div style={{ fontSize: 28 }}>⏳</div>
          <div>
            <div className={styles.statLabel} style={{ color: '#d97706' }}>Pending Approval</div>
            <div className={styles.statValue} style={{ color: '#b45309' }}>{metrics.pendingApproval}</div>
            {metrics.pendingApproval > 0 && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 2 }}>Action needed</div>}
          </div>
        </div>

        <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac', cursor: 'pointer' }} onClick={() => setStatusFilter('Sent')}>
          <div style={{ fontSize: 28 }}>🚚</div>
          <div>
            <div className={styles.statLabel} style={{ color: '#16a34a' }}>Awaiting Delivery</div>
            <div className={styles.statValue} style={{ color: '#15803d' }}>{metrics.awaitingDelivery}</div>
          </div>
        </div>

        <div className={styles.statCard} style={{ background: metrics.overdueCount > 0 ? 'linear-gradient(135deg, #fff1f2, #ffe4e6)' : 'white', border: metrics.overdueCount > 0 ? '1px solid #fca5a5' : '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 28 }}>⚠️</div>
          <div>
            <div className={styles.statLabel} style={{ color: metrics.overdueCount > 0 ? '#dc2626' : '#64748b' }}>Overdue Deliveries</div>
            <div className={styles.statValue} style={{ color: metrics.overdueCount > 0 ? '#dc2626' : '#0f172a' }}>{metrics.overdueCount}</div>
            {metrics.overdueCount > 0 && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>Past due date</div>}
          </div>
        </div>

        <div className={styles.statCard} style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1px solid #c4b5fd' }}>
          <div style={{ fontSize: 28 }}>💰</div>
          <div>
            <div className={styles.statLabel} style={{ color: '#7c3aed' }}>Pipeline Value</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#6d28d9', lineHeight: 1 }}>
              ₹ {metrics.pipelineValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: 11, color: '#a78bfa', marginTop: 2 }}>Active orders</div>
          </div>
        </div>

        <div className={styles.statCard} style={{ background: 'white' }}>
          <div style={{ fontSize: 28 }}>📅</div>
          <div>
            <div className={styles.statLabel}>This Month Spend</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              ₹ {metrics.monthlySpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{metrics.completedTotal} completed</div>
          </div>
        </div>

      </div>

      {/* Overdue Alert Banner */}
      {metrics.overdueCount > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} color="#dc2626" />
          <span style={{ fontWeight: 700, color: '#dc2626', fontSize: 14 }}>
            {metrics.overdueCount} purchase order(s) have passed their expected delivery date. Please follow up with suppliers.
          </span>
        </div>
      )}

      {/* ══ 3. FILTER & SEARCH BAR ════════════════════════════════════════ */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search vendor, PO number, notes..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#475569', background: 'white', cursor: 'pointer', minWidth: 160 }}
        >
          <option value="All">All Statuses</option>
          {PO_STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s]?.icon} {s}</option>)}
          <option value="Cancelled">❌ Cancelled</option>
        </select>

        {/* Date Filter */}
        <input
          type="month"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, color: '#475569', background: 'white', cursor: 'pointer' }}
          title="Filter by month"
        />

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#475569', background: 'white', cursor: 'pointer' }}
        >
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="value_desc">Highest Value</option>
          <option value="vendor">Vendor A–Z</option>
        </select>

        {/* Clear Filters */}
        {(searchQuery || statusFilter !== 'All' || dateFilter) && (
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('All'); setDateFilter(''); }}
            style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #fca5a5', color: '#dc2626', background: '#fff1f2', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            ✕ Clear
          </button>
        )}

        <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 'auto' }}>
          Showing <strong>{visible.length}</strong> of {pos.length} orders
        </span>
      </div>

      {/* ══ 4. DATA GRID / TABLE ════════════════════════════════════════════ */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
          Loading purchase orders…
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Vendor / Supplier</th>
                <th>Priority</th>
                <th>PO Date</th>
                <th>Expected Delivery</th>
                <th>Items</th>
                <th>Total Value</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                    <ShoppingCart size={40} style={{ display: 'block', margin: '0 auto 12px', color: '#cbd5e1' }} />
                    No purchase orders found.{' '}
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal(true)}>+ Create your first PO</button>
                  </td>
                </tr>
              ) : visible.map(po => {
                const overdue = isOverdue(po);
                const priorityMeta = PRIORITY_META[po.priority] || PRIORITY_META['Normal'];
                return (
                  <tr
                    key={po.id}
                    style={{
                      background: overdue ? '#fffbeb' : 'white',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onClick={() => setDetailPo(po)}
                    onMouseEnter={e => e.currentTarget.style.background = overdue ? '#fef3c7' : '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = overdue ? '#fffbeb' : 'white'}
                  >
                    <td>
                      <span style={{ color: '#2563eb', fontWeight: 800, fontFamily: 'monospace', fontSize: 13 }}>
                        {po.id}
                      </span>
                      {overdue && (
                        <span style={{ display: 'block', fontSize: 10, color: '#dc2626', fontWeight: 700, marginTop: 2 }}>
                          ⚠️ OVERDUE
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{po.vendorName || '—'}</div>
                      {po.notes && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{po.notes}</div>}
                    </td>
                    <td>
                      <PriorityBadge priority={po.priority || 'Normal'} />
                    </td>
                    <td style={{ color: '#475569', fontSize: 13 }}>{po.poDate || '—'}</td>
                    <td>
                      <span style={{ color: overdue ? '#dc2626' : '#475569', fontWeight: overdue ? 700 : 400, fontSize: 13 }}>
                        {po.expectedDeliveryDate || '—'}
                        {overdue && ' 🔴'}
                      </span>
                    </td>
                    <td>
                      <span style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                        {(po.items || []).length} item{(po.items || []).length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
                        ₹ {po.totalCost ? po.totalCost.toLocaleString('en-IN') : '—'}
                      </span>
                    </td>
                    <td><StatusBadge status={po.status} /></td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setDetailPo(po)}
                          style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#475569' }}
                        >
                          <Eye size={12} /> View
                        </button>
                        {po.status === 'Draft' && (
                          <button
                            onClick={() => approve(po.id)}
                            style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #86efac', background: '#f0fdf4', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#16a34a' }}
                          >
                            <CheckCircle2 size={12} /> Approve
                          </button>
                        )}
                        {po.status === 'Pending Approval' && (
                          <button
                            onClick={() => sendToVendor(po.id)}
                            style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #93c5fd', background: '#eff6ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#2563eb' }}
                          >
                            <ArrowRight size={12} /> Send to Vendor
                          </button>
                        )}
                        {!['Completed', 'Cancelled'].includes(po.status) && (
                          <button
                            onClick={() => cancel(po.id)}
                            style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #fca5a5', background: '#fff1f2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#dc2626' }}
                          >
                            <XCircle size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ 5. PO DETAIL DRAWER ═════════════════════════════════════════════ */}
      {detailPo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(2px)' }}
            onClick={() => setDetailPo(null)}
          />
          {/* Drawer */}
          <div style={{
            position: 'relative', width: 580, maxWidth: '95vw', height: '100%',
            background: 'white', overflowY: 'auto', padding: 28,
            boxShadow: '-20px 0 60px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Purchase Order Details</div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{detailPo.id}</h2>
                <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <StatusBadge status={detailPo.status} />
                  <PriorityBadge priority={detailPo.priority || 'Normal'} />
                  {isOverdue(detailPo) && (
                    <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                      ⚠️ OVERDUE
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setDetailPo(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Status Stepper */}
            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '16px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>Order Progress</div>
              <StatusStepper status={detailPo.status} />
            </div>

            {/* Vendor & Dates Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Vendor / Supplier', value: detailPo.vendorName, icon: '🏭' },
                { label: 'PO Date', value: detailPo.poDate || '—', icon: '📅' },
                { label: 'Expected Delivery', value: detailPo.expectedDeliveryDate || '—', icon: '🚚' },
                { label: 'Total Value', value: `₹ ${(detailPo.totalCost || 0).toLocaleString('en-IN')}`, icon: '💰' },
              ].map(item => (
                <div key={item.label} style={{ background: '#f8fafc', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>{item.icon} {item.label}</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {detailPo.notes && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700, marginBottom: 4 }}>📝 Notes</div>
                <div style={{ color: '#78350f', fontSize: 14 }}>{detailPo.notes}</div>
              </div>
            )}

            {/* Line Items Table */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
                📦 Line Items ({(detailPo.items || []).length})
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>Product</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>Qty</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>Unit ₹</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailPo.items || []).map((item, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.productName}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{item.productSku}</div>
                          <div style={{ fontSize: 11, color: '#60a5fa' }}>{item.uom}</div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>
                          {item.quantityRequired}
                          {item.quantityReceived > 0 && (
                            <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>
                              ✓ {item.quantityReceived} received
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>
                          ₹ {(item.unitCost || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          ₹ {((item.unitCost || 0) * (item.quantityRequired || 0)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                      <td colSpan={3} style={{ padding: '12px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Grand Total</td>
                      <td style={{ padding: '12px', fontWeight: 800, fontSize: 16, color: '#0f172a', textAlign: 'right' }}>
                        ₹ {(detailPo.totalCost || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              {detailPo.status === 'Draft' && (
                <button
                  onClick={() => approve(detailPo.id)}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#16a34a', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <CheckCircle2 size={16} /> Approve PO
                </button>
              )}
              {detailPo.status === 'Pending Approval' && (
                <button
                  onClick={() => sendToVendor(detailPo.id)}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <ArrowRight size={16} /> Send to Vendor
                </button>
              )}
              {!['Completed', 'Cancelled'].includes(detailPo.status) && (
                <button
                  onClick={() => cancel(detailPo.id)}
                  style={{ padding: '12px 20px', borderRadius: 12, border: '2px solid #fca5a5', background: '#fff1f2', color: '#dc2626', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <XCircle size={16} /> Cancel
                </button>
              )}
              <button
                onClick={() => setDetailPo(null)}
                style={{ padding: '12px 20px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ 6. CREATE PO MODAL ══════════════════════════════════════════════ */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 860, boxShadow: '0 30px 80px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ padding: '22px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>🛒 Create Purchase Order</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>New POs are saved as <strong>Draft</strong> — approve to send to vendor</p>
              </div>
              <button onClick={() => setModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={create} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Section 1: Vendor & Delivery */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🏭 Vendor & Delivery Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Vendor / Supplier Name *</label>
                    <input
                      className={styles.formInput}
                      value={header.vendorName}
                      onChange={e => setHeader(h => ({ ...h, vendorName: e.target.value }))}
                      placeholder="e.g. Sun Pharma Distributors"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Priority / Urgency</label>
                    <select
                      className={styles.formSelect}
                      value={header.priority}
                      onChange={e => setHeader(h => ({ ...h, priority: e.target.value }))}
                    >
                      {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITY_META[p]?.icon} {p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>PO Date</label>
                    <input
                      type="date"
                      className={styles.formInput}
                      value={header.poDate}
                      onChange={e => setHeader(h => ({ ...h, poDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Expected Delivery Date</label>
                    <input
                      type="date"
                      className={styles.formInput}
                      value={header.expectedDeliveryDate}
                      onChange={e => setHeader(h => ({ ...h, expectedDeliveryDate: e.target.value }))}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Notes / Special Instructions</label>
                    <input
                      className={styles.formInput}
                      value={header.notes}
                      onChange={e => setHeader(h => ({ ...h, notes: e.target.value }))}
                      placeholder="e.g. Urgent delivery required — cold chain maintained"
                    />
                  </div>
                </div>

                {/* Priority warning */}
                {header.priority === 'Critical / Emergency' && (
                  <div style={{ marginTop: 14, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Flag size={14} color="#dc2626" />
                    <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 700 }}>
                      Critical PO — This order will be flagged for urgent processing and immediate supervisor notification.
                    </span>
                  </div>
                )}
              </div>

              {/* Section 2: Product Line Items */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    📦 Product Line Items
                  </div>
                  <button type="button" onClick={addRow} style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Plus size={13} /> Add Row
                  </button>
                </div>

                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 32px', gap: 8, padding: '6px 4px', marginBottom: 4 }}>
                  {['Product (Select from Catalog)', 'Qty', 'Unit Price ₹', 'Line Total', ''].map(h => (
                    <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {lineItems.map((row, idx) => {
                    const currentStock = stockMap[row.productId];
                    const isLowStock = typeof currentStock === 'number' && currentStock < 20;
                    return (
                      <div key={idx}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 32px', gap: 8, alignItems: 'start' }}>
                          {/* Product Select */}
                          <div>
                            <select
                              className={styles.formSelect}
                              value={row.productId}
                              onChange={e => pickProduct(idx, e.target.value)}
                            >
                              <option value="">— Select product —</option>
                              {catalog.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name}{p.genericName ? ` (${p.genericName})` : ''} — {p.uom}
                                </option>
                              ))}
                            </select>
                            {row.uom && (
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                                📏 {row.uom}
                                {typeof currentStock === 'number' && (
                                  <span style={{ marginLeft: 8, color: isLowStock ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                                    {isLowStock ? '⚠️' : '✓'} Stock: {currentStock}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Qty */}
                          <div>
                            <input
                              type="number" min="1"
                              className={styles.formInput}
                              placeholder="Qty"
                              value={row.quantityRequired}
                              onChange={e => updateRow(idx, 'quantityRequired', e.target.value)}
                            />
                          </div>

                          {/* Unit Cost */}
                          <input
                            type="number"
                            className={styles.formInput}
                            placeholder="₹"
                            value={row.unitCost}
                            onChange={e => updateRow(idx, 'unitCost', e.target.value)}
                          />

                          {/* Line Total */}
                          <div style={{ display: 'flex', alignItems: 'center', height: 40, fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                            ₹ {((parseFloat(row.unitCost) || 0) * (parseInt(row.quantityRequired) || 0)).toLocaleString('en-IN')}
                          </div>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            style={{ height: 40, border: '1.5px solid #fca5a5', background: '#fff1f2', color: '#dc2626', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Low stock warning */}
                        {isLowStock && row.productId && (
                          <div style={{ marginTop: 4, fontSize: 11, color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={11} /> Low current stock ({currentStock}). Replenishment recommended.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Grand Total */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, paddingTop: 14, borderTop: '2px solid #e2e8f0', gap: 12, alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: 14 }}>Purchase Order Total:</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>
                    ₹ {runningTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Info Banner */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Info size={16} color="#2563eb" />
                <span style={{ fontSize: 13, color: '#1d4ed8' }}>
                  PO will be saved as <strong>Draft</strong>. After review, approve it to send to the vendor. On delivery, log it under <strong>Goods Receipt</strong>.
                </span>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <button type="button" onClick={() => setModal(false)} style={{ padding: '12px 24px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: saving ? '#94a3b8' : '#2563eb', color: 'white', fontWeight: 800, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {saving ? (
                    <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</>
                  ) : (
                    <><ShoppingCart size={15} /> Create Purchase Order</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
