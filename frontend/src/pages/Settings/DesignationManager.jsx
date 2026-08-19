import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plus, Trash2, Edit2, Check, X, Search, Briefcase,
  Users, Info, AlertCircle, Tag
} from 'lucide-react';
import styles from './DeptDesig.module.css';

const DESIG_COLORS = [
  '#7c3aed','#2563eb','#0891b2','#16a34a','#d97706',
  '#dc2626','#db2777','#ea580c','#059669','#6366f1',
];
function desigColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % DESIG_COLORS.length;
  return DESIG_COLORS[h];
}
function initials(name = '') {
  return name.split(/\s+/).map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
}

export default function DesignationManager() {
  const { designations, setDesignations, departments, doctors, nurses } = useApp();
  const [search, setSearch] = useState('');
  const [newDesig, setNewDesig] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredDesigs = useMemo(() =>
    (designations || []).filter(d =>
      !search || d.toLowerCase().includes(search.toLowerCase())
    ), [designations, search]);

  const handleAdd = () => {
    const val = newDesig.trim();
    if (!val) return;
    if (designations.includes(val)) { showToast('Designation already exists', 'error'); return; }
    setDesignations([...designations, val]);
    setNewDesig('');
    showToast(`Designation "${val}" added`);
  };

  const handleEdit = (idx, oldVal) => setEditItem({ idx, val: oldVal, original: oldVal });
  const handleEditSave = () => {
    if (!editItem) return;
    const val = editItem.val.trim();
    if (!val || val === editItem.original) { setEditItem(null); return; }
    if (designations.includes(val)) { showToast('Designation already exists', 'error'); return; }
    const updated = [...designations];
    updated[editItem.idx] = val;
    setDesignations(updated);
    setEditItem(null);
    showToast(`Renamed to "${val}"`);
  };

  const handleDelete = (desig) => {
    setDesignations(designations.filter(d => d !== desig));
    setDeleteConfirm(null);
    showToast(`Designation "${desig}" deleted`, 'info');
  };

  // Staff count per designation
  const staffWithDesig = (desig) => [
    ...(doctors||[]).filter(d => d.designation === desig),
    ...(nurses||[]).filter(n => n.designation === desig),
  ];

  return (
    <div className={styles.page}>
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : toast.type === 'info' ? styles.toastInfo : ''}`}>
          {toast.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />} {toast.msg}
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon} style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
            <Briefcase size={20} />
          </div>
          <div>
            <h1 className={styles.title}>Designation Management</h1>
            <p className={styles.subtitle}>Manage job titles and designations for all hospital staff</p>
          </div>
        </div>
        <div className={styles.headerBadge} style={{ color: '#7c3aed', background: 'rgba(124,58,237,.1)', borderColor: 'rgba(124,58,237,.25)' }}>
          <Briefcase size={13} /> {designations.length} Designations
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: '#7c3aed' }}>{designations.length}</div>
          <div className={styles.statLbl}>Total Designations</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: '#2563eb' }}>{(doctors||[]).length}</div>
          <div className={styles.statLbl}>Doctors</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: '#0891b2' }}>{(nurses||[]).length}</div>
          <div className={styles.statLbl}>Nurses</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{ color: '#16a34a' }}>{(departments||[]).length}</div>
          <div className={styles.statLbl}>Departments</div>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Left — Add panel */}
        <div className={styles.leftPanel}>
          <div className={styles.panelTitle}><Plus size={14} /> Add Designation</div>
          <input
            className={styles.addInput}
            placeholder="e.g. Senior Consultant, Head Nurse..."
            value={newDesig}
            onChange={e => setNewDesig(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button className={styles.addBtn} style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
            onClick={handleAdd} disabled={!newDesig.trim()}>
            <Plus size={14} /> Add Designation
          </button>
          <div className={styles.tipBox}>
            <Info size={12} />
            Designations define roles like "Senior Consultant", "Head Nurse", "Resident Doctor" etc. Used in staff profiles and reporting.
          </div>

          {/* Quick preset chips */}
          <div className={styles.presetSection}>
            <div className={styles.presetLabel}><Tag size={11} /> Common Designations</div>
            {['Consultant','Senior Consultant','Resident Doctor','Intern','Head Nurse',
              'Staff Nurse','ICU Nurse','Lab Technician','Pharmacist','Radiologist'
            ].filter(p => !designations.includes(p)).map(p => (
              <button key={p} className={styles.presetChip}
                onClick={() => { setDesignations([...designations, p]); showToast(`"${p}" added`); }}>
                <Plus size={9} /> {p}
              </button>
            ))}
          </div>
        </div>

        {/* Right — List */}
        <div className={styles.rightPanel}>
          <div className={styles.listHeader}>
            <div className={styles.searchWrap}>
              <Search size={13} className={styles.searchIcon} />
              <input className={styles.searchInput} placeholder="Search designations..."
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className={styles.clearBtn} onClick={() => setSearch('')}><X size={12} /></button>}
            </div>
            <span className={styles.listCount}>{filteredDesigs.length} of {designations.length}</span>
          </div>

          <div className={styles.deptList}>
            {filteredDesigs.length === 0 ? (
              <div className={styles.emptyState}>
                <Briefcase size={36} strokeWidth={1.2} style={{ color: '#cbd5e1', marginBottom: 10 }} />
                <div style={{ color: '#64748b', fontSize: 14 }}>No designations found</div>
              </div>
            ) : filteredDesigs.map((desig, idx) => {
              const realIdx = designations.indexOf(desig);
              const isEditing = editItem?.idx === realIdx;
              const staff = staffWithDesig(desig);
              return (
                <div key={desig} className={styles.deptRow}>
                  <div className={styles.deptRowMain}>
                    <div className={styles.deptAvatar} style={{ background: desigColor(desig) }}>
                      {initials(desig)}
                    </div>
                    <div className={styles.deptInfo}>
                      {isEditing ? (
                        <input className={styles.editInput} value={editItem.val} autoFocus
                          onChange={e => setEditItem({ ...editItem, val: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditItem(null); }}
                        />
                      ) : (
                        <div className={styles.deptName}>{desig}</div>
                      )}
                      <div className={styles.deptMeta}>
                        {staff.length > 0
                          ? <span><Users size={10} /> {staff.length} staff assigned</span>
                          : <span style={{ color: '#94a3b8' }}>No staff assigned</span>}
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
                          <button className={styles.iconBtn} style={{ color: '#7c3aed' }} onClick={() => handleEdit(realIdx, desig)}><Edit2 size={13} /></button>
                          <button className={styles.iconBtn} style={{ color: '#dc2626' }} onClick={() => setDeleteConfirm(desig)}><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  </div>
                  {deleteConfirm === desig && (
                    <div className={styles.deleteConfirm}>
                      <AlertCircle size={14} style={{ color: '#dc2626' }} />
                      <span>Delete <strong>{desig}</strong>?</span>
                      <button className={styles.delConfirmBtn} onClick={() => handleDelete(desig)}>Delete</button>
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
