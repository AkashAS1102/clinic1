import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, Phone, Mail, Award, 
  CalendarDays, Building2, BookOpen, User, Edit2, 
  MoreVertical, UserPlus, Stethoscope, RefreshCw, 
  Download, Eye, Table as TableIcon, LayoutGrid, ChevronRight, Check, CheckCircle2, Trash2, ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { departments } from '../../mockData';
import styles from './DoctorsList.module.css';

function DoctorAvatar({ name, photo, size = 40, className }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['avatar-blue', 'avatar-green', 'avatar-purple', 'avatar-orange'];
  const idx = name.charCodeAt(0) % colors.length;
  if (photo) {
    return <img src={photo} alt={name} className={className || styles.docPhoto} style={{ width: size, height: size }} />;
  }
  return (
    <div className={`avatar ${colors[idx]} ${className || styles.docPhoto}`} style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

export default function DoctorsList() {
  const { doctors, updateDoctor, deleteDoctor } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expFilter, setExpFilter] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toast, setToast] = useState(null);
  const itemsPerPage = 10;

  const filteredDoctors = useMemo(() => {
    return (doctors || []).filter(doc => {
      if (!doc) return false;
      const matchSearch = 
        (doc.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (doc.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (doc.email && doc.email.toLowerCase().includes(search.toLowerCase()));
      
      const matchDept = !deptFilter || doc.department === deptFilter;
      const matchStatus = !statusFilter || doc.status === statusFilter;
      
      let matchExp = true;
      if (expFilter === 'junior') matchExp = doc.fee <= 500;
      else if (expFilter === 'senior') matchExp = doc.fee > 500 && doc.fee <= 800;
      else if (expFilter === 'expert') matchExp = doc.fee > 800;

      return matchSearch && matchDept && matchStatus && matchExp;
    });
  }, [doctors, search, deptFilter, statusFilter, expFilter]);

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage) || 1;
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDoctors.slice(start, start + itemsPerPage);
  }, [filteredDoctors, currentPage]);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedDoctors.map(d => d.id));
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
    const headers = ['ID', 'Name', 'Department', 'Qualification', 'Contact', 'Email', 'Fee', 'Status'];
    const rows = filteredDoctors.map(d => [
      d.id, `"${d.name}"`, `"${d.department}"`, `"${d.qualification || ''}"`, 
      `"${d.contact || ''}"`, `"${d.email || ''}"`, d.fee || 600, d.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'doctors_roster_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast('Successfully exported doctor roster list to CSV file!');
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggleStatus = async (doc) => {
    const newStatus = doc.status === 'Active' ? 'On Leave' : 'Active';
    await updateDoctor(doc.id, { status: newStatus });
    setOpenMenuId(null);
    setToast(`Updated Dr. ${doc.name} status to ${newStatus}.`);
    setTimeout(() => setToast(null), 4000);
  };

  const handleDeleteDoctor = async (doc) => {
    setOpenMenuId(null);
    if (window.confirm(`Are you sure you want to remove Dr. ${doc.name} from the clinic roster?`)) {
      await deleteDoctor(doc.id);
      setToast(`Removed Dr. ${doc.name} from directory.`);
      setTimeout(() => setToast(null), 4000);
    }
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
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/doctors/all" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Doctors</Link> <ChevronRight size={14} /> <span>Doctor List</span>
          </div>
          <h1 className={styles.pageTitle}>Doctor List</h1>
        </div>

        <div className={styles.topButtons}>
          <button className={styles.btnRefresh} onClick={() => window.location.reload()}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className={styles.btnExport} onClick={handleExport}>
            <Download size={15} /> Export As
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/doctors/manage')}>
            <UserPlus size={16} /> Add Doctor
          </button>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className={styles.filterCard}>
        <div className={styles.filterGroup} style={{ flex: '1 1 280px' }}>
          <label className={styles.filterLabel}>Search ID/Name</label>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              className={styles.searchInput}
              placeholder="Doctor Name or ID..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Department</label>
          <select 
            className={styles.filterSelect}
            value={deptFilter}
            onChange={e => { setDeptFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select 
            className={styles.filterSelect}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Any Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Experience</label>
          <select 
            className={styles.filterSelect}
            value={expFilter}
            onChange={e => { setExpFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Ranges</option>
            <option value="junior">2 - 5 Years</option>
            <option value="senior">5 - 12 Years</option>
            <option value="expert">12+ Years (Senior Consultant)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
          {/* View Mode Toggle */}
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View (Like Screenshot 2)"
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

          <button className={styles.iconBtn} title="Reset All Filters" onClick={() => { setSearch(''); setDeptFilter(''); setStatusFilter(''); setExpFilter(''); }}>
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Content View: Table or Card Grid */}
      {filteredDoctors.length === 0 ? (
        <div className={styles.emptyState}>
          <Stethoscope size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
          <h3>No Doctors Match Filters</h3>
          <p style={{ color: '#64748b', marginTop: 6 }}>Try adjusting your search query or department filters.</p>
          <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => { setSearch(''); setDeptFilter(''); setStatusFilter(''); setExpFilter(''); }}>
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
                      checked={selectedIds.length === paginatedDoctors.length && paginatedDoctors.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>DOCTOR ID</th>
                  <th>PHOTO</th>
                  <th>NAME</th>
                  <th>DEPT/SPECIALTY</th>
                  <th>JOINING DATE</th>
                  <th>EXP.</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDoctors.map(doc => {
                  const isSelected = selectedIds.includes(doc.id);
                  const isLeave = doc.status === 'On Leave';
                  const isInactive = doc.status === 'Inactive';
                  const isMenuOpen = openMenuId === doc.id;

                  return (
                    <tr key={doc.id} style={{ background: isSelected ? '#eff6ff' : '' }}>
                      <td className={styles.checkboxCell}>
                        <input 
                          type="checkbox" 
                          className={styles.checkbox}
                          checked={isSelected}
                          onChange={() => toggleSelectOne(doc.id)}
                        />
                      </td>
                      <td>
                        <a href={`#`} onClick={(e) => { e.preventDefault(); navigate(`/doctors/details?id=${doc.id}`); }} className={styles.idLink}>
                          #{doc.id}
                        </a>
                      </td>
                      <td>
                        <DoctorAvatar name={doc.name} photo={doc.photo} />
                      </td>
                      <td>
                        <div className={styles.docName}>Dr. {doc.name}</div>
                        <div className={styles.docEmail}>{doc.email || `${doc.name.toLowerCase().replace(/\s+/g, '.')}@clinic.in`}</div>
                      </td>
                      <td>
                        <div className={styles.deptTitle}>{doc.department}</div>
                        <div className={styles.deptSub}>{doc.qualification || 'Senior Consultant'}</div>
                      </td>
                      <td className={styles.dateText}>
                        12 Oct 2021
                      </td>
                      <td className={styles.expText}>
                        {doc.experience ? '12.5 Yrs' : '8.5 Yrs'}
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${isLeave ? styles.statusLeave : isInactive ? styles.statusInactive : styles.statusActive}`}>
                          {doc.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ position: 'relative' }}>
                        <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                          <button className={styles.actionBtn} onClick={() => navigate(`/doctors/manage?id=${doc.id}`)} title="Edit Doctor">
                            <Edit2 size={16} />
                          </button>
                          <button className={styles.actionBtn} onClick={() => navigate(`/doctors/details?id=${doc.id}`)} title="View Profile">
                            <Eye size={16} />
                          </button>
                          <button 
                            className={styles.actionBtn} 
                            title="More Options"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : doc.id); }}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>

                        {/* 3-Dots Dropdown Menu */}
                        {isMenuOpen && (
                          <div style={{ position: 'absolute', right: 16, top: 48, background: 'white', border: '1px solid #cbd5e1', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 50, width: 210, overflow: 'hidden', padding: '6px 0', textAlign: 'left' }}>
                            <button 
                              onClick={() => navigate(`/doctors/details?id=${doc.id}`)} 
                              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', fontSize: 13, color: '#0f172a', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                            >
                              <Eye size={16} style={{ color: '#2563eb' }} /> View Full Profile
                            </button>
                            <button 
                              onClick={() => navigate(`/doctors/manage?id=${doc.id}`)} 
                              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', fontSize: 13, color: '#0f172a', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                            >
                              <Edit2 size={16} style={{ color: '#475569' }} /> Edit Credentials
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(doc)} 
                              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', fontSize: 13, color: '#0f172a', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                            >
                              <ShieldAlert size={16} style={{ color: doc.status === 'Active' ? '#d97706' : '#16a34a' }} />
                              {doc.status === 'Active' ? 'Mark On Leave' : 'Mark Active'}
                            </button>
                            <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }}></div>
                            <button 
                              onClick={() => handleDeleteDoctor(doc)} 
                              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', fontSize: 13, color: '#dc2626', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                            >
                              <Trash2 size={16} /> Delete Doctor
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
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredDoctors.length)} of {filteredDoctors.length} entries
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
          {filteredDoctors.map(doc => (
            <div key={doc.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.profileHeader}>
                  <DoctorAvatar name={doc.name} photo={doc.photo} size={54} />
                  <div>
                    <h3 className={styles.docName} style={{ fontSize: 16 }}>Dr. {doc.name}</h3>
                    <span className={styles.deptSub}>{doc.department} • {doc.qualification || 'Consultant'}</span>
                  </div>
                </div>
                <span className={styles.idPill}>#{doc.id}</span>
              </div>

              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <div className={styles.detailIconBox}><Phone size={15} /></div>
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>Contact No</span>
                    <span className={styles.detailValue}>{doc.contact || '+91 98765 43210'}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailIconBox}><Award size={15} /></div>
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>Specialty</span>
                    <span className={styles.detailValue}>{doc.department}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailIconBox}><Mail size={15} /></div>
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>Email</span>
                    <span className={styles.detailValue} style={{ fontSize: 11 }}>{doc.email || 'doctor@clinic.in'}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailIconBox}><CalendarDays size={15} /></div>
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>Schedule</span>
                    <span className={styles.detailValue}>{doc.timeSlot ? '09:00 - 17:00' : 'Full Day'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button className={styles.btnView} onClick={() => navigate(`/doctors/details?id=${doc.id}`)}>
                  <Eye size={15} /> View Profile
                </button>
                <button className={styles.btnEdit} onClick={() => navigate(`/doctors/manage?id=${doc.id}`)}>
                  <Edit2 size={15} /> Edit Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
