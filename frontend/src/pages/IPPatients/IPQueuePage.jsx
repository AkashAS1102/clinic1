import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  Search,
  X,
  LogOut,
  Calendar,
  Activity,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  Filter,
  Eye,
  ArrowLeftRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// ─── Helpers ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];

function avatarColor(name = '') {
  const str = name || '';
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h + str.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const calculateLoS = (admissionDate) => {
  if (!admissionDate) return '—';
  let adm;
  try {
    adm = new Date(admissionDate);
  } catch {
    return '—';
  }
  if (isNaN(adm.getTime())) return '—';
  const diffMs = Date.now() - adm.getTime();
  if (diffMs < 0) return '< 1h';
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  if (diffDays > 0) return `${diffDays}d ${diffHrs}h`;
  if (diffHrs > 0) return `${diffHrs}h ${diffMins}m`;
  return `${diffMins}m`;
};

const calcAvgLoS = (patients) => {
  const withDates = patients.filter((p) => p.admissionDate && p.status !== 'Discharged');
  if (withDates.length === 0) return '0.0';
  const totalMs = withDates.reduce((sum, p) => {
    const adm = new Date(p.admissionDate);
    return sum + (isNaN(adm) ? 0 : Date.now() - adm.getTime());
  }, 0);
  const avgDays = totalMs / withDates.length / 86400000;
  return avgDays.toFixed(1);
};

const isPendingDischarge = (p) => {
  if (!p.estimatedDischargeDate && !p.estimatedStay) return false;
  if (p.estimatedDischargeDate) {
    const edd = new Date(p.estimatedDischargeDate);
    const diff = edd - new Date();
    return diff > 0 && diff < 86400000 * 2;
  }
  if (p.admissionDate && p.estimatedStay) {
    const stayDays = p.estimatedStay.includes('1 Day')
      ? 1
      : p.estimatedStay.includes('2')
      ? 2
      : 3;
    const adm = new Date(p.admissionDate);
    const expectedEnd = new Date(adm.getTime() + stayDays * 86400000);
    const diff = expectedEnd - new Date();
    return diff > 0 && diff < 86400000 * 2;
  }
  return false;
};

const formatAdmissionDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const losDays = (admissionDate) => {
  if (!admissionDate) return 0;
  const adm = new Date(admissionDate);
  if (isNaN(adm.getTime())) return 0;
  return Math.floor((Date.now() - adm.getTime()) / 86400000);
};

const isExpectedTodayOrTomorrow = (p) => {
  if (!p.estimatedDischargeDate) return false;
  const edd = new Date(p.estimatedDischargeDate);
  const diff = edd - new Date();
  return diff > 0 && diff < 86400000;
};

// ─── Status Badge ────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  Admitted: { bg: '#dbeafe', color: '#1d4ed8', label: 'Admitted' },
  'Under Treatment': { bg: '#f3e8ff', color: '#7c3aed', label: 'Under Treatment' },
  Critical: { bg: '#fee2e2', color: '#dc2626', label: 'Critical' },
  Discharged: { bg: '#d1fae5', color: '#059669', label: 'Discharged' },
  Pending: { bg: '#fef9c3', color: '#ca8a04', label: 'Pending' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#f3f4f6', color: '#374151', label: status || 'Unknown' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

// ─── Clinical Alert Badge ─────────────────────────────────────────────────────

function ClinicalAlert({ patient }) {
  if (patient.isUrgent || patient.status === 'Critical') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 10px',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 700,
          background: '#fee2e2',
          color: '#dc2626',
        }}
      >
        <AlertCircle size={12} />
        {patient.isUrgent ? 'URGENT' : 'CRITICAL'}
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        background: '#dcfce7',
        color: '#16a34a',
      }}
    >
      <CheckCircle2 size={12} />
      Stable
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 36 }) {
  const bg = avatarColor(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, value, label, borderColor, iconBg, iconColor }) {
  return (
    <div
      style={{
        flex: '1 1 180px',
        background: '#fff',
        borderRadius: 12,
        padding: '16px 20px',
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={22} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }) {
  return (
    <tr>
      <td colSpan={7}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            color: '#9ca3af',
            gap: 12,
          }}
        >
          <ClipboardList size={48} strokeWidth={1.2} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>No patients found</div>
          <div style={{ fontSize: 13 }}>{message}</div>
        </div>
      </td>
    </tr>
  );
}

