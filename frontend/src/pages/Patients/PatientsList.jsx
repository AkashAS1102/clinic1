import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, Phone, Mail, Award, 
  CalendarDays, Building2, BookOpen, User, Edit2, 
  Download, Eye, Table as TableIcon, LayoutGrid, ChevronRight, Check, CheckCircle2, ShieldAlert, HeartPulse, MoreVertical, UserPlus, Stethoscope, RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './PatientsList.module.css';

function PatientAvatar({ name = '', photo, size = 40, className }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['avatar-blue', 'avatar-green', 'avatar-purple', 'avatar-orange'];
  const idx = name.charCodeAt(0) % colors.length;
  if (photo) {
    return <img src={photo} alt={name} className={className || styles.docPhoto} style={{ width: size, height: size }} />;
  }
  return (
    <div className={`avatar ${colors[idx]} ${className || styles.docPhoto}`} style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials || 'P'}
    </div>
  );
}

export default function PatientsList() {
  const { patients } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [bgFilter, setBgFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toast, setToast] = useState(null);
  const itemsPerPage = 10;

  const filteredPatients = useMemo(() => {
    return (patients || []).filter(p => {
      if (!p) return false;
      const matchSearch = 
        (p.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.phone && p.phone.includes(search));
      
      const matchGender = !genderFilter || p.gender === genderFilter;
      const matchBg = !bgFilter || p.bloodGroup === bgFilter;
      const matchCond = !conditionFilter || (p.conditions && p.conditions.toLowerCase().includes(conditionFilter.toLowerCase()));

      return matchSearch && matchGender && matchBg && matchCond;
    });
  }, [patients, search, genderFilter, bgFilter, conditionFilter]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(start, start + itemsPerPage);
  }, [filteredPatients, currentPage]);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedPatients.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const headers = ['ID', 'FullName', 'Phone', 'Gender', 'DOB', 'BloodGroup', 'Conditions', 'ReferringDoctor'];
    const rows = filteredPatients.map(p => [
      p.id, `"${p.fullName || ''}"`, `"${p.phone || ''}"`, `"${p.gender || ''}"`, 
      `"${p.dob || ''}"`, `"${p.bloodGroup || ''}"`, `"${p.conditions || ''}"`, `"${p.referringDoctor || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'patients_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast('Successfully exported patient records to CSV file!');
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className={styles.page} onClick={() => openMenuId && setOpenMenuId(null)}>
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 28, background: '#10b981', color: 'white', padding: '14px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* Breadcrumb & Top Bar */}
      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/patients/all" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Patients</Link> <ChevronRight size={14} /> <span>Patients List</span>
          </div>
          <h1 className={styles.pageTitle}>Patients List</h1>
        </div>

        <div className={styles.topButtons}>
          <button className={styles.btnRefresh} onClick={() => window.location.reload()}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className={styles.btnExport} onClick={handleExport}>
            <Download size={15} /> Export As
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/patients/manage')}>
            <UserPlus size={16} /> Register Patient
          </button>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className={styles.filterCard}>
        <div className={styles.filterGroup} style={{ flex: '1 1 280px' }}>
          <label className={styles.filterLabel}>Search Name/Phone/ID</label>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              className={styles.searchInput}
              placeholder="Patient Name, Phone, or ID..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {showFilters && (
          <>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Gender</label>
              <select 
                className={styles.filterSelect}
                value={genderFilter}
                onChange={e => { setGenderFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Blood Group</label>
              <select 
                className={styles.filterSelect}
                value={bgFilter}
                onChange={e => { setBgFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">All Groups</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Condition</label>
              <select 
                className={styles.filterSelect}
                value={conditionFilter}
                onChange={e => { setConditionFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Any Condition</option>
                <option value="Hypertension">Hypertension</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Asthma">Asthma</option>
                <option value="Thyroid">Thyroid</option>
              </select>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
          {/* View Mode Toggle */}
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <TableIcon size={15} /> Table
            </button>
            <button 
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
            >
              <LayoutGrid size={15} /> Cards
            </button>
          </div>

          <button 
            className={`${styles.iconBtn} ${showFilters ? styles.iconBtnActive : ''}`} 
            title="Toggle Filters" 
            onClick={() => setShowFilters(!showFilters)}
            style={{ background: showFilters ? '#e0e7ff' : 'transparent', color: showFilters ? '#4f46e5' : '#64748b' }}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Content View: Table or Card Grid */}
      {filteredPatients.length === 0 ? (
        <div className={styles.emptyState}>
          <HeartPulse size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
          <h3>No Patients Match Filters</h3>
          <p style={{ color: '#64748b', marginTop: 6 }}>Try adjusting your search query or filter criteria.</p>
          <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => { setSearch(''); setGenderFilter(''); setBgFilter(''); setConditionFilter(''); }}>
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className={styles.tableCard}>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkboxCell}>
                    <input 
                      type="checkbox" 
                      className={styles.checkbox}
                      checked={selectedIds.length === paginatedPatients.length && paginatedPatients.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>PERMANENT REG NO. / ID</th>
                  <th>PHOTO</th>
                  <th>FULL NAME</th>
                  <th>CONTACT NO.</th>
                  <th>GENDER / DOB</th>
                  <th>BLOOD GROUP</th>
                  <th>CONDITIONS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map(patient => {
                  const isSelected = selectedIds.includes(patient.id);
                  const isMenuOpen = openMenuId === patient.id;

                  return (
                    <tr key={patient.id} style={{ background: isSelected ? '#eff6ff' : '' }}>
                      <td className={styles.checkboxCell}>
                        <input 
                          type="checkbox" 
                          className={styles.checkbox}
                          checked={isSelected}
                          onChange={() => toggleSelectOne(patient.id)}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: 6, width: 'fit-content', border: '1px solid #bbf7d0', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                            {patient.regNo || `PRN-2026-${(patient.id || '').replace(/\D/g, '')}`}
                          </span>
                          <a href={`#`} onClick={(e) => { e.preventDefault(); navigate(`/patients/details?id=${patient.id}`); }} className={styles.idLink} style={{ fontSize: 12 }}>
                            #{patient.id}
                          </a>
                        </div>
                      </td>
                      <td>
                        <PatientAvatar name={patient.fullName} photo={patient.photo} />
                      </td>
                      <td>
                        <div className={styles.docName}>{patient.fullName}</div>
                        <div className={styles.docEmail}>
                          <span style={{ fontWeight: 700, color: '#2563eb' }}>{patient.patientCategory || 'General'}</span> • Ref: {patient.referringDoctor || 'Direct'}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#334155' }}>
                        +91 {patient.phone || 'N/A'}
                      </td>
                      <td>
                        <div className={styles.deptTitle}>{patient.gender || 'Not specified'}</div>
                        <div className={styles.deptSub}>{patient.dob || 'Unknown DOB'}</div>
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${patient.bloodGroup ? styles.statusActive : styles.statusLeave}`}>
                          {patient.bloodGroup || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                          {patient.conditions || 'None reported'}
                        </div>
                      </td>
                      <td style={{ position: 'relative' }}>
                        <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                          <button 
                            className={styles.actionBtn} 
                            title="More Options"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : patient.id); }}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>

                        {/* 3-Dots Dropdown Menu */}
                        {isMenuOpen && (
                          <div style={{ position: 'absolute', right: 16, top: 48, background: 'white', border: '1px solid #cbd5e1', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 50, width: 200, overflow: 'hidden', padding: '6px 0', textAlign: 'left' }}>
                            <button 
                              onClick={() => navigate(`/patients/details?id=${patient.id}`)} 
                              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', fontSize: 13, color: '#0f172a', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                            >
                              <Eye size={16} style={{ color: '#2563eb' }} /> View Full Profile
                            </button>
                            <button 
                              onClick={() => navigate(`/patients/manage?id=${patient.id}`)} 
                              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', fontSize: 13, color: '#0f172a', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                            >
                              <Edit2 size={16} style={{ color: '#475569' }} /> Edit Patient Record
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className={styles.paginationFooter}>
            <div className={styles.paginationInfo}>
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} entries
            </div>

            <div className={styles.paginationButtons}>
              <button 
                className={styles.pageBtn} 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                ← Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button 
                className={styles.pageBtn} 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className={styles.grid}>
          {filteredPatients.map(patient => (
            <div key={patient.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.profileHeader}>
                  <PatientAvatar name={patient.fullName} photo={patient.photo} size={54} />
                  <div>
                    <h3 className={styles.docName} style={{ fontSize: 16 }}>{patient.fullName}</h3>
                    <span className={styles.deptSub}>
                      <strong style={{ color: '#2563eb' }}>{patient.patientCategory || 'General'}</strong> • {patient.gender} • DOB: {patient.dob || 'N/A'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 10, border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>
                    {patient.regNo || `PRN-2026-${(patient.id || '').replace(/\D/g, '')}`}
                  </span>
                  <span className={styles.idPill}>#{patient.id}</span>
                </div>
              </div>

              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <div className={styles.detailIconBox}><Phone size={15} /></div>
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>Contact No</span>
                    <span className={styles.detailValue}>+91 {patient.phone || 'N/A'}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailIconBox}><HeartPulse size={15} /></div>
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>Blood Group</span>
                    <span className={styles.detailValue}>{patient.bloodGroup || 'Unknown'}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailIconBox}><Award size={15} /></div>
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>Conditions</span>
                    <span className={styles.detailValue} style={{ fontSize: 12 }}>{patient.conditions || 'None reported'}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailIconBox}><Stethoscope size={15} /></div>
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>Referring Doc</span>
                    <span className={styles.detailValue}>{patient.referringDoctor || 'Direct / Walk-in'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button className={styles.btnView} onClick={() => navigate(`/patients/details?id=${patient.id}`)}>
                  <Eye size={15} /> View Profile
                </button>
                <button className={styles.btnEdit} onClick={() => navigate(`/patients/manage?id=${patient.id}`)}>
                  <Edit2 size={15} /> Edit Record
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
