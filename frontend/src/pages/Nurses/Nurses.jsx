import { useState } from 'react';
import { UserPlus, Edit2, Trash2, AlertTriangle, X, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './Nurses.module.css';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const shifts = [
  'Morning (06:00 - 14:00)',
  'Afternoon (14:00 - 22:00)',
  'Night (22:00 - 06:00)',
  'Full Day (08:00 - 20:00)',
];

const departments = [
  'General Medicine', 'Cardiology', 'Neurology', 'Pediatrics',
  'Orthopedics', 'Gynecology', 'Oncology', 'Emergency', 'ICU', 'OPD',
];

const qualifications = [
  'ANM', 'GNM', 'B.Sc Nursing', 'M.Sc Nursing', 'Post Basic B.Sc',
];

const avatarColors = ['avatar-blue', 'avatar-green', 'avatar-purple', 'avatar-orange'];

function getInitials(name) {
  return (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function NurseAvatar({ name, idx }) {
  const initials = getInitials(name);
  return (
    <div className={`avatar ${avatarColors[idx % avatarColors.length]}`} style={{ width: 44, height: 44, fontSize: 15 }}>
      {initials}
    </div>
  );
}

const emptyNurse = {
  name: '', employeeId: '', department: '', qualification: '',
  contact: '', email: '', shift: '', licenseNumber: '', experience: '',
  joiningDate: '', availableDays: [], status: 'Active',
};

export default function Nurses() {
  const { nurses, addNurse, updateNurse, deleteNurse } = useApp();
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [form, setForm] = useState(emptyNurse);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const displayForm = editMode || addMode;
  const displayData = addMode ? null : selected;

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 2500); };

  const handleSelect = (nurse) => {
    setSelected(nurse);
    setForm({
      name: nurse.name || '',
      employeeId: nurse.employeeId || '',
      department: nurse.department || '',
      qualification: nurse.qualification || '',
      contact: nurse.contact || '',
      email: nurse.email || '',
      shift: nurse.shift || '',
      licenseNumber: nurse.licenseNumber || '',
      experience: nurse.experience || '',
      joiningDate: nurse.joiningDate || '',
      availableDays: nurse.availableDays || [],
      status: nurse.status || 'Active',
    });
    setEditMode(false);
    setAddMode(false);
    setConfirmDelete(false);
  };

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleDay = (day) => {
    if (!displayForm) return;
    setForm(f => ({
      ...f,
      availableDays: f.availableDays.includes(day)
        ? f.availableDays.filter(d => d !== day)
        : [...f.availableDays, day],
    }));
  };

  const handleAddNew = () => {
    setSelected(null);
    setForm(emptyNurse);
    setAddMode(true);
    setEditMode(false);
    setConfirmDelete(false);
  };

  const handleEdit = () => {
    setEditMode(true);
    setConfirmDelete(false);
  };

  const handleCancel = () => {
    if (addMode) { setAddMode(false); setSelected(nurses[0] || null); }
    else { setEditMode(false); if (selected) handleSelect(selected); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return showMsg('⚠ Name is required');
    setSaving(true);
    try {
      if (addMode) {
        const n = await addNurse(form);
        setSelected(n);
        setAddMode(false);
        showMsg('✓ Nurse added successfully');
      } else {
        const n = await updateNurse(selected.id, form);
        setSelected(n);
        setEditMode(false);
        showMsg('✓ Profile updated successfully');
      }
    } catch (e) {
      showMsg('✗ Error saving. Check backend.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteNurse(selected.id);
      const remaining = nurses.filter(n => n.id !== selected.id);
      setSelected(remaining[0] || null);
      setConfirmDelete(false);
      showMsg('Nurse removed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Nurse Directory</h1>
          <p className="page-subtitle">Manage clinic nursing staff profiles and shifts.</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <UserPlus size={15} /> Add Nurse
        </button>
      </div>

      {msg && <div className={styles.msgBanner}>{msg}</div>}

      <div className={styles.body}>
        {/* Left: Select */}
        <div className={styles.selectCard}>
          <div className={styles.nurseList}>
            {nurses.map((n, i) => (
              <button
                key={n.id}
                className={`${styles.nurseCard} ${selected?.id === n.id ? styles.nurseCardActive : ''}`}
                onClick={() => handleSelect(n)}
              >
                <NurseAvatar name={n.name} idx={i} />
                <div className={styles.nurseCardInfo}>
                  <div className={styles.nurseCardName}>{n.name}</div>
                  <div className={styles.nurseCardSub}>{n.department || '—'} • {n.shift?.split(' ')[0] || '—'}</div>
                </div>
                <span className={`badge ${n.status === 'Active' ? 'badge-green' : n.status === 'On Leave' ? 'badge-yellow' : 'badge-gray'}`}>
                  {n.status}
                </span>
              </button>
            ))}
            {nurses.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No nurses registered yet. Click "Add Nurse" to begin.
              </div>
            )}
          </div>
        </div>

        {/* Right: Profile */}
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {(displayData || addMode) && (
                <NurseAvatar name={displayForm ? form.name : displayData?.name} idx={selected ? nurses.indexOf(selected) : 0} />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {addMode ? 'New Nurse Profile' : displayData ? displayData.name : 'Nurse Profile'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {displayData?.employeeId || (addMode ? 'ID: AUTO-ASSIGNED' : '')}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!displayForm && displayData && (
                <>
                  <button className="btn btn-outline btn-sm" onClick={handleEdit}><Edit2 size={13} /> Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Remove</button>
                </>
              )}
              {displayForm && (
                <>
                  <button className="btn btn-outline btn-sm" onClick={handleCancel}><X size={13} /> Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                    <Save size={13} /> {saving ? 'Saving…' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>

          {confirmDelete && (
            <div className={styles.deleteBanner}>
              <AlertTriangle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
              <span>Are you sure you want to remove <strong>{selected?.name}</strong>? This cannot be undone.</span>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button className="btn btn-danger btn-sm" onClick={handleDeleteConfirm} disabled={deleting}>
                  {deleting ? 'Removing…' : 'Yes, Remove'}
                </button>
              </div>
            </div>
          )}

          {(displayData || addMode) ? (
            <div className={styles.profileBody}>
              {/* Row 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.5fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Nurse ID</label>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: 12.5 }} value={displayForm ? form.employeeId : displayData?.employeeId || ''} readOnly={!displayForm} onChange={e => handleChange('employeeId', e.target.value)} placeholder="AUTO-ASSIGNED" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Full Name</label>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: 12.5 }} value={displayForm ? form.name : displayData?.name || ''} readOnly={!displayForm} onChange={e => handleChange('name', e.target.value)} placeholder="Nurse's full name" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Status</label>
                  {displayForm ? (
                    <select className="form-select" style={{ padding: '6px 8px', fontSize: 12.5 }} value={form.status} onChange={e => handleChange('status', e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  ) : (
                    <input className="form-input" style={{ padding: '6px 10px', fontSize: 12.5 }} value={displayData?.status || ''} readOnly />
                  )}
                </div>
              </div>

              {/* Row 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Department</label>
                  {displayForm ? (
                    <select className="form-select" style={{ padding: '6px 8px', fontSize: 12.5 }} value={form.department} onChange={e => handleChange('department', e.target.value)}>
                      <option value="">Select</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  ) : (
                    <input className="form-input" style={{ padding: '6px 10px', fontSize: 12.5 }} value={displayData?.department || ''} readOnly />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Qualification</label>
                  {displayForm ? (
                    <select className="form-select" style={{ padding: '6px 8px', fontSize: 12.5 }} value={form.qualification} onChange={e => handleChange('qualification', e.target.value)}>
                      <option value="">Select</option>
                      {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                  ) : (
                    <input className="form-input" style={{ padding: '6px 10px', fontSize: 12.5 }} value={displayData?.qualification || ''} readOnly />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Joining Date</label>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: 12.5 }} type={displayForm ? 'date' : 'text'} value={displayForm ? form.joiningDate : displayData?.joiningDate || ''} readOnly={!displayForm} onChange={e => handleChange('joiningDate', e.target.value)} />
                </div>
              </div>

              {/* Row 3 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1.1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Contact Number</label>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: 12.5 }} value={displayForm ? form.contact : displayData?.contact || ''} readOnly={!displayForm} onChange={e => handleChange('contact', e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Email Address</label>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: 12.5 }} value={displayForm ? form.email : displayData?.email || ''} readOnly={!displayForm} onChange={e => handleChange('email', e.target.value)} placeholder="nurse@clinic.in" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Shift</label>
                  {displayForm ? (
                    <select className="form-select" style={{ padding: '6px 8px', fontSize: 12.5 }} value={form.shift} onChange={e => handleChange('shift', e.target.value)}>
                      <option value="">Select shift</option>
                      {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input className="form-input" style={{ padding: '6px 10px', fontSize: 12.5 }} value={displayData?.shift || ''} readOnly />
                  )}
                </div>
              </div>

              {/* Row 4: License & Experience */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Nursing License / Reg. No.</label>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: 12.5 }} value={displayForm ? form.licenseNumber : displayData?.licenseNumber || ''} readOnly={!displayForm} onChange={e => handleChange('licenseNumber', e.target.value)} placeholder="e.g. INC-2024-XXXXX" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Years of Experience / Bio</label>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: 12.5 }} value={displayForm ? form.experience : displayData?.experience || ''} readOnly={!displayForm} onChange={e => handleChange('experience', e.target.value)} placeholder="e.g. 5+ years in ICU nursing..." />
                </div>
              </div>

              {/* Row 5: Available Days */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5, marginBottom: 6 }}>Available Days</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {daysOfWeek.map(day => {
                    const active = (displayForm ? form.availableDays : displayData?.availableDays || []).includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: displayForm ? 'pointer' : 'default', border: '1.5px solid',
                          background: active ? 'var(--primary)' : 'transparent',
                          color: active ? '#fff' : 'var(--text-muted)',
                          borderColor: active ? 'var(--primary)' : 'var(--border)',
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Select a nurse from the list or click "Add Nurse" to create a new profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
