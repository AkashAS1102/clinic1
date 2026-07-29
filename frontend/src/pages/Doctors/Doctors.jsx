import { useState } from 'react';
import { Search, Filter, CalendarDays, Edit2, UserPlus, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { departments, daysOfWeek, doctorTimeSlots, qualifications } from '../../mockData';
import styles from './Doctors.module.css';

function DoctorAvatar({ name, photo }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['avatar-blue', 'avatar-green', 'avatar-purple', 'avatar-orange'];
  const idx = name.charCodeAt(0) % colors.length;
  if (photo) {
    return <img src={photo} alt={name} className={styles.docPhoto} />;
  }
  return (
    <div className={`avatar ${colors[idx]}`} style={{ width: 44, height: 44, fontSize: 15 }}>
      {initials}
    </div>
  );
}

const emptyDoctor = {
  name: '', department: '', qualification: '',
  contact: '', email: '', licenseNumber: '', experience: '',
  availableDays: [], timeSlot: '', fee: '', status: 'Active', photo: null,
};

export default function Doctors() {
  const { doctors, addDoctor, updateDoctor, deleteDoctor } = useApp();
  const [selected, setSelected] = useState(doctors[0] || null);
  const [editMode, setEditMode] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [form, setForm] = useState(emptyDoctor);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSelectChange = (e) => {
    const doc = doctors.find(d => d.id === e.target.value);
    if (doc) {
      handleSelect(doc);
    }
  };

  const handleSelect = (doc) => {
    setSelected(doc);
    setEditMode(false);
    setAddMode(false);
    setConfirmDelete(false);
  };

  const handleEdit = () => {
    setForm({ ...selected });
    setEditMode(true);
    setAddMode(false);
    setConfirmDelete(false);
  };

  const handleAdd = () => {
    setForm(emptyDoctor);
    setAddMode(true);
    setEditMode(false);
    setSelected(null);
    setConfirmDelete(false);
  };

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const handleSave = async () => {
    if (addMode) {
      await addDoctor(form);
      setAddMode(false);
    } else {
      await updateDoctor(selected.id, form);
      setSelected(prev => ({ ...prev, ...form }));
      setEditMode(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setAddMode(false);
    setForm(emptyDoctor);
    setConfirmDelete(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selected) return;
    setDeleting(true);
    await deleteDoctor(selected.id);
    setDeleting(false);
    setConfirmDelete(false);
    setSelected(null);
  };

  const displayForm = editMode || addMode;
  const displayData = displayForm ? form : selected;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Doctor Directory</h1>
          <p className="page-subtitle">Manage clinic physician profiles and schedules.</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <UserPlus size={15} />
          Add Doctor
        </button>
      </div>

      <div className={styles.layout}>
        {/* Profile */}
        <div className={styles.profilePanel}>
          {!addMode && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
              <label className="form-label" style={{ marginBottom: '8px' }}>Select Doctor to Manage</label>
              <select className="form-select" value={selected?.id || ''} onChange={handleSelectChange}>
                <option value="" disabled>Select a doctor</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.name} ({d.department})</option>
                ))}
              </select>
            </div>
          )}
            <div className={styles.profileHeader}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Doctor Profile</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {!displayForm && (
                  <>
                    <button className="btn btn-outline btn-sm">
                      <CalendarDays size={13} /> View Schedule
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={handleEdit}>
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setConfirmDelete(true)}
                      title="Remove Doctor"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Delete Confirmation Banner */}
            {confirmDelete && (
              <div className={styles.deleteBanner}>
                <AlertTriangle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                <span>
                  Are you sure you want to remove <strong>Dr. {selected?.name}</strong> from the system? This cannot be undone.
                </span>
                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                  >
                    {deleting ? 'Removing...' : 'Yes, Remove'}
                  </button>
                </div>
              </div>
            )}

            <div className={styles.profileBody}>
              {/* Row 1: ID, Full Name, Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.5fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Doctor ID</label>
                  <input className="form-input" style={{ padding: '6px 10px', fontSize: 12.5 }} value={displayData?.id || 'AUTO-ASSIGNED'} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Full Name</label>
                  <input
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: 12.5 }}
                    value={displayForm ? form.name : `Dr. ${displayData?.name || ''}`}
                    readOnly={!displayForm}
                    onChange={e => handleChange('name', e.target.value)}
                    placeholder="Doctor's full name"
                  />
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

              {/* Row 2: Department, Qualification, Consultation Fee */}
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
                  <label className="form-label" style={{ fontSize: 11.5 }}>Consultation Fee (₹)</label>
                  <div className={styles.feeWrap}>
                    <span className={styles.feeDollar}>₹</span>
                    <input
                      className={`form-input ${styles.feeInput}`}
                      style={{ padding: '6px 10px 6px 24px', fontSize: 12.5 }}
                      type="number"
                      value={displayForm ? form.fee : displayData?.fee || ''}
                      readOnly={!displayForm}
                      onChange={e => handleChange('fee', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Contact, Email, Time Slot */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1.1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Contact Number</label>
                  <input
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: 12.5 }}
                    value={displayForm ? form.contact : displayData?.contact || ''}
                    readOnly={!displayForm}
                    onChange={e => handleChange('contact', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Email Address</label>
                  <input
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: 12.5 }}
                    value={displayForm ? form.email : displayData?.email || ''}
                    readOnly={!displayForm}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="doctor@clinic.in"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Standard Time Slot</label>
                  {displayForm ? (
                    <select className="form-select" style={{ padding: '6px 8px', fontSize: 12.5 }} value={form.timeSlot} onChange={e => handleChange('timeSlot', e.target.value)}>
                      <option value="">Select slot</option>
                      {doctorTimeSlots.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input className="form-input" style={{ padding: '6px 10px', fontSize: 12.5 }} value={displayData?.timeSlot || ''} readOnly />
                  )}
                </div>
              </div>

              {/* Row 4: License & Experience */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Medical License Number</label>
                  <input
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: 12.5 }}
                    value={displayForm ? form.licenseNumber : displayData?.licenseNumber || ''}
                    readOnly={!displayForm}
                    onChange={e => handleChange('licenseNumber', e.target.value)}
                    placeholder="e.g. MCI-12345"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11.5 }}>Years of Experience / Bio</label>
                  <input
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: 12.5 }}
                    value={displayForm ? form.experience : displayData?.experience || ''}
                    readOnly={!displayForm}
                    onChange={e => handleChange('experience', e.target.value)}
                    placeholder="e.g. 10+ years specializing in..."
                  />
                </div>
              </div>

              {/* Row 5: Availability Chips */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5, marginBottom: 6 }}>Available Days</label>
                <div className={styles.dayChips}>
                  {daysOfWeek.map(day => {
                    const active = (displayForm ? form.availableDays : displayData?.availableDays || []).includes(day);
                    return (
                      <button
                        key={day}
                        className={`${styles.dayChip} ${active ? styles.dayChipActive : ''}`}
                        onClick={() => displayForm && toggleDay(day)}
                        style={{ cursor: displayForm ? 'pointer' : 'default', padding: '4px 10px', fontSize: 12 }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className={styles.profileFooter}>
              {displayForm ? (
                <>
                  <button className="btn btn-outline" onClick={handleCancel}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                </>
              ) : (
                <>
                  <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
