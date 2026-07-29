import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, HeartPulse, Activity, 
  ChevronRight, RefreshCw, Download, Eye, Edit2, CheckCircle2,
  Search, AlertTriangle, ShieldCheck, Droplets, BarChart2,
  Phone, Award, Building, Sparkles, ArrowUpRight, ClipboardList, ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './AllPatients.module.css';

export default function AllPatients() {
  const { patients, updatePatient } = useApp();
  const navigate = useNavigate();
  
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'critical' | 'analytics'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBlood, setSelectedBlood] = useState('All');

  // Trigger Toast Notification
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // KPIs & Calculations
  const totalPatients = (patients || []).length;
  const malePatients = (patients || []).filter(p => p.gender === 'Male').length;
  const femalePatients = (patients || []).filter(p => p.gender === 'Female').length;
  const otherPatients = totalPatients - malePatients - femalePatients;
  
  const corporatePatients = (patients || []).filter(p => 
    (p.patientCategory || '').includes('Corporate') || (p.patientCategory || '').includes('Insurance') || p.insuranceProvider
  ).length;

  const vipPatients = (patients || []).filter(p => 
    (p.patientCategory || '').includes('VIP') || (p.patientCategory || '').includes('Priority')
  ).length;

  const chronicOrCritical = (patients || []).filter(p => 
    p.status === 'Critical Care' || 
    p.status === 'Inpatient' || 
    (p.conditions && p.conditions.length > 0) || 
    (p.allergies && p.allergies.length > 0)
  );

  // Filtered Roster
  const filteredPatients = useMemo(() => {
    return (patients || []).filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        (p.fullName || '').toLowerCase().includes(q) ||
        (p.id || '').toLowerCase().includes(q) ||
        (p.phone || '').includes(q) ||
        (p.conditions || '').toLowerCase().includes(q) ||
        (p.referringDoctor || '').toLowerCase().includes(q);

      const matchCategory = selectedCategory === 'All' || 
        (p.patientCategory || 'General').includes(selectedCategory) ||
        (selectedCategory === 'Corporate / Insurance' && p.insuranceProvider);

      const matchBlood = selectedBlood === 'All' || p.bloodGroup === selectedBlood;

      return matchSearch && matchCategory && matchBlood;
    });
  }, [patients, searchQuery, selectedCategory, selectedBlood]);

  // Blood Group Counts for Analytics
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const bloodCounts = useMemo(() => {
    const counts = {};
    bloodGroups.forEach(bg => { counts[bg] = 0; });
    (patients || []).forEach(p => {
      if (p.bloodGroup && counts[p.bloodGroup] !== undefined) {
        counts[p.bloodGroup]++;
      }
    });
    return counts;
  }, [patients]);

  // Toggle Patient Status (Interactive Triage)
  const handleStatusToggle = async (patient) => {
    const statuses = ['Active', 'Inpatient', 'Critical Care', 'Discharged'];
    const currentIdx = statuses.indexOf(patient.status || 'Active');
    const nextStatus = statuses[(currentIdx + 1) % statuses.length];
    
    if (updatePatient) {
      await updatePatient(patient.id, { ...patient, status: nextStatus });
    }
    showToast(`Triage status for ${patient.fullName} updated to ${nextStatus}`);
  };

  // Export CSV
  const handleExport = () => {
    const headers = ['ID,Name,Phone,Gender,DOB,BloodGroup,Category,Conditions,Status,ReferringDoctor'];
    const rows = (patients || []).map(p => 
      `"${p.id || ''}","${p.fullName || ''}","${p.phone || ''}","${p.gender || ''}","${p.dob || ''}","${p.bloodGroup || ''}","${p.patientCategory || 'General'}","${p.conditions || ''}","${p.status || 'Active'}","${p.referringDoctor || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'clinical_patient_roster.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Downloaded clinical_patient_roster.csv successfully!');
  };

  const getStatusClass = (status) => {
    if (status === 'Critical Care') return styles.statusCritical;
    if (status === 'Inpatient') return styles.statusInpatient;
    if (status === 'Discharged') return styles.statusDischarged;
    return styles.statusActive;
  };

  const getBloodBadgeClass = (bg) => {
    if (bg?.includes('O')) return styles.badgeRed;
    if (bg?.includes('A') && !bg?.includes('B')) return styles.badgeBlue;
    if (bg?.includes('B') && !bg?.includes('A')) return styles.badgePurple;
    if (bg?.includes('AB')) return styles.badgeGreen;
    return styles.badgeYellow;
  };

  return (
    <div className={styles.page}>
      {toast && (
        <div className={styles.toast}>
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Executive Header */}
      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Clinic EMR</Link> <ChevronRight size={14} /> <span>Patient Command Center</span>
          </div>
          <h1 className={styles.pageTitle}>
            <Sparkles size={28} style={{ color: '#2563eb' }} />
            Clinical Patient Dashboard
          </h1>
          <p className={styles.pageSubtitle}>
            Real-time EMR triage, demographic surveillance, and comprehensive patient management hub
          </p>
        </div>

        <div className={styles.topButtons}>
          <button className={styles.btnRefresh} onClick={() => showToast('Synced real-time with Hospital EMR database!')}>
            <RefreshCw size={16} /> Sync EMR Live
          </button>
          <button className={styles.btnExport} onClick={handleExport}>
            <Download size={16} /> Export Registry
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Users size={28} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalPatients}</span>
            <span className={styles.statLabel}>Total Active Census</span>
            <span className={styles.statSub}>
              <CheckCircle2 size={13} /> All verified records
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <ShieldCheck size={28} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{corporatePatients}</span>
            <span className={styles.statLabel}>Corporate / Insured</span>
            <span className={styles.statSub} style={{ color: '#16a34a' }}>
              <Building size={13} /> {totalPatients ? Math.round((corporatePatients / totalPatients) * 100) : 0}% coverage rate
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
            <Award size={28} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{vipPatients}</span>
            <span className={styles.statLabel}>VIP & Priority Care</span>
            <span className={styles.statSub} style={{ color: '#d97706' }}>
              <Sparkles size={13} /> Specialized protocol
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fee2e2', color: '#dc2626' }}>
            <HeartPulse size={28} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{chronicOrCritical.length}</span>
            <span className={styles.statLabel}>High Risk / Chronic</span>
            <span className={styles.statSub} style={{ color: '#dc2626' }}>
              <AlertTriangle size={13} /> Active surveillance
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsNav}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'roster' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('roster')}
        >
          <ClipboardList size={17} />
          <span>Live Clinical Roster</span>
          <span className={styles.tabBadge}>{filteredPatients.length}</span>
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'critical' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('critical')}
        >
          <ShieldAlert size={17} style={{ color: '#dc2626' }} />
          <span>High-Risk & Chronic Surveillance</span>
          <span className={styles.tabBadge} style={{ background: '#fee2e2', color: '#dc2626' }}>
            {chronicOrCritical.length}
          </span>
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'analytics' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart2 size={17} />
          <span>Demographics & Blood Bank Demand</span>
        </button>
      </div>

      {/* TAB 1: LIVE CLINICAL ROSTER */}
      {activeTab === 'roster' && (
        <div className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <Users size={20} style={{ color: '#2563eb' }} />
              Active Patient Directory ({filteredPatients.length})
            </h2>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/patients/list')}>
              Open Full Interactive Sheet <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Filtering Bar */}
          <div className={styles.filterSection}>
            <div className={styles.searchBox}>
              <Search size={17} style={{ color: '#94a3b8' }} />
              <input 
                type="text" 
                className={styles.searchInput}
                placeholder="Search patient name, ID, condition..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.categoryPills}>
              {['All', 'General', 'Corporate / Insurance', 'VIP / Priority', 'Senior Citizen'].map(cat => (
                <button
                  key={cat}
                  className={`${styles.pillBtn} ${selectedCategory === cat ? styles.pillBtnActive : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}

              <select 
                className={styles.bloodFilter} 
                value={selectedBlood} 
                onChange={(e) => setSelectedBlood(e.target.value)}
              >
                <option value="All">🩸 All Blood Groups</option>
                {bloodGroups.map(bg => <option key={bg} value={bg}>Blood: {bg}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>PATIENT</th>
                  <th>PERMANENT REG NO. / ID</th>
                  <th>GENDER / DOB</th>
                  <th>BLOOD</th>
                  <th>CATEGORY & COVERAGE</th>
                  <th>KNOWN CONDITIONS / TRIAGE</th>
                  <th>TRIAGE STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                      <AlertTriangle size={32} style={{ color: '#94a3b8', margin: '0 auto 10px', display: 'block' }} />
                      <div style={{ fontWeight: 700, fontSize: 16 }}>No clinical records matched your search filters</div>
                      <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Try clearing keywords or switching category filters</div>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map(p => {
                    const initials = (p.fullName || 'P').split(' ').map(w => w[0]).join('').slice(0, 2);
                    const isFemale = p.gender === 'Female';
                    
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className={`${styles.patAvatar} ${isFemale ? styles.patAvatarFemale : ''}`}>
                              {initials}
                            </div>
                            <div>
                              <div className={styles.patName}>{p.fullName || 'Unnamed Patient'}</div>
                              <div className={styles.patSub}>Dr. {p.referringDoctor || 'Walk-in / Direct'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: 6, width: 'fit-content', border: '1px solid #bbf7d0', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                              {p.regNo || `PRN-2026-${(p.id || '').replace(/\D/g, '')}`}
                            </span>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/patients/details?id=${p.id}`); }} className={styles.idLink} style={{ fontSize: 12 }}>
                              #{p.id}
                            </a>
                          </div>
                          <div className={styles.patSub} style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <Phone size={12} style={{ color: '#64748b' }} /> +91 {p.phone || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#334155' }}>{p.gender || 'Specified'}</div>
                          <div className={styles.patSub}>{p.dob || 'DOB unknown'}</div>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${getBloodBadgeClass(p.bloodGroup)}`}>
                            <Droplets size={12} /> {p.bloodGroup || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{p.patientCategory || 'General'}</div>
                          {p.insuranceProvider && (
                            <div className={styles.patSub} style={{ color: '#2563eb', fontWeight: 600 }}>
                              🛡️ {p.insuranceProvider}
                            </div>
                          )}
                        </td>
                        <td>
                          {p.conditions || (p.allergies && p.allergies.length > 0) ? (
                            <div>
                              {p.conditions && (
                                <span className={`${styles.badge} ${styles.badgeRed}`} style={{ marginRight: 6, marginBottom: 4 }}>
                                  ⚠️ {p.conditions}
                                </span>
                              )}
                              {p.allergies && p.allergies.length > 0 && (
                                <span className={`${styles.badge} ${styles.badgeYellow}`}>
                                  💊 Allergy: {p.allergies.join(', ')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgeGreen}`}>
                              🟢 No Known Chronic
                            </span>
                          )}
                        </td>
                        <td>
                          <div 
                            className={`${styles.statusPill} ${getStatusClass(p.status)}`}
                            onClick={() => handleStatusToggle(p)}
                            title="Click to toggle patient triage status"
                          >
                            <span className={styles.pulseDot} />
                            <span>{p.status || 'Active'}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button className={styles.actionBtn} onClick={() => navigate(`/patients/details?id=${p.id}`)} title="View Medical EMR Sheet">
                              <Eye size={16} style={{ color: '#2563eb' }} />
                            </button>
                            <button className={styles.actionBtn} onClick={() => navigate(`/patients/manage?id=${p.id}`)} title="Edit Clinical Record">
                              <Edit2 size={16} style={{ color: '#475569' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HIGH-RISK & CHRONIC SURVEILLANCE */}
      {activeTab === 'critical' && (
        <div className={styles.mainCard}>
          <div className={styles.cardHeader} style={{ background: '#fef2f2', borderBottomColor: '#fecaca' }}>
            <h2 className={styles.cardTitle} style={{ color: '#991b1b' }}>
              <ShieldAlert size={22} style={{ color: '#dc2626' }} />
              High-Risk & Chronic Condition Surveillance Grid ({chronicOrCritical.length} patients flagged)
            </h2>
            <span className={`${styles.badge} ${styles.badgeRed}`} style={{ fontSize: 13, padding: '6px 14px' }}>
              ⚠️ Active Clinical Alert Protocol
            </span>
          </div>

          <div className={styles.criticalGrid}>
            {chronicOrCritical.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <ShieldCheck size={48} style={{ color: '#10b981', margin: '0 auto 12px', display: 'block' }} />
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>All Clear</h3>
                <p style={{ margin: 0 }}>No patients are currently flagged for critical care or high-risk chronic conditions.</p>
              </div>
            ) : (
              chronicOrCritical.map(p => (
                <div key={p.id} className={styles.criticalCard}>
                  <div className={styles.criticalHeader}>
                    <div className={styles.criticalTitle}>
                      <span className={`${styles.patAvatar} ${p.gender === 'Female' ? styles.patAvatarFemale : ''}`} style={{ width: 36, height: 36, fontSize: 13 }}>
                        {(p.fullName || 'P').slice(0, 2).toUpperCase()}
                      </span>
                      <span>{p.fullName || 'Patient'}</span>
                    </div>
                    <span className={`${styles.badge} ${getStatusClass(p.status)}`}>
                      <span className={styles.pulseDot} /> {p.status || 'Flagged'}
                    </span>
                  </div>

                  <div className={styles.criticalInfoRow}>
                    <span>Patient ID:</span>
                    <strong>#{p.id}</strong>
                  </div>
                  <div className={styles.criticalInfoRow}>
                    <span>Blood Group & Age:</span>
                    <strong>{p.bloodGroup || 'N/A'} • {p.gender}</strong>
                  </div>
                  <div className={styles.criticalInfoRow}>
                    <span>Emergency Contact:</span>
                    <strong>{p.emergencyContactName || p.guardianName || 'N/A'} ({p.emergencyContactPhone || 'N/A'})</strong>
                  </div>

                  <div className={styles.conditionBox}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <AlertTriangle size={15} /> <strong>Flagged Clinical Diagnoses:</strong>
                    </div>
                    <div>{p.conditions || 'No primary diagnosis recorded'}</div>
                    {p.allergies && p.allergies.length > 0 && (
                      <div style={{ marginTop: 6, color: '#b45309' }}>
                        💊 Severe Allergies: <strong>{p.allergies.join(', ')}</strong>
                      </div>
                    )}
                  </div>

                  <div className={styles.criticalActions}>
                    <button className={styles.btnActionPrimary} onClick={() => navigate(`/patients/details?id=${p.id}`)}>
                      <Eye size={15} /> Full EMR Sheet
                    </button>
                    <button className={styles.btnActionSec} onClick={() => navigate(`/rooms/assign`)}>
                      Bed Assign
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS & DEMOGRAPHICS */}
      {activeTab === 'analytics' && (
        <div className={styles.analyticsGrid}>
          {/* Left Column: Blood Bank Demand Grid */}
          <div className={styles.analyticsCard}>
            <h3 className={styles.analyticsTitle}>
              <Droplets size={22} style={{ color: '#dc2626' }} />
              Blood Bank Inventory Readiness & Demand Grid
            </h3>
            <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 20 }}>
              Real-time distribution of registered patient blood types to guide emergency blood bank reserves and surgical triage.
            </p>

            <div className={styles.bloodBankGrid}>
              {bloodGroups.map(bg => (
                <div key={bg} className={styles.bloodBox}>
                  <div className={styles.bloodType}>{bg}</div>
                  <div className={styles.bloodCount}>{bloodCounts[bg] || 0}</div>
                  <div className={styles.bloodLabel}>Patients Registered</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Demographics Bar & Category Stats */}
          <div className={styles.analyticsCard}>
            <h3 className={styles.analyticsTitle}>
              <BarChart2 size={22} style={{ color: '#2563eb' }} />
              Gender Demographics & Coverage
            </h3>

            <div className={styles.genderBarContainer}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800 }}>
                <span>Gender Distribution</span>
                <span style={{ color: '#64748b', fontSize: 13 }}>Total: {totalPatients}</span>
              </div>

              <div className={styles.genderBar}>
                <div 
                  className={styles.barMale} 
                  style={{ width: `${totalPatients ? (malePatients / totalPatients) * 100 : 0}%` }}
                  title={`Male: ${malePatients}`}
                />
                <div 
                  className={styles.barFemale} 
                  style={{ width: `${totalPatients ? (femalePatients / totalPatients) * 100 : 0}%` }}
                  title={`Female: ${femalePatients}`}
                />
                <div 
                  className={styles.barOther} 
                  style={{ width: `${totalPatients ? (otherPatients / totalPatients) * 100 : 0}%` }}
                  title={`Other: ${otherPatients}`}
                />
              </div>

              <div className={styles.genderLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#3b82f6' }} />
                  <span>Male ({totalPatients ? Math.round((malePatients / totalPatients) * 100) : 0}%)</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#ec4899' }} />
                  <span>Female ({totalPatients ? Math.round((femalePatients / totalPatients) * 100) : 0}%)</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#f59e0b' }} />
                  <span>Other ({totalPatients ? Math.round((otherPatients / totalPatients) * 100) : 0}%)</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#eff6ff', borderRadius: 16, padding: 18, border: '1px solid #bfdbfe' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1e40af', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} /> Corporate Insurance Penetration
              </h4>
              <p style={{ margin: 0, fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>
                <strong>{corporatePatients} patients</strong> ({totalPatients ? Math.round((corporatePatients / totalPatients) * 100) : 0}%) are covered under active insurance policies or corporate packages (e.g. Star Health, Comprehensive).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
