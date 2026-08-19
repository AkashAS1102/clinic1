import { useState, useMemo } from 'react';
import {
  BedDouble, Search, X, LogOut, User, Calendar, Stethoscope,
  Activity, ClipboardList, ChevronDown, AlertCircle, CheckCircle2,
  Clock, Building2, Filter, Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './IPPatients.module.css';

const WARDS = [
  'General Ward', 'ICU', 'Surgical Ward', 'Maternity Ward',
  'Pediatric Ward', 'Cardiac ICU', 'Orthopedic Ward', 'Neurology Ward'
];

const STATUS_CONFIG = {
  'Admitted':        { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  'Under Treatment': { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'Discharged':      { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  'Critical':        { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Admitted'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.border}`,
    }}>
      {status === 'Admitted'        && <BedDouble size={11} />}
      {status === 'Under Treatment' && <Activity size={11} />}
      {status === 'Discharged'      && <CheckCircle2 size={11} />}
      {status === 'Critical'        && <AlertCircle size={11} />}
      {status}
    </span>
  );
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'
];
function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export default function IPPatients() {
  const { ipPatients, dischargeIpPatient, updateIpPatientStatus } = useApp();

  const [search, setSearch] = useState('');
  const [filterWard, setFilterWard] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dischargeId, setDischargeId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [statusChangeId, setStatusChangeId] = useState(null);

  const filtered = useMemo(() => {
    return ipPatients.filter(p => {
      const matchSearch = !search ||
        (p.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.patientId || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.ward || '').toLowerCase().includes(search.toLowerCase());
      const matchWard = filterWard === 'All' || p.ward === filterWard;
      const matchStatus = filterStatus === 'All' || p.status === filterStatus;
      return matchSearch && matchWard && matchStatus;
    });
  }, [ipPatients, search, filterWard, filterStatus]);

  const stats = useMemo(() => ({
    total:     ipPatients.length,
    admitted:  ipPatients.filter(p => p.status === 'Admitted').length,
    treatment: ipPatients.filter(p => p.status === 'Under Treatment').length,
    critical:  ipPatients.filter(p => p.status === 'Critical').length,
    discharged:ipPatients.filter(p => p.status === 'Discharged').length,
  }), [ipPatients]);

  const confirmDischarge = (id) => {
    dischargeIpPatient(id);
    setDischargeId(null);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <BedDouble size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className={styles.title}>IP Patients</h1>
            <p className={styles.subtitle}>Inpatient admissions & ward management</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.totalBadge}>
            <Building2 size={13} /> {ipPatients.length} Total Admitted
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total Admitted', value: stats.total,     color: '#2563eb', bg: '#eff6ff',  icon: BedDouble },
          { label: 'Under Treatment',value: stats.treatment, color: '#d97706', bg: '#fffbeb',  icon: Activity },
          { label: 'Critical',       value: stats.critical,  color: '#dc2626', bg: '#fef2f2',  icon: AlertCircle },
          { label: 'Discharged Today',value: stats.discharged,color:'#16a34a', bg: '#f0fdf4', icon: CheckCircle2 },
        ].map(stat => (
          <div key={stat.label} className={styles.statCard} style={{ borderTop: `3px solid ${stat.color}` }}>
            <div className={styles.statIcon} style={{ background: stat.bg, color: stat.color }}>
              <stat.icon size={18} />
            </div>
            <div>
              <div className={styles.statValue} style={{ color: stat.color }}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <div className={styles.searchWrapper}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by patient name, ID or ward..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className={styles.filterGroup}>
          <Filter size={14} style={{ color: '#64748b' }} />
          <select
            className={styles.filterSelect}
            value={filterWard}
            onChange={e => setFilterWard(e.target.value)}
          >
            <option value="All">All Wards</option>
            {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Admitted">Admitted</option>
            <option value="Under Treatment">Under Treatment</option>
            <option value="Critical">Critical</option>
            <option value="Discharged">Discharged</option>
          </select>
        </div>
      </div>

      {/* Patient List */}
      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <BedDouble size={56} strokeWidth={1.2} className={styles.emptyIcon} />
          <div className={styles.emptyTitle}>
            {ipPatients.length === 0
              ? 'No IP Patients Yet'
              : 'No patients match your search'}
          </div>
          <div className={styles.emptyDesc}>
            {ipPatients.length === 0
              ? 'When a doctor admits a patient from the Consultation page, they will appear here.'
              : 'Try adjusting your search or filter criteria.'}
          </div>
        </div>
      ) : (
        <div className={styles.patientList}>
          {filtered.map(ip => {
            const isExpanded = expandedId === ip.id;
            const isActive = ip.status !== 'Discharged';
            return (
              <div
                key={ip.id}
                className={`${styles.patientCard} ${!isActive ? styles.dischargedCard : ''}`}
              >
                {/* Card Header */}
                <div
                  className={styles.cardHeader}
                  onClick={() => setExpandedId(isExpanded ? null : ip.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.cardLeft}>
                    <div
                      className={styles.avatar}
                      style={{ background: avatarColor(ip.patientName) }}
                    >
                      {getInitials(ip.patientName)}
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardName}>
                        {ip.patientName}
                        {ip.isUrgent && (
                          <span className={styles.urgentTag}>🔴 URGENT</span>
                        )}
                      </div>
                      <div className={styles.cardMeta}>
                        <span>ID: #{ip.patientId}</span>
                        {ip.token && <><span className={styles.dot}>•</span><span>Token: {ip.token}</span></>}
                        {ip.age && <><span className={styles.dot}>•</span><span>{ip.age}Y</span></>}
                        {ip.gender && <><span className={styles.dot}>•</span><span>{ip.gender === 'M' ? 'Male' : ip.gender === 'F' ? 'Female' : ip.gender}</span></>}
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardRight}>
                    <div className={styles.wardBadge}>
                      <Building2 size={12} />
                      {ip.ward || 'General Ward'}
                    </div>
                    <StatusBadge status={ip.status} />
                    <div className={styles.admitDate}>
                      <Clock size={11} />
                      {ip.admissionDate}
                    </div>
                    <ChevronDown
                      size={16}
                      style={{
                        color: '#94a3b8',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className={styles.cardDetails}>
                    <div className={styles.detailsGrid}>
                      <div className={styles.detailItem}>
                        <div className={styles.detailLabel}>
                          <Stethoscope size={12} /> Diagnosis
                        </div>
                        <div className={styles.detailValue}>{ip.diagnosis || '—'}</div>
                      </div>
                      <div className={styles.detailItem}>
                        <div className={styles.detailLabel}>
                          <User size={12} /> Admitting Doctor
                        </div>
                        <div className={styles.detailValue}>{ip.doctorName || '—'}</div>
                      </div>
                      <div className={styles.detailItem}>
                        <div className={styles.detailLabel}>
                          <BedDouble size={12} /> Bed Type
                        </div>
                        <div className={styles.detailValue}>{ip.bedType || '—'}</div>
                      </div>
                      <div className={styles.detailItem}>
                        <div className={styles.detailLabel}>
                          <Calendar size={12} /> Estimated Stay
                        </div>
                        <div className={styles.detailValue}>{ip.estimatedStay || '—'}</div>
                      </div>
                    </div>

                    {ip.admissionReason && (
                      <div className={styles.reasonBox}>
                        <div className={styles.detailLabel}>
                          <ClipboardList size={12} /> Reason for Admission
                        </div>
                        <div className={styles.reasonText}>{ip.admissionReason}</div>
                      </div>
                    )}

                    {ip.status === 'Discharged' && ip.dischargeDate && (
                      <div className={styles.dischargeInfo}>
                        <CheckCircle2 size={13} style={{ color: '#16a34a' }} />
                        Discharged on: <strong>{ip.dischargeDate}</strong>
                      </div>
                    )}

                    {/* Actions */}
                    {isActive && (
                      <div className={styles.cardActions}>
                        <div className={styles.statusChangeGroup}>
                          <span className={styles.actionLabel}>Change Status:</span>
                          {['Admitted', 'Under Treatment', 'Critical'].filter(s => s !== ip.status).map(s => (
                            <button
                              key={s}
                              className={styles.statusBtn}
                              style={{ borderColor: STATUS_CONFIG[s].color, color: STATUS_CONFIG[s].color }}
                              onClick={() => updateIpPatientStatus(ip.id, s)}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        <button
                          className={styles.dischargeBtn}
                          onClick={() => setDischargeId(ip.id)}
                        >
                          <LogOut size={14} /> Discharge Patient
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Discharge Confirmation Modal */}
      {dischargeId && (() => {
        const patient = ipPatients.find(p => p.id === dischargeId);
        return (
          <div className={styles.modalOverlay} onClick={() => setDischargeId(null)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <LogOut size={18} style={{ color: '#16a34a' }} />
                <span>Discharge Patient</span>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.modalPatientInfo}>
                  <div
                    className={styles.modalAvatar}
                    style={{ background: avatarColor(patient?.patientName) }}
                  >
                    {getInitials(patient?.patientName)}
                  </div>
                  <div>
                    <div className={styles.modalPatientName}>{patient?.patientName}</div>
                    <div className={styles.modalPatientMeta}>
                      ID: #{patient?.patientId} &nbsp;•&nbsp; Ward: {patient?.ward}
                    </div>
                  </div>
                </div>
                <p className={styles.modalQuestion}>
                  Are you sure you want to discharge this patient? This will mark the admission as completed.
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.modalCancelBtn} onClick={() => setDischargeId(null)}>
                  Cancel
                </button>
                <button className={styles.modalConfirmBtn} onClick={() => confirmDischarge(dischargeId)}>
                  <CheckCircle2 size={14} /> Confirm Discharge
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
