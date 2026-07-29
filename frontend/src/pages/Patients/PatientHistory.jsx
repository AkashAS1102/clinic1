import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  History, Search, Calendar, ChevronRight, RefreshCw, 
  Download, Eye, CheckCircle2, ShieldAlert, User, Pill, FlaskConical, FileText, Stethoscope,
  Table as TableIcon, ListFilter, ChevronDown, ChevronUp
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { departments } from '../../mockData';
import styles from './PatientHistory.module.css';

function PatientAvatar({ name = '', size = 36 }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['avatar-blue', 'avatar-green', 'avatar-purple', 'avatar-orange'];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`avatar ${colors[idx]}`} style={{ width: size, height: size, fontSize: size * 0.38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
      {initials || 'P'}
    </div>
  );
}

function formatDisplayDate(record) {
  if (!record) return 'Today';
  if (record.date && String(record.date).trim() !== '' && String(record.date).trim() !== 'undefined') {
    return String(record.date).trim();
  }
  if (record.consultationDate && String(record.consultationDate).trim() !== '') {
    return String(record.consultationDate).trim();
  }
  if (record.visitDate && String(record.visitDate).trim() !== '') {
    return String(record.visitDate).trim();
  }
  if (record.createdAt) {
    try {
      const cleanDt = String(record.createdAt).replace(' ', 'T');
      const dt = new Date(cleanDt);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      if (String(record.createdAt).length >= 10) {
        return String(record.createdAt).slice(0, 10);
      }
    } catch (e) {}
  }
  if (record.timestamp) {
    try {
      const dt = new Date(record.timestamp);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (e) {}
  }
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PatientHistory() {
  const { pastConsultations, patients } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'feed'
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);

  // Filtering
  const filteredRecords = useMemo(() => {
    return (pastConsultations || []).filter(record => {
      if (!record) return false;
      const pat = (patients || []).find(p => p && p.id === record.patientId);
      const patName = pat ? pat.fullName : (record.patientName || `Patient #${record.patientId || ''}`);

      const matchSearch = 
        (patName || '').toLowerCase().includes(search.toLowerCase()) ||
        (record.patientId || '').toLowerCase().includes(search.toLowerCase()) ||
        (record.diagnosis && record.diagnosis.toLowerCase().includes(search.toLowerCase())) ||
        (record.doctorName && record.doctorName.toLowerCase().includes(search.toLowerCase()));

      const matchDept = !deptFilter || record.department === deptFilter;

      return matchSearch && matchDept;
    });
  }, [pastConsultations, patients, search, deptFilter]);

  const handleRefresh = () => {
    setToast('Synced clinical history logs with hospital electronic health records!');
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = () => {
    const headers = ['ConsultationID,PatientID,PatientName,Date,Doctor,Department,Diagnosis,PrescriptionsCount,LabTests'];
    const rows = filteredRecords.map(r => {
      const pat = patients.find(p => p.id === r.patientId);
      const patName = pat ? pat.fullName : 'Patient';
      return `"${r.id}","${r.patientId}","${patName}","${formatDisplayDate(r)}","${r.doctorName}","${r.department}","${r.diagnosis}","${r.prescriptions?.length || 0}","${r.labTests?.join('; ') || ''}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'clinic_patient_history_audit.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast('Downloaded clinic_patient_history_audit.csv successfully!');
    setTimeout(() => setToast(null), 3500);
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className={styles.page}>
      {toast && (
        <div className={styles.toast}>
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Compact Top Bar */}
      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={12} /> <Link to="/patients/all" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Patients</Link> <ChevronRight size={12} /> <span>Patients History</span>
          </div>
          <h1 className={styles.pageTitle}>Patients Medical History & Clinical Logs</h1>
        </div>

        <div className={styles.topButtons}>
          <button className={styles.btnRefresh} onClick={handleRefresh}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className={styles.btnExport} onClick={handleExport}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Compact Filter Bar */}
      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIcon} />
          <input 
            type="text" 
            className={styles.searchInput}
            placeholder="Search patient name, ID, diagnosis, or doctor..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select 
          className={styles.filterSelect}
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <button 
          className="btn btn-outline btn-sm" 
          style={{ height: 35, background: 'white' }}
          onClick={() => { setSearch(''); setDeptFilter(''); }}
        >
          Reset
        </button>

        {/* View Toggle */}
        <div className={styles.viewToggle}>
          <button 
            className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
            onClick={() => setViewMode('table')}
          >
            <TableIcon size={14} /> Compact Table
          </button>
          <button 
            className={`${styles.viewBtn} ${viewMode === 'feed' ? styles.viewBtnActive : ''}`}
            onClick={() => setViewMode('feed')}
          >
            <ListFilter size={14} /> Feed List
          </button>
        </div>
      </div>

      {/* Scrollable Main Area */}
      <div className={styles.scrollContainer}>
        {filteredRecords.length === 0 ? (
          <div className={styles.emptyState}>
            <History size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16 }}>No Medical History Records Found</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Try clearing your filters or search terms.</p>
            <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => { setSearch(''); setDeptFilter(''); }}>
              Reset Search
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* COMPACT TABLE WITH EXPANDABLE ROWS */
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 110 }}>DATE</th>
                <th>PATIENT NAME & ID</th>
                <th>DEPARTMENT & DOCTOR</th>
                <th>PRIMARY DIAGNOSIS</th>
                <th>TREATMENT SUMMARY</th>
                <th style={{ textAlign: 'right' }}>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => {
                const pat = patients.find(p => p.id === record.patientId);
                const patName = pat ? pat.fullName : `Patient #${record.patientId}`;
                const isExpanded = expandedId === record.id;
                const rxCount = record.prescriptions?.length || 0;
                const labCount = record.labTests?.length || 0;

                return (
                  <React.Fragment key={record.id}>
                    <tr>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeBlue}`} style={{ fontSize: 11.5 }}>
                          <Calendar size={12} /> {formatDisplayDate(record)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <PatientAvatar name={patName} size={32} />
                          <div>
                            <div className={styles.patName}>{patName}</div>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/patients/details?id=${record.patientId}`); }} className={styles.idLink}>
                              #{record.patientId}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{record.department || 'General'}</div>
                        <div className={styles.patSub}>By: {record.doctorName || 'Attending Doctor'}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: '#dc2626', fontSize: 13.5 }}>
                          {record.diagnosis || 'General Checkup'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span className={`${styles.badge} ${rxCount > 0 ? styles.badgeGreen : ''}`} style={{ background: rxCount ? '#dcfce7' : '#f1f5f9', color: rxCount ? '#16a34a' : '#64748b' }}>
                            <Pill size={12} /> {rxCount} Rx
                          </span>
                          <span className={`${styles.badge} ${labCount > 0 ? styles.badgePurple : ''}`} style={{ background: labCount ? '#e0e7ff' : '#f1f5f9', color: labCount ? '#4338ca' : '#64748b' }}>
                            <FlaskConical size={12} /> {labCount} Labs
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button 
                            className={styles.actionBtn}
                            onClick={() => toggleExpand(record.id)}
                            title={isExpanded ? "Collapse Details" : "Expand Details"}
                          >
                            <span>{isExpanded ? 'Hide' : 'Expand'}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button 
                            className={styles.actionBtn}
                            onClick={() => navigate(`/patients/details?id=${record.patientId}`)}
                            title="View Patient Profile"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDED ACCORDION ROW */}
                    {isExpanded && (
                      <tr className={styles.expandedRow}>
                        <td colSpan={6}>
                          <div className={styles.expandGrid}>
                            <div className={styles.expandBox}>
                              <div className={styles.expandTitle}><Pill size={13} style={{ color: '#2563eb' }} /> Prescriptions ({rxCount})</div>
                              {rxCount > 0 ? (
                                record.prescriptions.map((rx, i) => (
                                  <div key={i} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: i < rxCount - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                                    <div className={styles.rxItem}>
                                      <span>💊 {rx.medicine}</span>
                                      <span style={{ color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>{rx.frequency}</span>
                                    </div>
                                    <div className={styles.rxSub}>Dosage: {rx.dosage} • Duration: {rx.duration}</div>
                                  </div>
                                ))
                              ) : (
                                <div style={{ color: '#64748b', fontSize: 12, fontStyle: 'italic' }}>No medications prescribed.</div>
                              )}
                            </div>

                            <div className={styles.expandBox}>
                              <div className={styles.expandTitle}><FlaskConical size={13} style={{ color: '#4338ca' }} /> Ordered Lab Tests ({labCount})</div>
                              {labCount > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                  {record.labTests.map((test, i) => (
                                    <span key={i} style={{ background: '#e0e7ff', color: '#4338ca', padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>
                                      🧪 {test}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ color: '#64748b', fontSize: 12, fontStyle: 'italic' }}>No laboratory tests ordered.</div>
                              )}
                            </div>

                            <div className={styles.expandBox}>
                              <div className={styles.expandTitle}><FileText size={13} style={{ color: '#475569' }} /> Clinical Notes & Observations</div>
                              <div style={{ fontSize: 12.5, color: '#334155', fontStyle: record.notes ? 'italic' : 'normal', lineHeight: 1.5 }}>
                                {record.notes ? `"${record.notes}"` : 'No additional doctor notes recorded for this consultation.'}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* COMPACT FEED LIST VIEW */
          <div className={styles.timelineFeed}>
            {filteredRecords.map(record => {
              const pat = patients.find(p => p.id === record.patientId);
              const patName = pat ? pat.fullName : `Patient #${record.patientId}`;
              const rxCount = record.prescriptions?.length || 0;
              const labCount = record.labTests?.length || 0;

              return (
                <div key={record.id} className={styles.compactCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <PatientAvatar name={patName} size={40} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 className={styles.patName} style={{ margin: 0 }}>{patName}</h4>
                        <span className={`${styles.badge} ${styles.badgeBlue}`} style={{ fontSize: 11 }}>#{record.patientId}</span>
                      </div>
                      <div className={styles.patSub}>🗓️ {formatDisplayDate(record)} • 🏥 {record.department || 'General'} ({record.doctorName || 'Attending Doctor'})</div>
                    </div>
                  </div>

                  <div style={{ flex: '1 1 200px' }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Diagnosis</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#dc2626' }}>{record.diagnosis || 'General Checkup'}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`${styles.badge} ${styles.badgeGreen}`}><Pill size={13} /> {rxCount} Rx</span>
                    <span className={`${styles.badge} ${styles.badgePurple}`}><FlaskConical size={13} /> {labCount} Labs</span>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/patients/details?id=${record.patientId}`)}>
                      Profile →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
