import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, Phone, Mail, Award, 
  CalendarDays, Building2, BookOpen, User, Edit2, 
  MoreVertical, UserPlus, Stethoscope, RefreshCw, 
  Download, Eye, Table as TableIcon, LayoutGrid, ChevronRight, Check, CheckCircle2, Trash2, ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './NursesList.module.css';

const nurseDepartments = [
  'ICU & Critical Care', 'Emergency Ward', 'Pediatric Ward', 
  'Cardiology OPD', 'General Medicine', 'Orthopedics Ward', 
  'Maternity Ward', 'Surgical Ward', 'OPD Clinic'
];

function NurseAvatar({ name = '', photo, size = 40, className }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['avatar-blue', 'avatar-green', 'avatar-purple', 'avatar-orange'];
  const idx = name.charCodeAt(0) % colors.length;
  if (photo) {
    return <img src={photo} alt={name} className={className || styles.docPhoto} style={{ width: size, height: size }} />;
  }
  return (
    <div className={`avatar ${colors[idx]} ${className || styles.docPhoto}`} style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials || 'N'}
    </div>
  );
}

export default function NursesList() {
  const { nurses, updateNurse, deleteNurse } = useApp();
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

  const filteredNurses = useMemo(() => {
    return (nurses || []).filter(nurse => {
      if (!nurse) return false;
      const matchSearch = 
        (nurse.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (nurse.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (nurse.email && nurse.email.toLowerCase().includes(search.toLowerCase()));
      
      const matchDept = !deptFilter || nurse.department === deptFilter;
      const matchStatus = !statusFilter || nurse.status === statusFilter;
      
      let matchExp = true;
      const expYears = parseInt(nurse.experience || '5', 10);
      if (expFilter === 'junior') matchExp = expYears <= 3;
      else if (expFilter === 'senior') matchExp = expYears > 3 && expYears <= 7;
      else if (expFilter === 'expert') matchExp = expYears > 7;

      return matchSearch && matchDept && matchStatus && matchExp;
    });
  }, [nurses, search, deptFilter, statusFilter, expFilter]);

  const totalPages = Math.ceil(filteredNurses.length / itemsPerPage) || 1;
  const paginatedNurses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNurses.slice(start, start + itemsPerPage);
  }, [filteredNurses, currentPage]);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedNurses.map(n => n.id));
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
    const headers = ['ID', 'Name', 'Department', 'Qualification', 'Contact', 'Email', 'Shift', 'Experience', 'Status'];
    const rows = filteredNurses.map(n => [
      n.id, `"${n.name || ''}"`, `"${n.department || ''}"`, `"${n.qualification || ''}"`, 
      `"${n.contact || ''}"`, `"${n.email || ''}"`, `"${n.shift || ''}"`, n.experience || '5', n.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'nurses_roster_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast('Successfully exported nurse roster list to CSV file!');
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggleStatus = async (nurse) => {
    const newStatus = nurse.status === 'Active' ? 'On Leave' : 'Active';
    await updateNurse(nurse.id, { ...nurse, status: newStatus });
    setOpenMenuId(null);
    setToast(`Updated Nurse ${nurse.name} status to ${newStatus}.`);
    setTimeout(() => setToast(null), 4000);
  };

  const handleDeleteNurse = async (nurse) => {
    setOpenMenuId(null);
    if (window.confirm(`Are you sure you want to remove Nurse ${nurse.name} from the clinic roster?`)) {
      await deleteNurse(nurse.id);
      setToast(`Removed Nurse ${nurse.name} from directory.`);
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
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/nurses/all" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Nurses</Link> <ChevronRight size={14} /> <span>Nurse List</span>
          </div>
          <h1 className={styles.pageTitle}>Nurse List</h1>
        </div>

        <div className={styles.topButtons}>
          <button className={styles.btnRefresh} onClick={() => window.location.reload()}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className={styles.btnExport} onClick={handleExport}>
            <Download size={15} /> Export As
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/nurses/manage')}>
            <UserPlus size={16} /> Add Nurse
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
              placeholder="Nurse Name or ID..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Ward / Unit</label>
          <select 
            className={styles.filterSelect}
            value={deptFilter}
            onChange={e => { setDeptFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Wards / Units</option>
            {nurseDepartments.map(d => (
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
            <option value="junior">1 - 3 Years</option>
            <option value="senior">3 - 7 Years</option>
            <option value="expert">7+ Years (Senior RN)</option>
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
      {filteredNurses.length === 0 ? (
        <div className={styles.emptyState}>
          <Stethoscope size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
          <h3>No Nurses Match Filters</h3>
          <p style={{ color: '#64748b', marginTop: 6 }}>Try adjusting your search query or ward filters.</p>
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
                      checked={selectedIds.length === paginatedNurses.length && paginatedNurses.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>NURSE ID</th>
                  <th>PHOTO</th>
                  <th>NAME</th>
                  <th>WARD/UNIT</th>
                  <th>JOINING DATE</th>
                  <th>EXP.</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNurses.map(nurse => {
                  const isSelected = selectedIds.includes(nurse.id);
                  const isLeave = nurse.status === 'On Leave';
                  const isInactive = nurse.status === 'Inactive';
                  const isMenuOpen = openMenuId === nurse.id;
                  const formattedDate = nurse.joiningDate ? new Date(nurse.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '12 Oct 2021';

                  return (
                    <tr key={nurse.id} style={{ background: isSelected ? '#eff6ff' : '' }}>
                      <td className={styles.checkboxCell}>
                        <input 
                          type="checkbox" 
                          className={styles.checkbox}
                          checked={isSelected}
                          onChange={() => toggleSelectOne(nurse.id)}
                        />
                      </td>
                      <td>
                        <a href={`#`} onClick={(e) => { e.preventDefault(); navigate(`/nurses/details?id=${nurse.id}`); }} className={styles.idLink}>
                          #{nurse.id}
                        </a>
                      </td>
                      <td>
                        <NurseAvatar name={nurse.name} photo={nurse.photo} />
                      </td>
                      <td>
                        <div className={styles.docName}>{nurse.name}</div>
                        <div className={styles.docEmail}>{nurse.email || `${(nurse.name || 'nurse').toLowerCase().replace(/\s+/g, '.')}@clinic.in`}</div>
                      </td>
                      <td>
                        <div className={styles.deptTitle}>{nurse.department}</div>
                        <div className={styles.deptSub}>{nurse.qualification || 'Staff Nurse, RN'}</div>
                      </td>
                      <td className={styles.dateText}>
                        {formattedDate}
                      </td>
                      <td className={styles.expText}>
                        {nurse.experience ? `${nurse.experience} Yrs` : '5 Yrs'}
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${isLeave ? styles.statusLeave : isInactive ? styles.statusInactive : styles.statusActive}`}>
                          {(nurse.status || 'Active').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ position: 'relative' }}>
                        <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                          <button className={styles.actionBtn} onClick={() => navigate(`/nurses/manage?id=${nurse.id}`)} title="Edit Nurse">
                            <Edit2 size={16} />
                          </button>
                          <button className={styles.actionBtn} onClick={() => navigate(`/nurses/details?id=${nurse.id}`)} title="View Profile">
                            <Eye size={16} />
                          </button>
                          <button 
                            className={styles.actionBtn} 
                            title="More Options"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : nurse.id); }}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>

                        {/* 3-Dots Dropdown Menu */}
                        {isMenuOpen && (
                          <div style={{ position: 'absolute', right: 16, top: 48, background: 'white', border: '1px solid #cbd5e1', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 50, width: 210, overflow: 'hidden', padding: '6px 0', textAlign: 'left' }}>
                            <button 
                              onClick={() => navigate(`/nurses/details?id=${nurse.id}`)} 
                              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', fontSize: 13, color: '#0f172a', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                            >
                              <Eye size={16} style={{ color: '#2563eb' }} /> View Full Profile
                            </button>
                            <button 
                              onClick={() => navigate(`/nurses/manage?id=${nurse.id}`)} 
                              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', fontSize: 13, color: '#0f172a', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                            >
                              <Edit2 size={16} style={{ color: '#475569' }} /> Edit Credentials
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(nurse)} 
                              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', fontSize: 13, color: '#0f172a', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                            >
                              <ShieldAlert size={16} style={{ color: nurse.status === 'Active' ? '#d97706' : '#16a34a' }} />
                              {nurse.status === 'Active' ? 'Mark On Leave' : 'Mark Active'}
                            </button>
                            <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }}></div>
                            <button 
                              onClick={() => handleDeleteNurse(nurse)} 
                              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', fontSize: 13, color: '#dc2626', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                            >
                              <Trash2 size={16} /> Delete Nurse
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
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredNurses.length)} of {filteredNurses.length} entries
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
          {filteredNurses.map(nurse => (
            <div key={nurse.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.profileHeader}>
                  <NurseAvatar name={nurse.name} photo={nurse.photo} size={54} />
                  <div>
                    <h3 className={styles.docName} style={{ fontSize: 16 }}>{nurse.name}</h3>
                    <span className={styles.deptSub}>{nurse.department} • {nurse.qualification || 'Staff Nurse'}</span>
                  </div>
                </div>
                <span className={styles.idPill}>#{nurse.id}</span>
              </div>

              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <div className={styles.detailIconBox}><Phone size={15} /></div>
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>Contact No</span>
                    <span className={styles.detailValue}>{nurse.contact || '+91 98765 43210'}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailIconBox}><Award size={15} /></div>
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>Ward / Unit</span>
                    <span className={styles.detailValue}>{nurse.department}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailIconBox}><Mail size={15} /></div>
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>Email</span>
                    <span className={styles.detailValue} style={{ fontSize: 11 }}>{nurse.email || 'nurse@clinic.in'}</span>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <div className={styles.detailIconBox}><CalendarDays size={15} /></div>
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>Shift</span>
                    <span className={styles.detailValue}>{nurse.shift || 'Morning (06:00 - 14:00)'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button className={styles.btnView} onClick={() => navigate(`/nurses/details?id=${nurse.id}`)}>
                  <Eye size={15} /> View Profile
                </button>
                <button className={styles.btnEdit} onClick={() => navigate(`/nurses/manage?id=${nurse.id}`)}>
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
