import React, { useState, useMemo } from 'react';
import {
  Receipt, Search, Eye, X, CheckCircle2, CreditCard, Calendar,
  User, Stethoscope, Clock, Filter, ChevronDown, Pill,
  BedDouble, AlertCircle, TrendingUp, IndianRupee, Activity,
  FileText, Tag, ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

// Bill source type metadata
const BILL_TYPES = {
  consultation: { label: 'Consultation', color: '#1d4ed8', bg: '#eff6ff', icon: <Stethoscope size={11} /> },
  pharmacy:     { label: 'Pharmacy',     color: '#7c3aed', bg: '#f5f3ff', icon: <Pill size={11} /> },
  ip_room:      { label: 'IP / Room',    color: '#0891b2', bg: '#ecfeff', icon: <BedDouble size={11} /> },
};

const STATUS_COLORS = {
  Pending:             { bg: '#fef3c7', color: '#b45309', dot: '#f59e0b' },
  Paid:                { bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
  'Returned & Refunded': { bg: '#fee2e2', color: '#dc2626', dot: '#f87171' },
  'Sent to Billing':   { bg: '#ede9fe', color: '#7c3aed', dot: '#a78bfa' },
  Dispensed:           { bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
};

const PAYMENT_METHODS = [
  { value: 'UPI / GPay',  label: '📱 UPI / Google Pay / PhonePe' },
  { value: 'Cash',        label: '💵 Cash' },
  { value: 'Credit Card', label: '💳 Credit / Debit Card' },
  { value: 'Net Banking', label: '🏦 Net Banking' },
  { value: 'Insurance',   label: '🏥 Insurance / TPA' },
];

// ── Bill Detail Modal ─────────────────────────────────────────────────────────
function BillDetailModal({ bill, onClose, onCollect }) {
  const typeInfo = BILL_TYPES[bill.sourceType] || BILL_TYPES.consultation;
  const isPaid = bill.payStatus === 'Paid' || bill.payStatus === 'Dispensed';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', width: '100%', maxWidth: 580, borderRadius: 20,
        boxShadow: '0 30px 60px rgba(0,0,0,0.25)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ background: typeInfo.bg, color: typeInfo.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                {typeInfo.icon} {typeInfo.label}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>#{bill.billNo}</span>
            </div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{bill.patientName}</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 3 }}>
              {bill.patientId}
              {bill.gender && bill.gender !== '—' ? ` · ${bill.gender}` : ''}
              {calcAge(bill.dob) ? `, ${calcAge(bill.dob)} yrs` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Service / Appointment Info */}
          <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
              {bill.sourceType === 'consultation' ? 'Appointment Details' : bill.sourceType === 'ip_room' ? 'Admission Details' : 'Prescription Details'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {bill.detailRows.map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ color: '#94a3b8', marginTop: 2 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 600 }}>{value || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Charges Breakdown
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>Item / Service</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', borderRadius: '0 6px 6px 0' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.lineItems.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13.5, color: '#1e293b', fontWeight: 500 }}>{item.label}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, color: '#64748b' }}>{item.qty || 1}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                      ₹ {Number(item.amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', padding: '12px 16px', marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Subtotal</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>₹ {Number(bill.subtotal || bill.totalAmount).toLocaleString('en-IN')}</span>
              </div>
              {bill.gst > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>GST / Tax</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>+ ₹ {Number(bill.gst).toLocaleString('en-IN')}</span>
                </div>
              )}
              {bill.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#10b981' }}>Discount</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>- ₹ {Number(bill.discount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px dashed #e2e8f0', marginTop: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Total {isPaid ? 'Paid' : 'Due'}</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: isPaid ? '#15803d' : '#1d4ed8' }}>
                  ₹ {Number(bill.totalAmount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {bill.notes && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#92400e' }}>
              <strong>Note:</strong> {bill.notes}
            </div>
          )}

          {/* Return reason */}
          {bill.returnReason && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
              <strong>Return Reason:</strong> {bill.returnReason}
            </div>
          )}

          {/* Actions */}
          {isPaid ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#dcfce7', borderRadius: 10 }}>
              <CheckCircle2 size={18} color="#16a34a" />
              <div>
                <div style={{ fontWeight: 700, color: '#15803d', fontSize: 14 }}>Payment Received</div>
                {bill.paymentMethod && <div style={{ fontSize: 12, color: '#16a34a' }}>via {bill.paymentMethod}</div>}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '10px 18px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13.5 }}>
                Close
              </button>
              <button
                onClick={() => { onCollect(bill); onClose(); }}
                style={{ padding: '10px 20px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <CreditCard size={15} /> Collect Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Collect Payment Modal ─────────────────────────────────────────────────────
function CollectPaymentModal({ bill, onClose, onConfirm }) {
  const [method, setMethod] = useState('Cash');
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 500));
    onConfirm(bill.billNo, method);
    setProcessing(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 440, borderRadius: 20, boxShadow: '0 25px 50px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>Collect Payment</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {/* Summary */}
          <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Patient</span>
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{bill.patientName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Bill Type</span>
              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{BILL_TYPES[bill.sourceType]?.label || bill.sourceType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Bill No.</span>
              <span style={{ fontWeight: 600, color: '#1d4ed8', fontSize: 13 }}>{bill.billNo}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #bfdbfe', marginTop: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Amount Due</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8' }}>₹ {Number(bill.totalAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment method */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Payment Method</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PAYMENT_METHODS.map(pm => (
                <label key={pm.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${method === pm.value ? '#1d4ed8' : '#e2e8f0'}`, background: method === pm.value ? '#eff6ff' : '#fff', transition: 'all 0.15s' }}>
                  <input type="radio" name="method" value={pm.value} checked={method === pm.value} onChange={() => setMethod(pm.value)} style={{ accentColor: '#1d4ed8' }} />
                  <span style={{ fontSize: 13.5, fontWeight: method === pm.value ? 700 : 500, color: method === pm.value ? '#1d4ed8' : '#334155' }}>{pm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '10px 18px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13.5 }}>Cancel</button>
            <button onClick={handleConfirm} disabled={processing} style={{ padding: '10px 24px', border: 'none', background: processing ? '#6ee7b7' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', borderRadius: 10, fontWeight: 700, cursor: processing ? 'wait' : 'pointer', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={15} />
              {processing ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Type Badge ────────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const t = BILL_TYPES[type] || { label: type, color: '#64748b', bg: '#f1f5f9', icon: <FileText size={11} /> };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: t.bg, color: t.color, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {t.icon} {t.label}
    </span>
  );
}

// ── Main Unified Billing Component ────────────────────────────────────────────
export default function UnifiedBilling() {
  const {
    appointments, doctors, patients,
    pharmacyBills,
    ipPatients,
    pastConsultations,
    unifiedBills,
    processUnifiedPayment,
  } = useApp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewBill, setViewBill] = useState(null);
  const [collectBill, setCollectBill] = useState(null);
  const [toast, setToast] = useState(null);
  // Track locally-paid bills (billNo → paymentMethod)
  const [localPaid, setLocalPaid] = useState({});

  // ── Build Unified Billing Records ──────────────────────────────────────────
  const allBills = useMemo(() => {
    // Build quick lookup: billNo → backend record (has definitive Paid status)
    const backendMap = {};
    (unifiedBills || []).forEach(ub => {
      if (ub.sourceId) backendMap[ub.sourceId] = ub;
      if (ub.billNo)   backendMap[ub.billNo]   = ub;
    });

    const records = [];
    const processedConsultationKeys = new Set();

    // ── 1. CONSULTATIONS FROM EMR (Doctor Consultations) ─────────────────────
    (pastConsultations || []).forEach(c => {
      if (!c.id) return;
      const billNo = c.id.startsWith('CONS-') ? c.id : `CONS-${c.id}`;
      processedConsultationKeys.add(c.id);
      if (c.token) processedConsultationKeys.add(c.token);

      const patient = (patients || []).find(p => p.id === c.patientId);
      const doctor = (doctors || []).find(d => 
        (d.id && d.id === c.doctorId) || 
        (d.name && c.doctorName && d.name.toLowerCase().includes(c.doctorName.toLowerCase().replace('dr.', '').trim()))
      );
      const consultFee = doctor?.fee ? Number(doctor.fee) : doctor?.consultationFee ? Number(doctor.consultationFee) : 500;
      const backendBill = backendMap[billNo];
      const isPaid = !!localPaid[billNo] || backendBill?.status === 'Paid' || backendBill?.payStatus === 'Paid';

      let subtotal = consultFee;
      const lineItems = [
        { label: `Consultation Fee — ${c.doctorName || (doctor ? `Dr. ${doctor.name}` : 'Doctor')}`, qty: 1, amount: consultFee }
      ];

      // Laboratory orders
      if (Array.isArray(c.labTests)) {
        c.labTests.forEach(test => {
          if (test) {
            subtotal += 350;
            lineItems.push({ label: `Laboratory Investigation: ${test}`, qty: 1, amount: 350 });
          }
        });
      }

      records.push({
        billNo,
        sourceType: 'consultation',
        patientId: c.patientId || '',
        patientName: c.patientName || patient?.fullName || 'Unknown',
        gender: patient?.gender || '—',
        dob: patient?.dob || null,
        phone: patient?.phone || '—',
        date: c.date || (c.createdAt ? String(c.createdAt).split(' ')[0] : ''),
        totalAmount: subtotal,
        subtotal,
        gst: 0,
        discount: 0,
        payStatus: isPaid ? 'Paid' : 'Pending',
        paymentMethod: localPaid[billNo] || backendBill?.paymentMethod || null,
        returnReason: null,
        notes: c.diagnosis || '',
        detailRows: [
          { icon: <Stethoscope size={13} />, label: 'Doctor', value: c.doctorName || (doctor ? `Dr. ${doctor.name}` : '—') },
          { icon: <Activity size={13} />, label: 'Department', value: c.department || doctor?.department || 'General' },
          { icon: <Calendar size={13} />, label: 'Date', value: c.date || c.createdAt },
          { icon: <FileText size={13} />, label: 'Diagnosis', value: c.diagnosis || 'Clinical Follow-up' },
        ],
        lineItems,
        serviceLabel: c.doctorName || (doctor ? `Dr. ${doctor.name}` : 'Consultation'),
        serviceSubLabel: c.diagnosis ? `Dx: ${c.diagnosis}` : (c.department || 'General OPD'),
      });
    });

    // ── 2. APPOINTMENT-BASED CONSULTATION BILLS ──────────────────────────────
    (appointments || []).forEach(apt => {
      if (processedConsultationKeys.has(apt.id) || (apt.token && processedConsultationKeys.has(apt.token))) {
        return; // Already accounted for in EMR consultations
      }

      const doctor = (doctors || []).find(d => d.id === apt.doctorId);
      const patient = (patients || []).find(p => p.id === apt.patientId);
      const consultFee = doctor?.fee ? Number(doctor.fee) : doctor?.consultationFee ? Number(doctor.consultationFee) : 500;
      const billNo = `CONS-${apt.id}`;
      const backendBill = backendMap[billNo];
      const isPaid = !!localPaid[billNo] || apt.billingStatus === 'Paid' || backendBill?.status === 'Paid';

      records.push({
        billNo,
        sourceType: 'consultation',
        patientId: apt.patientId || '',
        patientName: apt.patientName || patient?.fullName || 'Unknown',
        gender: patient?.gender || '—',
        dob: patient?.dob || null,
        phone: patient?.phone || '—',
        date: apt.date || '',
        totalAmount: consultFee,
        subtotal: consultFee,
        gst: 0,
        discount: 0,
        payStatus: isPaid ? 'Paid' : (apt.billingStatus || 'Pending'),
        paymentMethod: localPaid[billNo] || apt.paymentMethod || null,
        returnReason: null,
        notes: apt.reason || '',
        detailRows: [
          { icon: <Stethoscope size={13} />, label: 'Doctor', value: apt.doctorName || (doctor ? `Dr. ${doctor.name}` : '—') },
          { icon: <Activity size={13} />, label: 'Department', value: apt.department || doctor?.department || '—' },
          { icon: <Calendar size={13} />, label: 'Date', value: apt.date },
          { icon: <Clock size={13} />, label: 'Time Slot', value: apt.timeSlot || '—' },
        ],
        lineItems: [
          { label: `Consultation Fee — ${apt.doctorName || (doctor ? `Dr. ${doctor.name}` : 'Doctor')}`, qty: 1, amount: consultFee },
        ],
        serviceLabel: apt.doctorName || (doctor ? `Dr. ${doctor.name}` : '—'),
        serviceSubLabel: apt.department || doctor?.department || '',
      });
    });

    // ── 3. PHARMACY OUTPATIENT BILLS ─────────────────────────────────────────
    (pharmacyBills || []).forEach(bill => {
      const billNo = `PHARM-${bill.id}`;
      const patient = (patients || []).find(p => p.id === bill.patientId);
      const backendBill = backendMap[billNo];
      const isPaid = !!localPaid[billNo] || bill.status === 'Paid' || backendBill?.status === 'Paid';
      const rawStatus = isPaid ? 'Paid' : (bill.status || 'Pending');

      records.push({
        billNo,
        sourceType: 'pharmacy',
        patientId: bill.patientId || '',
        patientName: bill.patientName || patient?.fullName || 'Unknown',
        gender: patient?.gender || '—',
        dob: patient?.dob || null,
        phone: patient?.phone || '—',
        date: bill.date || '',
        totalAmount: bill.total || bill.totalAmount || 0,
        subtotal: bill.subtotal || bill.total || 0,
        gst: bill.gst || 0,
        discount: bill.discount || 0,
        payStatus: rawStatus,
        paymentMethod: localPaid[billNo] || backendBill?.paymentMethod || bill.paymentMethod || null,
        returnReason: bill.returnReason || null,
        notes: null,
        detailRows: [
          { icon: <Pill size={13} />, label: 'Rx / Invoice ID', value: bill.id },
          { icon: <User size={13} />, label: 'Items', value: `${bill.itemsCount || bill.items?.length || '—'} item(s)` },
          { icon: <Calendar size={13} />, label: 'Date', value: bill.date },
          { icon: <Tag size={13} />, label: 'Status', value: rawStatus },
        ],
        lineItems: (bill.items || []).map(it => ({
          label: it.name,
          qty: it.qty || 1,
          amount: (it.price || 0) * (it.qty || 1),
        })),
        serviceLabel: `${bill.itemsCount || bill.items?.length || '—'} medicine(s)`,
        serviceSubLabel: bill.id,
      });
    });

    // ── 4. ADMITTED / IP PATIENT BILLS (Room, Nursing, Doctor Rounds, Medicines) ──
    (ipPatients || []).forEach(ip => {
      const isAdmitted = (ip.allocatedRoomId || ip.allocatedRoomNo || ip.status === 'Admitted' || ip.status === 'Occupied' || ip.status === 'Active' || ip.ward);
      if (!isAdmitted) return;

      const billNo = `IPRM-${ip.id}`;
      const patient = (patients || []).find(p => p.id === ip.patientId);
      const priceStr = ip.allocatedRoomPrice || '';
      let tariff = Number((priceStr).replace(/[₹,\s]/g, '').split('/')[0]) || 0;
      if (!tariff) {
        const rType = (ip.allocatedRoomType || ip.bedType || '').toLowerCase();
        if (rType.includes('icu')) tariff = 8000;
        else if (rType.includes('private') || rType.includes('suite')) tariff = 5000;
        else if (rType.includes('semi')) tariff = 2500;
        else tariff = 1200;
      }

      const admDate = ip.admissionDate ? ip.admissionDate.split(',')[0].trim() : null;
      const today = new Date().toISOString().split('T')[0];
      let days = 1;
      if (admDate) {
        const d1 = new Date(admDate);
        const d2 = new Date(today);
        if (!isNaN(d1.getTime())) {
          days = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
        }
      }

      const roomTotal = tariff * days;
      const nursingRate = 500;
      const nursingTotal = nursingRate * days;
      const roundRate = 600;
      const roundTotal = roundRate * days;

      const lineItems = [
        { label: `Room & Bed Rent: ${ip.allocatedRoomNo || 'Ward Bed'} (${ip.allocatedRoomType || 'General'}) × ${days} days`, qty: days, amount: roomTotal },
        { label: `Inpatient Nursing & Vital Monitoring (${days} days @ ₹500/day)`, qty: days, amount: nursingTotal },
        { label: `Attending Doctor Daily Rounds — ${ip.doctorName || ip.admittingDoctor || 'Physician'} (${days} visits @ ₹600/day)`, qty: days, amount: roundTotal },
      ];

      // Medicines during admission
      let medTotal = 0;
      let hadSpecificMeds = false;

      // 1. Check pharmacy bills for this patient
      const ptPharmBills = (pharmacyBills || []).filter(pb => pb.patientId && pb.patientId === ip.patientId);
      ptPharmBills.forEach(pb => {
        const bTot = Number(pb.total || pb.totalAmount || 0);
        if (bTot > 0) {
          medTotal += bTot;
          hadSpecificMeds = true;
          lineItems.push({
            label: `Inpatient Pharmacy Dispensation (#${pb.id}) — ${pb.itemsCount || pb.items?.length || 1} Meds`,
            qty: pb.itemsCount || 1,
            amount: bTot,
          });
        }
      });

      // 2. Check prescribed medicines from consultations
      const ptConsults = (pastConsultations || []).filter(c => c.patientId && c.patientId === ip.patientId);
      ptConsults.forEach(c => {
        if (Array.isArray(c.prescriptions)) {
          c.prescriptions.forEach(rx => {
            if (rx?.medicine) {
              const medPrice = 140;
              medTotal += medPrice;
              hadSpecificMeds = true;
              lineItems.push({
                label: `Administered Medicine: ${rx.medicine} (${rx.dosage || '1 Tab'})`,
                qty: 1,
                amount: medPrice,
              });
            }
          });
        }
      });

      // 3. Fallback standard routine inpatient medicines & IV package
      if (!hadSpecificMeds) {
        const packageCost = 850 * days;
        medTotal += packageCost;
        lineItems.push({
          label: `Inpatient Medications & IV Infusions (${days} days @ ₹850/day)`,
          qty: days,
          amount: packageCost,
        });
      }

      const subtotal = roomTotal + nursingTotal + roundTotal + medTotal;
      const gst = Math.round(medTotal * 0.05 * 100) / 100;
      const totalAmount = subtotal + gst;

      const backendBill = backendMap[billNo];
      const isPaid = !!localPaid[billNo] || ip.dischargeStatus === 'Paid' || ip.billingStatus === 'Paid' || backendBill?.status === 'Paid';

      records.push({
        billNo,
        sourceType: 'ip_room',
        patientId: ip.patientId || '',
        patientName: ip.patientName || patient?.fullName || 'Unknown',
        gender: patient?.gender || ip.gender || '—',
        dob: patient?.dob || null,
        phone: patient?.phone || '—',
        date: ip.admissionDate || '',
        totalAmount,
        subtotal,
        gst,
        discount: 0,
        payStatus: isPaid ? 'Paid' : (ip.billingStatus || 'Pending'),
        paymentMethod: localPaid[billNo] || backendBill?.paymentMethod || null,
        returnReason: null,
        notes: ip.admittingDiagnosis || (ip.allocatedRoomType ? `Room type: ${ip.allocatedRoomType}` : ''),
        detailRows: [
          { icon: <BedDouble size={13} />, label: 'Room / Bed', value: `${ip.allocatedRoomNo || 'Ward Bed'} (${ip.allocatedRoomType || 'General'})` },
          { icon: <Stethoscope size={13} />, label: 'Admitting Doctor', value: ip.admittingDoctor || ip.doctorName || '—' },
          { icon: <Calendar size={13} />, label: 'Admission Date', value: ip.admissionDate || '—' },
          { icon: <Clock size={13} />, label: 'Duration & Tariff', value: `${days} day(s) stay | ₹${tariff.toLocaleString('en-IN')}/day` },
        ],
        lineItems,
        serviceLabel: `${ip.allocatedRoomNo || 'Ward Bed'} · Stay & Care`,
        serviceSubLabel: `${days} day(s) · Room + Meds + Care`,
      });
    });

    return records;
  }, [appointments, doctors, patients, pharmacyBills, ipPatients, pastConsultations, localPaid, unifiedBills]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: allBills.length,
    pending: allBills.filter(b => b.payStatus === 'Pending').length,
    pendingAmt: allBills.filter(b => b.payStatus === 'Pending').reduce((s, b) => s + b.totalAmount, 0),
    collected: allBills.filter(b => b.payStatus === 'Paid' || b.payStatus === 'Dispensed').reduce((s, b) => s + b.totalAmount, 0),
    byType: {
      consultation: allBills.filter(b => b.sourceType === 'consultation').length,
      pharmacy:     allBills.filter(b => b.sourceType === 'pharmacy').length,
      ip_room:      allBills.filter(b => b.sourceType === 'ip_room').length,
    },
  }), [allBills]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => allBills.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      b.patientName.toLowerCase().includes(q) ||
      b.billNo.toLowerCase().includes(q) ||
      b.serviceLabel.toLowerCase().includes(q) ||
      (b.patientId || '').toLowerCase().includes(q);
    const matchType = typeFilter === 'All' || b.sourceType === typeFilter;
    const matchStatus = statusFilter === 'All' || b.payStatus === statusFilter;
    return matchSearch && matchType && matchStatus;
  }), [allBills, search, typeFilter, statusFilter]);

  // ── Handle Payment Confirm ─────────────────────────────────────────────────
  const handleCollectConfirm = (billNo, paymentMethod) => {
    // Optimistic local update (works offline too)
    setLocalPaid(prev => ({ ...prev, [billNo]: paymentMethod }));
    const bill = allBills.find(b => b.billNo === billNo);
    setToast(`✅ ₹${Number(bill?.totalAmount).toLocaleString('en-IN')} collected from ${bill?.patientName}`);
    setTimeout(() => setToast(null), 4000);
    // Persist to backend via context action (silent fail when offline)
    if (processUnifiedPayment) {
      processUnifiedPayment(billNo, paymentMethod).catch(() => {});
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#10b981', color: 'white', padding: '14px 20px', borderRadius: 14, fontWeight: 700, fontSize: 14, boxShadow: '0 10px 25px rgba(16,185,129,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: 10, maxWidth: 380 }}>
          <CheckCircle2 size={20} /><span>{toast}</span>
        </div>
      )}

      {/* Modals */}
      {viewBill && <BillDetailModal bill={viewBill} onClose={() => setViewBill(null)} onCollect={b => { setViewBill(null); setCollectBill(b); }} />}
      {collectBill && <CollectPaymentModal bill={collectBill} onClose={() => setCollectBill(null)} onConfirm={handleCollectConfirm} />}

      {/* Page Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff' }}>
            <Receipt size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Unified Billing</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>All patient charges — Consultations, Pharmacy & IP Room — in one view</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Bills',       value: stats.total,                            sub: `${stats.byType.consultation} consult · ${stats.byType.pharmacy} pharmacy · ${stats.byType.ip_room} IP`,  color: '#1d4ed8', bg: '#eff6ff', icon: <Receipt size={17} color="#1d4ed8" /> },
          { label: 'Pending Bills',     value: stats.pending,                          sub: 'Awaiting collection',   color: '#b45309', bg: '#fef3c7', icon: <Clock size={17} color="#b45309" /> },
          { label: 'Pending Amount',    value: `₹${stats.pendingAmt.toLocaleString('en-IN')}`, sub: 'Outstanding amount',   color: '#b45309', bg: '#fef3c7', icon: <IndianRupee size={17} color="#b45309" /> },
          { label: 'Revenue Collected', value: `₹${stats.collected.toLocaleString('en-IN')}`,  sub: 'Total payments received', color: '#15803d', bg: '#dcfce7', icon: <TrendingUp size={17} color="#15803d" /> },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {c.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 }}>{c.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={15} color="#1d4ed8" />
            All Patient Bills
            <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{filtered.length}</span>
          </h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type="text" placeholder="Search patient, bill, service…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: '8px 12px 8px 32px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13.5, outline: 'none', width: 220 }} />
            </div>
            {/* Type Filter */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Tag size={13} style={{ position: 'absolute', left: 10, color: '#94a3b8' }} />
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                style={{ padding: '8px 30px 8px 28px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                <option value="All">All Types</option>
                <option value="consultation">Consultation</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="ip_room">IP / Room</option>
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 8, color: '#64748b', pointerEvents: 'none' }} />
            </div>
            {/* Status Filter */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Filter size={13} style={{ position: 'absolute', left: 10, color: '#94a3b8' }} />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '8px 30px 8px 28px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Dispensed">Dispensed</option>
                <option value="Returned & Refunded">Returned</option>
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 8, color: '#64748b', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 860 }}>
            <thead>
              <tr style={{ background: '#f8fafc', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {['Bill No.', 'Type', 'Patient', 'Service / Detail', 'Date', 'Amount', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '12px 14px', fontWeight: 700, borderBottom: '1px solid #f1f5f9', textAlign: i >= 5 ? 'right' : 'left', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#94a3b8' }}>
                      <AlertCircle size={36} strokeWidth={1.2} />
                      <span style={{ fontSize: 15, fontWeight: 600 }}>No billing records found</span>
                      <span style={{ fontSize: 13 }}>Try adjusting your search or filters</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(bill => {
                const sc = STATUS_COLORS[bill.payStatus] || STATUS_COLORS['Pending'];
                const isPaid = bill.payStatus === 'Paid' || bill.payStatus === 'Dispensed';
                const isReturned = bill.payStatus?.includes('Return');
                const canCollect = !isPaid && !isReturned;

                return (
                  <tr key={bill.billNo}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Bill No */}
                    <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: 12.5 }}>{bill.billNo}</div>
                      {bill.date && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{String(bill.date).substring(0, 10)}</div>}
                    </td>

                    {/* Type */}
                    <td style={{ padding: '13px 14px' }}>
                      <TypeBadge type={bill.sourceType} />
                    </td>

                    {/* Patient */}
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5, whiteSpace: 'nowrap' }}>{bill.patientName}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>
                        {bill.patientId}
                        {calcAge(bill.dob) ? ` · ${calcAge(bill.dob)}y` : ''}
                        {bill.gender !== '—' ? ` · ${bill.gender}` : ''}
                      </div>
                    </td>

                    {/* Service */}
                    <td style={{ padding: '13px 14px', maxWidth: 200 }}>
                      <div style={{ fontWeight: 600, color: '#334155', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bill.serviceLabel}</div>
                      {bill.serviceSubLabel && <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bill.serviceSubLabel}</div>}
                    </td>

                    {/* Date */}
                    <td style={{ padding: '13px 14px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>
                      {bill.date ? String(bill.date).substring(0, 16) : '—'}
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '13px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: isPaid ? '#15803d' : isReturned ? '#dc2626' : '#1d4ed8' }}>
                        ₹ {Number(bill.totalAmount).toLocaleString('en-IN')}
                      </div>
                      {bill.discount > 0 && <div style={{ fontSize: 11, color: '#10b981' }}>-₹{bill.discount} disc.</div>}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '13px 14px', textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.color, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                        {bill.payStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '13px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        {/* Eye / View Detail */}
                        <button
                          onClick={() => setViewBill(bill)}
                          title="View Bill Details"
                          style={{ width: 32, height: 32, border: '1.5px solid #e2e8f0', background: '#f8fafc', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#1d4ed8'; e.currentTarget.style.color = '#1d4ed8'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
                        >
                          <Eye size={14} />
                        </button>

                        {/* Collect Button */}
                        {canCollect ? (
                          <button
                            onClick={() => setCollectBill(bill)}
                            style={{ padding: '5px 12px', border: 'none', background: 'linear-gradient(135deg, #1d4ed8, #1e40af)', color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}
                          >
                            <CreditCard size={12} /> Collect
                          </button>
                        ) : isPaid ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#15803d', fontWeight: 600 }}>
                            <CheckCircle2 size={13} /> Cleared
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {filtered.length > 0 && (
          <div style={{ padding: '11px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Showing <strong>{filtered.length}</strong> of <strong>{allBills.length}</strong> bills
            </span>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#b45309', fontWeight: 600 }}>
                Pending: ₹{filtered.filter(b => b.payStatus === 'Pending').reduce((s, b) => s + b.totalAmount, 0).toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>
                Collected: ₹{filtered.filter(b => b.payStatus === 'Paid' || b.payStatus === 'Dispensed').reduce((s, b) => s + b.totalAmount, 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
