import { useState } from 'react';
import { Search, AlertCircle, CalendarDays, CheckCircle2, UserPlus, X, Plus, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { departments, timeSlots, bloodGroups } from '../../mockData';
import styles from './Appointments.module.css';

function calcAge(dob) {
  if (!dob) return '';
  const d = new Date(dob);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function generateHourlySlots(shiftString) {
  if (!shiftString) return [];
  const match = shiftString.match(/(\d{2}):\d{2}\s*-\s*(\d{2}):\d{2}/);
  if (!match) return [shiftString];
  const startHour = parseInt(match[1], 10);
  const endHour = parseInt(match[2], 10);
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    const slotStart = h.toString().padStart(2, '0') + ':00';
    const slotEnd = (h + 1).toString().padStart(2, '0') + ':00';
    slots.push(`${slotStart} - ${slotEnd}`);
  }
  return slots;
}

// ── Inline Registration Mini-Form ────────────────────────────
const emptyRegForm = {
  fullName: '', dob: '', gender: '',
  address: '', emergencyContactName: '', emergencyContactPhone: '',
  bloodGroup: '', allergies: [], conditions: '',
};

function InlineRegister({ phoneInput, matchedFamily, onRegistered, onCancel }) {
  const { addPatient, doctors } = useApp();
  const [form, setForm] = useState(() => {
    if (matchedFamily.length > 0) {
      const first = matchedFamily[0];
      return {
        ...emptyRegForm,
        address: first.address || '',
        emergencyContactName: first.emergencyContactName || '',
        emergencyContactPhone: first.emergencyContactPhone || '',
      };
    }
    return { ...emptyRegForm };
  });
  const [allergyInput, setAllergyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isShared = (field) =>
    matchedFamily.length > 0 &&
    ['address', 'emergencyContactName', 'emergencyContactPhone'].includes(field);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleAddAllergy = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && allergyInput.trim()) {
      e.preventDefault();
      setForm(prev => ({ ...prev, allergies: [...prev.allergies, allergyInput.trim()] }));
      setAllergyInput('');
    }
  };

  const handleSubmit = async () => {
    if (!form.fullName || !form.dob || !form.gender) {
      setError('Name, Date of Birth and Gender are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const id = await addPatient({ ...form, phone: phoneInput });
      onRegistered(id);
    } catch (err) {
      setError('Failed to register patient. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '2px solid var(--primary)',
      borderRadius: 12, padding: 20, marginTop: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserPlus size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--primary)' }}>
            Register New Patient
          </span>
          {matchedFamily.length > 0 && (
            <span style={{
              background: '#fef9c3', color: '#854d0e', fontSize: 11, fontWeight: 600,
              padding: '2px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Zap size={9} /> Shared fields auto-filled
            </span>
          )}
        </div>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Full Name *</label>
          <input className="form-input" placeholder="Patient's full name"
            value={form.fullName} onChange={e => handleChange('fullName', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Date of Birth *</label>
          <input type="date" className="form-input"
            value={form.dob} onChange={e => handleChange('dob', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Gender *</label>
          <select className="form-select" value={form.gender} onChange={e => handleChange('gender', e.target.value)}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">
            Address
            {isShared('address') && (
              <span style={{ marginLeft: 6, fontSize: 10, color: '#854d0e', fontWeight: 600 }}>
                <Zap size={9} /> Auto-filled
              </span>
            )}
          </label>
          <input className="form-input" placeholder="House, Street, City, PIN"
            value={form.address} onChange={e => handleChange('address', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">
            Emergency Contact Name
            {isShared('emergencyContactName') && (
              <span style={{ marginLeft: 6, fontSize: 10, color: '#854d0e', fontWeight: 600 }}>
                <Zap size={9} /> Auto-filled
              </span>
            )}
          </label>
          <input className="form-input" placeholder="Relative's name"
            value={form.emergencyContactName} onChange={e => handleChange('emergencyContactName', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">
            Emergency Contact Phone
            {isShared('emergencyContactPhone') && (
              <span style={{ marginLeft: 6, fontSize: 10, color: '#854d0e', fontWeight: 600 }}>
                <Zap size={9} /> Auto-filled
              </span>
            )}
          </label>
          <input className="form-input" placeholder="+91 XXXXX XXXXX"
            value={form.emergencyContactPhone} onChange={e => handleChange('emergencyContactPhone', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Blood Group</label>
          <select className="form-select" value={form.bloodGroup} onChange={e => handleChange('bloodGroup', e.target.value)}>
            <option value="">Select</option>
            {bloodGroups.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Existing Conditions</label>
          <input className="form-input" placeholder="e.g. Diabetes, Asthma"
            value={form.conditions} onChange={e => handleChange('conditions', e.target.value)} />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Allergies (press Enter to add)</label>
          <div style={{
            border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px',
            minHeight: 38, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
            background: 'var(--bg)',
          }}>
            {form.allergies.map((a, i) => (
              <span key={i} style={{
                background: 'var(--danger)', color: '#fff', padding: '2px 8px',
                borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {a}
                <button onClick={() => setForm(prev => ({ ...prev, allergies: prev.allergies.filter((_, idx) => idx !== i) }))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 0 }}>
                  <X size={9} />
                </button>
              </span>
            ))}
            <input value={allergyInput} onChange={e => setAllergyInput(e.target.value)}
              onKeyDown={handleAddAllergy} placeholder="Add allergy…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, flex: 1 }} />
          </div>
        </div>
      </div>

      {error && <div style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600, marginTop: 10 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
          <UserPlus size={14} />
          {saving ? 'Registering...' : 'Register & Continue'}
        </button>
      </div>
    </div>
  );
}

// ── Main Appointments Component ──────────────────────────────
export default function Appointments() {
  const { patients, doctors, addAppointment } = useApp();

  const [phoneInput, setPhoneInput] = useState('+91 ');
  const [searched, setSearched] = useState(false);
  const [matchedPatients, setMatchedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [bookedToken, setBookedToken] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [dept, setDept] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const activeDoctors = (doctors || []).filter(d => d && d.status === 'Active');
  const availableDepartments = Array.from(new Set(activeDoctors.map(d => d.department).filter(Boolean))).sort();
  const todayStr = new Date().toISOString().slice(0, 10); // for min date validation

  const filteredDoctors = dept
    ? activeDoctors.filter(d => d && d.department === dept)
    : activeDoctors;

  const handlePhoneChange = (e) => {
    let val = e.target.value;
    let newPhoneInput = '+91 ';
    
    if (val.length >= 4) {
      const prefix = val.substring(0, 4);
      const rest = val.substring(4);
      if (prefix !== '+91 ') {
        const digits = val.replace(/\D/g, '');
        let cleanDigits = digits;
        if (digits.startsWith('91')) cleanDigits = digits.substring(2);
        newPhoneInput = '+91 ' + cleanDigits;
      } else {
        newPhoneInput = '+91 ' + rest.replace(/\D/g, '');
      }
    }
    
    setPhoneInput(newPhoneInput);

    // Live search suggestions
    let cleanSearch = newPhoneInput.replace(/\D/g, '');
    if (cleanSearch.startsWith('91') && cleanSearch.length > 2) cleanSearch = cleanSearch.substring(2);
    
    if (cleanSearch.length > 0) {
      const found = (patients || []).filter(p => {
        if (!p || !p.phone) return false;
        let pClean = p.phone.replace(/\D/g, '');
        if (pClean.startsWith('91') && pClean.length > 10) pClean = pClean.substring(2);
        return pClean.includes(cleanSearch);
      });
      setSuggestions(found);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = () => {
    if (!phoneInput.trim() || phoneInput === '+91 ') return;
    let cleanSearch = phoneInput.replace(/\D/g, '');
    if (cleanSearch.startsWith('91') && cleanSearch.length > 10) cleanSearch = cleanSearch.substring(2);

    const found = (patients || []).filter(p => {
      if (!p || !p.phone) return false;
      let pClean = p.phone.replace(/\D/g, '');
      if (pClean.startsWith('91') && pClean.length > 10) pClean = pClean.substring(2);
      return pClean === cleanSearch;
    });

    setMatchedPatients(found);
    setSearched(true);
    setSelectedPatient(found.length === 1 ? found[0] : null);
    setShowRegister(false);
    setConfirmed(false);
    setBookedToken(null);
  };

  const handleRegistered = (newPatientId) => {
    // After inline registration, find and select the new patient
    setTimeout(() => {
      // Need to re-check patients after state update
      setShowRegister(false);
      setSearched(true);
      // The patient list will have updated via context — re-search
      handleSearch();
    }, 300);
  };

  const handleConfirmBooking = async () => {
    if (!selectedPatient || !doctorId || !date || !slot) {
      setBookingError('Please fill all required fields: patient, doctor, date, and time slot.');
      return;
    }
    // BUG-03 fix: Slot conflict detection before booking
    const conflict = appointments.find(a =>
      a.doctorId === doctorId &&
      a.date === date &&
      a.timeSlot === slot &&
      a.status !== 'Cancelled'
    );
    if (conflict) {
      const doc = doctors.find(d => d.id === doctorId);
      setBookingError(`❌ Time slot "${slot}" is already booked for ${doc ? 'Dr. ' + doc.name : 'this doctor'}. Please choose another slot or time.`);
      return;
    }
    setBookingError('');
    setSaving(true);
    try {
      const doc = doctors.find(d => d.id === doctorId);
      const { token } = await addAppointment({
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        doctorId,
        doctorName: doc ? `Dr. ${doc.name}` : '',
        department: dept,
        date,
        timeSlot: slot,
        reason,
        status: 'Scheduled',
      });
      setBookedToken(token);
      setConfirmed(true);
    } catch (err) {
      setBookingError('Failed to book appointment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPhoneInput('+91 ');
    setSearched(false);
    setMatchedPatients([]);
    setSelectedPatient(null);
    setShowRegister(false);
    setDept('');
    setDoctorId('');
    setDate('');
    setSlot('');
    setReason('');
    setBookingError('');
    setSaving(false);
    setBookedToken(null);
    setConfirmed(false);
  };

  const selDoc = doctors.find(d => d.id === doctorId);

  // Clean phone for family lookup in inline register
  const cleanPhone = () => {
    let c = phoneInput.replace(/\D/g, '');
    if (c.startsWith('91') && c.length > 10) c = c.slice(2);
    return c;
  };

  // Compute available slots based on selected doctor from database
  const availableSlots = selDoc && selDoc.timeSlot ? generateHourlySlots(selDoc.timeSlot) : timeSlots;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Book Appointment</h1>
          <p className="page-subtitle">Identify patient and schedule a new consultation.</p>
        </div>
      </div>

      {confirmed && (
        <div className={styles.successBanner}>
          <CheckCircle2 size={18} />
          <span>
            Appointment confirmed! Token: <strong>{bookedToken}</strong> — {selectedPatient?.fullName} with Dr. {selDoc?.name} on {date} at {slot}
          </span>
          <button className="btn btn-outline btn-sm" onClick={handleCancel} style={{ marginLeft: 'auto' }}>
            New Booking
          </button>
        </div>
      )}

      <div className={styles.layout}>
        {/* Left: Patient Lookup */}
        <div className={styles.left}>
          {/* Phone Lookup */}
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>Patient Lookup</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="form-input"
                      style={{ paddingLeft: 30 }}
                      value={phoneInput}
                      onChange={handlePhoneChange}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      onBlur={() => setShowSuggestions(false)}
                      onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                      placeholder="+91 9876543210"
                      maxLength={14}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className={styles.dropdown}>
                        {suggestions.map(p => (
                          <div key={p.id} className={styles.dropdownItem} onMouseDown={(e) => {
                            e.preventDefault(); // prevent input blur before click fires
                            setPhoneInput(p.phone || phoneInput);
                            setShowSuggestions(false);
                            // Auto select patient
                            setSelectedPatient(p);
                            setSearched(true);
                            setMatchedPatients([p]);
                            setShowRegister(false);
                            setConfirmed(false);
                            setBookedToken(null);
                          }}>
                            <div className={styles.dropdownName}>{p.fullName}</div>
                            <div className={styles.dropdownSub}>{p.phone} • {p.id}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="btn btn-primary" onClick={handleSearch}>Search</button>
                </div>
              </div>
            </div>
          </div>

          {/* No match — show register option */}
          {searched && matchedPatients.length === 0 && !showRegister && (
            <div className={styles.noMatchCard}>
              <AlertCircle size={16} />
              <span>No patient found for this number.</span>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => setShowRegister(true)}
              >
                <UserPlus size={13} /> Register New
              </button>
            </div>
          )}

          {/* Inline Registration */}
          {showRegister && (
            <InlineRegister
              phoneInput={phoneInput}
              matchedFamily={matchedPatients}
              onRegistered={handleRegistered}
              onCancel={() => setShowRegister(false)}
            />
          )}

          {/* Multiple matches */}
          {searched && matchedPatients.length > 1 && (
            <div className={styles.multiMatch}>
              <div className={styles.multiMatchTitle}>{matchedPatients.length} patients found under this number</div>
              {matchedPatients.map(p => (
                <button
                  key={p.id}
                  className={`${styles.multiMatchItem} ${selectedPatient?.id === p.id ? styles.multiMatchSelected : ''}`}
                  onClick={() => setSelectedPatient(p)}
                >
                  <div className={styles.multiMatchName}>{p.fullName}</div>
                  <div className={styles.multiMatchSub}>{p.gender}, {calcAge(p.dob)}y · {p.id}</div>
                </button>
              ))}
              <button
                className="btn btn-outline btn-sm"
                style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => setShowRegister(true)}
              >
                <Plus size={13} /> Add New Family Member
              </button>
            </div>
          )}

          {/* Single match auto-selected */}
          {searched && matchedPatients.length === 1 && !selectedPatient && (
            <div style={{ marginTop: 8 }}>
              <button className={styles.multiMatchItem} onClick={() => setSelectedPatient(matchedPatients[0])} style={{ width: '100%', textAlign: 'left' }}>
                <div className={styles.multiMatchName}>{matchedPatients[0].fullName}</div>
                <div className={styles.multiMatchSub}>{matchedPatients[0].gender}, {calcAge(matchedPatients[0].dob)}y · {matchedPatients[0].id}</div>
              </button>
            </div>
          )}

          {/* Selected patient card */}
          {selectedPatient && (
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14.5 }}>Patient Details</span>
                  <span className="badge badge-green">Match Found</span>
                </div>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setSelectedPatient(null)}
                  title="Deselect"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className={styles.patientGrid}>
                  <div>
                    <div className={styles.detailLabel}>Full Name</div>
                    <div className={styles.detailValue}>{selectedPatient.fullName}</div>
                  </div>
                  <div>
                    <div className={styles.detailLabel}>Patient ID</div>
                    <div className={styles.detailValue}>{selectedPatient.id}</div>
                  </div>
                  <div>
                    <div className={styles.detailLabel}>Date of Birth</div>
                    <div className={styles.detailValue}>
                      {selectedPatient.dob
                        ? new Date(selectedPatient.dob).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ` (${calcAge(selectedPatient.dob)}y)`
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className={styles.detailLabel}>Last Visit</div>
                    <div className={styles.detailValue}>
                      {selectedPatient.lastVisit
                        ? new Date(selectedPatient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                        : 'First visit'}
                    </div>
                  </div>
                </div>

                {selectedPatient.allergies?.length > 0 && (
                  <div className={styles.allergyAlert}>
                    <AlertCircle size={14} />
                    <span>
                      <strong>Active Alert</strong><br />
                      Patient has allergy to {selectedPatient.allergies.join(', ')}.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Consultation Details */}
        <div className={styles.right}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>Consultation Details</span>
              {bookedToken && <span className={styles.tokenBadge}># {bookedToken}</span>}
            </div>
            <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={dept} onChange={e => { setDept(e.target.value); setDoctorId(''); }}>
                    <option value="">All Departments</option>
                    {availableDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Doctor</label>
                  <select className="form-select" value={doctorId} onChange={e => setDoctorId(e.target.value)}>
                    <option value="">Select Doctor</option>
                    {filteredDoctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time Slot</label>
                  <select className="form-select" value={slot} onChange={e => setSlot(e.target.value)}>
                    <option value="">Select time</option>
                    {availableSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Reason for Visit</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 90 }}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Describe reason for this visit..."
                />
              </div>

              <div className={styles.statusRow}>
                <span className={styles.statusDot} />
                <span className={styles.statusText}>Status: {confirmed ? 'Scheduled' : 'Pending'}</span>
              </div>
            </div>

            <div className={styles.bookingFooter}>
              <button className="btn btn-outline" onClick={handleCancel}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmBooking}
                disabled={!selectedPatient || !doctorId || !date || !slot || confirmed}
              >
                <CalendarDays size={14} />
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