// ─── Discharge Confirmation Inline Row ────────────────────────────────────────

function DischargeConfirmRow({ patient, onConfirm, onCancel }) {
  return (
    <tr>
      <td
        colSpan={7}
        style={{
          background: '#fff7ed',
          borderTop: '1px solid #fed7aa',
          borderBottom: '1px solid #fed7aa',
          padding: '14px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <AlertCircle size={20} color="#ea580c" />
          <span style={{ fontSize: 14, color: '#374151', flex: 1 }}>
            Are you sure you want to discharge{' '}
            <strong>{patient.patientName}</strong>? This will free the bed and finalize billing.
          </span>
          <button
            onClick={onConfirm}
            style={{
              padding: '7px 18px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Confirm Discharge
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '7px 18px',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Row background helper ────────────────────────────────────────────────────

function getRowStyle(patient) {
  if (patient.status === 'Critical' || patient.isUrgent) {
    return {
      background: 'rgba(220,38,38,0.04)',
      borderLeft: '3px solid #dc2626',
    };
  }
  if (isExpectedTodayOrTomorrow(patient)) {
    return {
      background: 'rgba(22,163,74,0.04)',
      borderLeft: '3px solid #16a34a',
    };
  }
  if (losDays(patient.admissionDate) > 7) {
    return {
      background: 'rgba(251,191,36,0.05)',
      borderLeft: '3px solid #f59e0b',
    };
  }
  return { background: '#fff', borderLeft: '3px solid transparent' };
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'all', label: 'All Admitted' },
  { key: 'under_treatment', label: 'Under Treatment' },
  { key: 'expected_discharge', label: 'Expected Discharges' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IPQueuePage() {
  const navigate = useNavigate();
  const { ipPatients = [], dischargeIpPatient, rooms = [] } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [wardFilter, setWardFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('all');
  const [confirmDischargeId, setConfirmDischargeId] = useState(null);

  // ── Derived metrics ────────────────────────────────────────────────────────

  const activePatients = useMemo(
    () => ipPatients.filter((p) => p.status !== 'Discharged' && p.status !== 'Pending'),
    [ipPatients]
  );

  const totalInpatients = activePatients.length;
  const avgLoS = calcAvgLoS(ipPatients);
  const pendingDischargeCount = activePatients.filter(isPendingDischarge).length;
  const occupancyRate =
    rooms.length > 0 ? Math.min(100, Math.round((totalInpatients / rooms.length) * 100)) : 0;

  // ── Unique wards ───────────────────────────────────────────────────────────

  const uniqueWards = useMemo(() => {
    const s = new Set(activePatients.map((p) => p.ward).filter(Boolean));
    return ['All', ...Array.from(s).sort()];
  }, [activePatients]);

  // ── Tab counts ────────────────────────────────────────────────────────────

  const tabCounts = useMemo(() => {
    const now = Date.now();
    return {
      all: activePatients.length,
      under_treatment: activePatients.filter(
        (p) => p.status === 'Admitted' || p.status === 'Under Treatment'
      ).length,
      expected_discharge: activePatients.filter((p) => {
        if (!p.estimatedDischargeDate) return false;
        const edd = new Date(p.estimatedDischargeDate);
        const diff = edd.getTime() - now;
        return diff > 0 && diff < 86400000 * 2;
      }).length,
    };
  }, [activePatients]);

  // ── Tab filter ────────────────────────────────────────────────────────────

  const tabFiltered = useMemo(() => {
    const now = Date.now();
    switch (activeTab) {
      case 'under_treatment':
        return activePatients.filter(
          (p) => p.status === 'Admitted' || p.status === 'Under Treatment'
        );
      case 'expected_discharge':
        return activePatients.filter((p) => {
          if (!p.estimatedDischargeDate) return false;
          const edd = new Date(p.estimatedDischargeDate);
          const diff = edd.getTime() - now;
          return diff > 0 && diff < 86400000 * 2;
        });
      default:
        return activePatients;
    }
  }, [activePatients, activeTab]);

  // ── Search + filter ───────────────────────────────────────────────────────

  const visiblePatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tabFiltered.filter((p) => {
      const matchesSearch =
        !q ||
        (p.patientName || '').toLowerCase().includes(q) ||
        (p.patientId || '').toLowerCase().includes(q) ||
        (p.doctorName || '').toLowerCase().includes(q) ||
        (p.ward || '').toLowerCase().includes(q);
      const matchesWard = wardFilter === 'All' || p.ward === wardFilter;
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesWard && matchesStatus;
    });
  }, [tabFiltered, searchQuery, wardFilter, statusFilter]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDischarge = (id) => {
    if (dischargeIpPatient) dischargeIpPatient(id);
    setConfirmDischargeId(null);
  };

  // ── Shared styles ─────────────────────────────────────────────────────────

  const thStyle = {
    padding: '11px 14px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
    whiteSpace: 'nowrap',
  };

  const tdStyle = {
    padding: '13px 14px',
    fontSize: 13,
    color: '#374151',
    verticalAlign: 'middle',
    borderBottom: '1px solid #f3f4f6',
  };

  const actionBtnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: 7,
    background: '#fff',
    color: '#374151',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* ── Page Header ── */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '18px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BedDouble size={20} color="#2563eb" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
              IP Patient Queue
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
              Ward Dashboard · Admitted Patient Management
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} color="#9ca3af" />
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            Live ·{' '}
            {new Date().toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </span>
        </div>
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
        {/* ── Clinic at a Glance Strip ── */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          <MetricCard
            icon={BedDouble}
            value={totalInpatients}
            label="Total Inpatients"
            borderColor="#2563eb"
            iconBg="#eff6ff"
            iconColor="#2563eb"
          />
          <MetricCard
            icon={TrendingUp}
            value={`${avgLoS} days`}
            label="Avg Length of Stay"
            borderColor="#7c3aed"
            iconBg="#f5f3ff"
            iconColor="#7c3aed"
          />
          <MetricCard
            icon={LogOut}
            value={pendingDischargeCount}
            label="Pending Discharges (48h)"
            borderColor="#ea580c"
            iconBg="#fff7ed"
            iconColor="#ea580c"
          />
          <MetricCard
            icon={Activity}
            value={`${occupancyRate}%`}
            label="Bed Occupancy Rate"
            borderColor="#16a34a"
            iconBg="#f0fdf4"
            iconColor="#16a34a"
          />
        </div>

        {/* ── Filter Bar ── */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '14px 18px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            marginBottom: 16,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <Search
              size={15}
              color="#9ca3af"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <input
              type="text"
              placeholder="Search patient, ID, doctor, ward…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 32px 8px 32px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
                color: '#374151',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Ward Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Building2 size={14} color="#6b7280" />
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 13,
                color: '#374151',
                background: '#fff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {uniqueWards.map((w) => (
                <option key={w} value={w}>
                  {w === 'All' ? 'All Wards' : w}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Filter size={14} color="#6b7280" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 13,
                color: '#374151',
                background: '#fff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Admitted">Admitted</option>
              <option value="Under Treatment">Under Treatment</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Reset */}
          {(searchQuery || wardFilter !== 'All' || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setWardFilter('All');
                setStatusFilter('All');
              }}
              style={{
                padding: '8px 14px',
                border: '1px solid #fee2e2',
                borderRadius: 8,
                background: '#fff5f5',
                color: '#dc2626',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <X size={12} /> Reset
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
            {visiblePatients.length} patient{visiblePatients.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: isActive ? 'none' : '1px solid #e5e7eb',
                  background: isActive ? '#1e293b' : '#fff',
                  color: isActive ? '#fff' : '#374151',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                {tab.label}
                <span
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                    color: isActive ? '#fff' : '#6b7280',
                    borderRadius: 10,
                    padding: '1px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {tabCounts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Data Table ── */}
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Patient</th>
                  <th style={thStyle}>Admitting Physician</th>
                  <th style={thStyle}>Admission Time</th>
                  <th style={thStyle}>Length of Stay</th>
                  <th style={thStyle}>Clinical Alert</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visiblePatients.length === 0 ? (
                  <EmptyState
                    message={
                      searchQuery || wardFilter !== 'All' || statusFilter !== 'All'
                        ? 'Try adjusting your search or filter criteria.'
                        : 'No admitted patients in this category right now.'
                    }
                  />
                ) : (
                  visiblePatients.map((patient) => {
                    const rowStyle = getRowStyle(patient);
                    const isConfirming = confirmDischargeId === patient.id;
                    const longStay = losDays(patient.admissionDate) > 7;

                    return (
                      <React.Fragment key={patient.id}>
                        <tr style={{ ...rowStyle }}>
                          {/* Patient */}
                          <td
                            style={{
                              ...tdStyle,
                              borderLeft: rowStyle.borderLeft,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar name={patient.patientName} size={38} />
                              <div>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color: '#111827',
                                    fontSize: 14,
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {patient.patientName || '—'}
                                </div>
                                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                                  {patient.patientId || '—'}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: '#6b7280',
                                    marginTop: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  <BedDouble size={10} />
                                  {[
                                    patient.ward,
                                    patient.allocatedRoomNo
                                      ? `Room ${patient.allocatedRoomNo}`
                                      : patient.allocatedRoomId
                                      ? 'Bed Assigned'
                                      : 'Awaiting Bed',
                                  ]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Admitting Physician */}
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Avatar name={patient.doctorName} size={28} />
                              <span
                                style={{ fontWeight: 500, color: '#374151', fontSize: 13 }}
                              >
                                {patient.doctorName || '—'}
                              </span>
                            </div>
                          </td>

                          {/* Admission Time */}
                          <td style={tdStyle}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                color: '#6b7280',
                              }}
                            >
                              <Calendar size={13} />
                              <span style={{ fontSize: 12 }}>
                                {formatAdmissionDate(patient.admissionDate)}
                              </span>
                            </div>
                          </td>

                          {/* Length of Stay */}
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock
                                size={13}
                                color={longStay ? '#f59e0b' : '#6b7280'}
                              />
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: longStay ? '#b45309' : '#374151',
                                  fontSize: 13,
                                }}
                              >
                                {calculateLoS(patient.admissionDate)}
                              </span>
                            </div>
                          </td>

                          {/* Clinical Alert */}
                          <td style={tdStyle}>
                            <ClinicalAlert patient={patient} />
                          </td>

                          {/* Status */}
                          <td style={tdStyle}>
                            <StatusBadge status={patient.status} />
                          </td>

                          {/* Actions */}
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <div
                              style={{
                                display: 'flex',
                                gap: 6,
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                              }}
                            >
                              <button
                                title="View Patient"
                                onClick={() =>
                                  navigate(
                                    `/ip-patients/view?id=${patient.patientId}`
                                  )
                                }
                                style={{
                                  ...actionBtnStyle,
                                  color: '#2563eb',
                                  borderColor: '#bfdbfe',
                                }}
                              >
                                <Eye size={13} />
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {visiblePatients.length > 0 && (
            <div
              style={{
                padding: '10px 18px',
                borderTop: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                Showing <strong>{visiblePatients.length}</strong> of{' '}
                <strong>{activePatients.length}</strong> admitted patients
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { color: '#dc2626', label: 'Critical / Urgent' },
                  { color: '#f59e0b', label: 'Long Stay (>7d)' },
                  { color: '#16a34a', label: 'Discharging Today' },
                ].map((l) => (
                  <div
                    key={l.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      color: '#6b7280',
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: l.color,
                      }}
                    />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
