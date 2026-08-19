import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plus, Trash2, Edit2, Check, X, Search, Building2,
  Users, ChevronDown, Info, AlertCircle
} from 'lucide-react';
import styles from './DeptDesig.module.css';

const DEPT_COLORS = [
  '#2563eb','#7c3aed','#db2777','#ea580c','#16a34a',
  '#0891b2','#d97706','#dc2626','#059669','#6366f1',
];
function deptColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % DEPT_COLORS.length;
  return DEPT_COLORS[h];
}
function initials(name = '') {
  return name.split(/\s+/).map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
}

export default function DepartmentManager() {
  const { departments, setDepartments, designations, doctors, nurses } = useApp();
  const [search, setSearch] = useState('');
  const [newDept, setNewDept] = useState('');
  const [editItem, setEditItem] = useState(null); // { idx, val }
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedDept, setExpandedDept] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredDepts = useMemo(() =>
    (departments || []).filter(d =>
      !search || d.toLowerCase().includes(search.toLowerCase())
    ), [departments, search]);

  const handleAdd = () => {
    const val = newDept.trim();
    if (!val) return;
    if (departments.includes(val)) { showToast('Department already exists', 'error'); return; }
    setDepartments([...departments, val]);
    setNewDept('');
    showToast(`Department "${val}" added`);
  };

  const handleEdit = (idx, oldVal) => setEditItem({ idx, val: oldVal, original: oldVal });
  const handleEditSave = () => {
    if (!editItem) return;
    const val = editItem.val.trim();
    if (!val || val === editItem.original) { setEditItem(null); return; }
    if (departments.includes(val)) { showToast('Department already exists', 'error'); return; }
    const updated = [...departments];
    updated[editItem.idx] = val;
    setDepartments(updated);
    setEditItem(null);
    showToast(`Renamed to "${val}"`);
  };

  const handleDelete = (dept) => {
    setDepartments(departments.filter(d => d !== dept));
    setDeleteConfirm(null);
    showToast(`Department "${dept}" deleted`, 'info');
  };

  // Count doctors/nurses per dept
  const doctorsInDept = (dept) => (doctors || []).filter(d => d.department === dept).length;
  const nursesInDept = (dept) => (nurses || []).filter(n => n.department === dept).length;

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : toast.type === 'info' ? styles.toastInfo : ''}`}>
          {toast.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon} style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)' }}>
            <Building2 size={20} />
          </div>
          <div>
            <h1 className={styles.title}>Department Management</h1>
            <p className={styles.subtitle}>Add, rename or remove hospital departments</p>
          </div>
        </div>
        <div className={styles.headerBadge}>
          <Building2 size={13} /> {departments.length} Departments
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: '#2563eb' }}>{departments.length}</div>
          <div className={styles.statLbl}>Total Departments</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: '#7c3aed' }}>{(doctors||[]).length}</div>
          <div className={styles.statLbl}>Doctors Mapped</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: '#0891b2' }}>{(nurses||[]).length}</div>
          <div className={styles.statLbl}>Nurses Mapped</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: '#16a34a' }}>{(designations||[]).length}</div>
          <div className={styles.statLbl}>Designations</div>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Left — Add panel */}
        <div className={styles.leftPanel}>
          <div className={styles.panelTitle}><Plus size={14} /> Add Department</div>
          <input
            className={styles.addInput}
            placeholder="e.g. Cardiology, ENT, Radiology..."
            value={newDept}
            onChange={e => setNewDept(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button className={styles.addBtn} onClick={handleAdd} disabled={!newDept.trim()}>
            <Plus size={14} /> Add Department
          </button>
          <div className={styles.tipBox}>
            <Info size={12} />
            Departments are used for doctor/nurse assignment, IP patient routing, and room allocation.
          </div>
        </div>

        {/* Right — List */}
        <div className={styles.rightPanel}>
          <div className={styles.listHeader}>
            <div className={styles.searchWrap}>
              <Search size={13} className={styles.searchIcon} />
              <input className={styles.searchInput} placeholder="Search departments..."
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className={styles.clearBtn} onClick={() => setSearch('')}><X size={12} /></button>}
            </div>
            <span className={styles.listCount}>{filteredDepts.length} of {departments.length}</span>
          </div>

          <div className={styles.deptList}>
            {filteredDepts.length === 0 ? (
              <div className={styles.emptyState}>
                <Building2 size={36} strokeWidth={1.2} style={{ color: '#cbd5e1', marginBottom: 10 }} />
                <div style={{ color: '#64748b', fontSize: 14 }}>No departments found</div>
              </div>
            ) : filteredDepts.map((dept, idx) => {
              const realIdx = departments.indexOf(dept);
              const isEditing = editItem?.idx === realIdx;
              const isExpanded = expandedDept === dept;
              const dCount = doctorsInDept(dept);
              const nCount = nursesInDept(dept);
              return (
                <div key={dept} className={styles.deptRow}>
                  <div className={styles.deptRowMain}>
                    <div className={styles.deptAvatar} style={{ background: deptColor(dept) }}>
                      {initials(dept)}
                    </div>
                    <div className={styles.deptInfo}>
                      {isEditing ? (
                        <input
                          className={styles.editInput}
                          value={editItem.val}
                          autoFocus
                          onChange={e => setEditItem({ ...editItem, val: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditItem(null); }}
                        />
                      ) : (
                        <div className={styles.deptName}>{dept}</div>
                      )}
                      <div className={styles.deptMeta}>
                        {dCount > 0 && <span><Users size={10} /> {dCount} Dr</span>}
                        {nCount > 0 && <span><Users size={10} /> {nCount} Nurse</span>}
                        {dCount === 0 && nCount === 0 && <span style={{ color: '#94a3b8' }}>No staff assigned</span>}
                      </div>
                    </div>
                    <div className={styles.deptActions}>
                      {isEditing ? (
                        <>
                          <button className={styles.iconBtn} style={{ color: '#16a34a' }} onClick={handleEditSave}><Check size={14} /></button>
                          <button className={styles.iconBtn} onClick={() => setEditItem(null)}><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button className={styles.iconBtn} onClick={() => setExpandedDept(isExpanded ? null : dept)}>
                            <ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
                          </button>
                          <button className={styles.iconBtn} style={{ color: '#2563eb' }} onClick={() => handleEdit(realIdx, dept)}><Edit2 size={13} /></button>
                          <button className={styles.iconBtn} style={{ color: '#dc2626' }} onClick={() => setDeleteConfirm(dept)}><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded staff list */}
                  {isExpanded && (
                    <div className={styles.deptExpanded}>
                      {[...(doctors||[]).filter(d=>d.department===dept), ...(nurses||[]).filter(n=>n.department===dept)].length === 0 ? (
                        <div className={styles.expandedEmpty}>No staff currently assigned to this department.</div>
                      ) : (
                        <>
                          {(doctors||[]).filter(d=>d.department===dept).map(d=>(
                            <div key={d.id} className={styles.staffChip}><Users size={10} style={{color:'#2563eb'}}/> {d.name} <span className={styles.staffRole}>Doctor</span></div>
                          ))}
                          {(nurses||[]).filter(n=>n.department===dept).map(n=>(
                            <div key={n.id} className={styles.staffChip}><Users size={10} style={{color:'#0891b2'}}/> {n.name} <span className={styles.staffRole}>Nurse</span></div>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* Delete confirm inline */}
                  {deleteConfirm === dept && (
                    <div className={styles.deleteConfirm}>
                      <AlertCircle size={14} style={{ color: '#dc2626' }} />
                      <span>Delete <strong>{dept}</strong>? This cannot be undone.</span>
                      <button className={styles.delConfirmBtn} onClick={() => handleDelete(dept)}>Delete</button>
                      <button className={styles.delCancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
