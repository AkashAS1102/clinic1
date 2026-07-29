import { useState } from 'react';
import { Search, UserPlus, Zap, Camera, X, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { bloodGroups, departments } from '../../mockData';
import styles from './Registration.module.css';

const emptyForm = {
  phone: '',
  fullName: '',
  dob: '',
  gender: '',
  maritalStatus: 'Single',
  govtId: '',
  occupation: '',
  address: '',
  guardianName: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  bloodGroup: '',
  allergies: [],
  conditions: '',
  referringDoctor: '',
  patientCategory: 'General',
  insuranceProvider: '',
  policyNumber: '',
  registeredBy: 'Front Desk Admin',
  status: 'Active',
  relationshipToFamily: '',
  photo: null,
};

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function calcAge(dob) {
  if (!dob) return '';
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function Registration() {
  const { patients, addPatient, doctors, addToNurseQueue } = useApp();
  const [phoneInput, setPhoneInput] = useState('+91 ');
  const [searchDone, setSearchDone] = useState(false);
  const [matchedPatients, setMatchedPatients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [allergyInput, setAllergyInput] = useState('');
  const [generatedId, setGeneratedId] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [dropdownMatches, setDropdownMatches] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const isExistingPatient = !!generatedId && !savedSuccess;

  const handlePhoneChange = (e) => {
    let val = e.target.value;
    let newPhoneInput = '+91 ';
    
    if (val.length < 4) {
      newPhoneInput = '+91 ';
    } else {
      const prefix = val.substring(0, 4);
      const rest = val.substring(4);
      
      if (prefix !== '+91 ') {
         const digits = val.replace(/\D/g, '');
         let cleanDigits = digits;
         if (digits.startsWith('91')) {
           cleanDigits = digits.substring(2);
         }
         newPhoneInput = '+91 ' + cleanDigits;
      } else {
         newPhoneInput = '+91 ' + rest.replace(/\D/g, '');
      }
    }
    
    setPhoneInput(newPhoneInput);

    let cleanSearch = newPhoneInput.replace(/\D/g, '');
    if (cleanSearch.startsWith('91')) cleanSearch = cleanSearch.substring(2);
    
    if (cleanSearch.length > 2) {
      const found = patients.filter(p => {
        let pClean = (p.phone || '').replace(/\D/g, '');  // BUG-01 fix: guard null phone
        if (pClean.startsWith('91') && pClean.length > 10) pClean = pClean.substring(2);
        return pClean.startsWith(cleanSearch);
      });
      setDropdownMatches(found);
      setShowDropdown(true);
    } else {
      setDropdownMatches([]);
      setShowDropdown(false);
    }
  };

  const handleSearch = () => {
    if (!phoneInput.trim() || phoneInput === '+91 ') return;
    
    let cleanSearch = phoneInput.replace(/\D/g, '');
    if (cleanSearch.startsWith('91') && cleanSearch.length > 10) {
      cleanSearch = cleanSearch.substring(2);
    }

    const found = patients.filter(p => {
      let pClean = (p.phone || '').replace(/\D/g, '');  // BUG-01 fix: guard null phone
      if (pClean.startsWith('91') && pClean.length > 10) pClean = pClean.substring(2);
      return pClean === cleanSearch;
    });
    setMatchedPatients(found);
    setSearchDone(true);

    if (found.length > 0) {
      // Pre-fill shared family fields from first match
      const first = found[0];
      setForm(prev => ({
        ...emptyForm,
        phone: phoneInput,
        address: first.address,
        emergencyContactName: first.emergencyContactName,
        emergencyContactPhone: first.emergencyContactPhone,
      }));
    } else {
      setForm({ ...emptyForm, phone: phoneInput });
    }
    setGeneratedId(null);
    setSavedSuccess(false);
  };

  const handleSelectExisting = (patient) => {
    setForm({
      phone: patient.phone || '',
      fullName: patient.fullName || '',
      dob: patient.dob || '',
      gender: patient.gender || '',
      maritalStatus: patient.maritalStatus || 'Single',
      govtId: patient.govtId || '',
      occupation: patient.occupation || '',
      address: patient.address || '',
      guardianName: patient.guardianName || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      bloodGroup: patient.bloodGroup || '',
      allergies: patient.allergies || [],
      conditions: patient.conditions || '',
      referringDoctor: patient.referringDoctor || '',
      patientCategory: patient.patientCategory || 'General',
      insuranceProvider: patient.insuranceProvider || '',
      policyNumber: patient.policyNumber || '',
      registeredBy: patient.registeredBy || 'Front Desk Admin',
      status: patient.status || 'Active',
      photo: null,
    });
    setGeneratedId(patient.id);
  };

  const handleSelectFromDropdown = (patient) => {
    setPhoneInput(patient.phone);
    setShowDropdown(false);
    handleSelectExisting(patient);
    setSearchDone(true);
    setMatchedPatients([patient]);
  };

  const handleAddFamilyMember = () => {
    const first = matchedPatients[0];
    setForm({
      ...emptyForm,
      phone: phoneInput,
      address: first.address,
      emergencyContactName: first.emergencyContactName,
      emergencyContactPhone: first.emergencyContactPhone,
      relationshipToFamily: '',
    });
    setGeneratedId(null);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAllergy = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && allergyInput.trim()) {
      e.preventDefault();
      setForm(prev => ({ ...prev, allergies: [...prev.allergies, allergyInput.trim()] }));
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (i) => {
    setForm(prev => ({ ...prev, allergies: prev.allergies.filter((_, idx) => idx !== i) }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleClear = () => {
    setForm(emptyForm);
    setPhoneInput('+91 ');
    setSearchDone(false);
    setMatchedPatients([]);
    setGeneratedId(null);
    setPhotoPreview(null);
    setAllergyInput('');
    setSavedSuccess(false);
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    if (!form.fullName || !form.dob || !form.gender) {
      setErrorMsg('Please fill in all required fields (Name, DOB, Gender)');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    const id = await addPatient({ ...form, phone: phoneInput });
    setGeneratedId(id);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddToNurseQueue = async () => {
    const existingPatient = matchedPatients.find(p => p.id === generatedId);
    if (existingPatient) {
      await addToNurseQueue(existingPatient);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const isShared = (field) => {
    return searchDone && matchedPatients.length > 0 &&
      ['address', 'emergencyContactName', 'emergencyContactPhone'].includes(field);
  };

  const avatarColors = ['avatar-blue', 'avatar-green', 'avatar-purple', 'avatar-orange'];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className="page-title">New Patient Registration</h1>
          <p className="page-subtitle">Look up existing records or enter new patient details.</p>
        </div>
        <div className={styles.idBadge} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>
            PRN: {generatedId ? `PRN-2026-${generatedId.replace(/\D/g, '')}` : 'AUTO-ASSIGNED'}
          </span>
          <span>ID: {generatedId || 'AUTO-GENERATED'}</span>
        </div>
      </div>

      {/* Phone Lookup */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className={styles.lookupBody}>
          <div className={styles.lookupLabel}>
            <Search size={14} />
            Phone Number Lookup
          </div>
          <div className={styles.lookupRow}>
            <div className={styles.dropdownWrap}>
              <input
                type="tel"
                value={phoneInput}
                onChange={handlePhoneChange}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onFocus={() => { if (dropdownMatches.length > 0) setShowDropdown(true); }}
                placeholder="+91 9876543210"
                className={`form-input ${styles.phoneInput}`}
                maxLength={14}
              />
              {showDropdown && dropdownMatches.length > 0 && (
                <ul className={styles.dropdownMenu}>
                  {dropdownMatches.map(p => (
                    <li key={p.id} className={styles.dropdownItem} onClick={() => handleSelectFromDropdown(p)}>
                      <span className={styles.dropdownName}>{p.fullName}</span>
                      <span className={styles.dropdownPhone}>{p.phone}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button className="btn btn-primary" onClick={handleSearch}>
              <Search size={14} />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Family Match Banner */}
      {searchDone && matchedPatients.length > 0 && (
        <div className={styles.familyBanner}>
          <div className={styles.familyHeader}>
            <span className={styles.familyCount}>
              {matchedPatients.length} Existing Record{matchedPatients.length > 1 ? 's' : ''} Found (Potential Family Members)
            </span>
            <button className={styles.linkFamily} onClick={handleAddFamilyMember}>
              <Plus size={13} /> Add New Family Member
            </button>
          </div>

          <div className={styles.familyCards}>
            {matchedPatients.map((p, i) => (
              <button
                key={p.id}
                className={styles.familyCard}
                onClick={() => handleSelectExisting(p)}
              >
                <div className={`avatar ${avatarColors[i % avatarColors.length]}`} style={{ width: 34, height: 34, fontSize: 12 }}>
                  {getInitials(p.fullName)}
                </div>
                <div>
                  <div className={styles.familyCardName}>{p.fullName}</div>
                  <div className={styles.familyCardDob}>DOB: {new Date(p.dob).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {searchDone && matchedPatients.length === 0 && (
        <div className={styles.noMatch}>
          No existing records found for this number — filling a fresh form.
        </div>
      )}

      {/* Main Form: 2x2 Compact Grid */}
      <div className={styles.formGrid}>
        {/* Card 1: Personal & Demographics */}
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="card-header" style={{ paddingBottom: 8, marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--primary)' }}>Personal & Demographics</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11.5 }}>Full Name *</label>
              <input
                className="form-input"
                style={{ padding: '6px 10px', fontSize: 12.5 }}
                placeholder="e.g. Jane Doe"
                value={form.fullName}
                onChange={e => handleChange('fullName', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Date of Birth *</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '5px 8px', fontSize: 12 }}
                  value={form.dob}
                  onChange={e => handleChange('dob', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Calculated Age</label>
                <input
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: 12.5, fontWeight: 700, background: '#f8fafc' }}
                  value={calcAge(form.dob) ? `${calcAge(form.dob)} yrs` : 'Auto'}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Gender *</label>
                <select
                  className="form-select"
                  style={{ padding: '6px 8px', fontSize: 12.5 }}
                  value={form.gender}
                  onChange={e => handleChange('gender', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Marital Status</label>
                <select
                  className="form-select"
                  style={{ padding: '6px 8px', fontSize: 12.5 }}
                  value={form.maritalStatus}
                  onChange={e => handleChange('maritalStatus', e.target.value)}
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Occupation</label>
                <input
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: 12.5 }}
                  placeholder="e.g. Engineer, Teacher"
                  value={form.occupation}
                  onChange={e => handleChange('occupation', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Contact & Guardian */}
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="card-header" style={{ paddingBottom: 8, marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--primary)' }}>Contact & Guardian</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11.5 }}>
                Address
                {isShared('address') && <span className={styles.autoTag}><Zap size={10} /> Auto-filled</span>}
              </label>
              <input
                className="form-input"
                style={{ padding: '6px 10px', fontSize: 12.5 }}
                value={form.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder="House No., Street/Colony, City, State PIN"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11.5 }}>Guardian (Minors/Elderly)</label>
              <input
                className="form-input"
                style={{ padding: '6px 10px', fontSize: 12.5 }}
                value={form.guardianName}
                onChange={e => handleChange('guardianName', e.target.value)}
                placeholder="Guardian Name & Relationship (e.g. Father, Spouse)"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>
                  Emergency Contact Name
                  {isShared('emergencyContactName') && <span className={styles.autoTag}><Zap size={10} /> Auto</span>}
                </label>
                <input
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: 12.5 }}
                  value={form.emergencyContactName}
                  onChange={e => handleChange('emergencyContactName', e.target.value)}
                  placeholder="Contact Relative Name"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>
                  Emergency Phone
                  {isShared('emergencyContactPhone') && <span className={styles.autoTag}><Zap size={10} /> Auto</span>}
                </label>
                <input
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: 12.5 }}
                  value={form.emergencyContactPhone}
                  onChange={e => handleChange('emergencyContactPhone', e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Billing & Insurance */}
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="card-header" style={{ paddingBottom: 8, marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--primary)' }}>Billing & Insurance</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Patient Category</label>
                <select
                  className="form-select"
                  style={{ padding: '6px 8px', fontSize: 12.5 }}
                  value={form.patientCategory}
                  onChange={e => handleChange('patientCategory', e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Cashless">Cashless</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Patient Status</label>
                <select
                  className="form-select"
                  style={{ padding: '6px 8px', fontSize: 12.5 }}
                  value={form.status}
                  onChange={e => handleChange('status', e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Deceased">Deceased</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Insurance Provider</label>
                <input
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: 12.5 }}
                  placeholder="e.g. Star Health, HDFC Ergo"
                  value={form.insuranceProvider}
                  onChange={e => handleChange('insuranceProvider', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Policy / Card Number</label>
                <input
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: 12.5 }}
                  placeholder="e.g. POL-99882233"
                  value={form.policyNumber}
                  onChange={e => handleChange('policyNumber', e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Registered By</label>
                <input
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: 12.5, background: '#f8fafc' }}
                  value={form.registeredBy}
                  onChange={e => handleChange('registeredBy', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Registration Timestamp</label>
                <input
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: 12, background: '#f8fafc', fontWeight: 600 }}
                  value={new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Medical Profile */}
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="card-header" style={{ paddingBottom: 8, marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--primary)' }}>Medical Profile & Doctor</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Blood Group</label>
                <select
                  className="form-select"
                  style={{ padding: '6px 8px', fontSize: 12.5 }}
                  value={form.bloodGroup}
                  onChange={e => handleChange('bloodGroup', e.target.value)}
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11.5 }}>Referring Doctor</label>
                <select
                  className="form-select"
                  style={{ padding: '6px 8px', fontSize: 12.5 }}
                  value={form.referringDoctor}
                  onChange={e => handleChange('referringDoctor', e.target.value)}
                >
                  <option value="">None / Self-Referred</option>
                  {doctors?.map(d => (
                    <option key={d.id} value={`Dr. ${d.name}`}>Dr. {d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11.5 }}>Allergies (Press Enter to add)</label>
              <div className={styles.allergyBox} style={{ minHeight: 36, padding: '4px 8px' }}>
                {form.allergies.map((a, i) => (
                  <span key={i} className={styles.allergyTag} style={{ fontSize: 11, padding: '2px 6px' }}>
                    {a}
                    <button onClick={() => handleRemoveAllergy(i)}><X size={9} /></button>
                  </span>
                ))}
                <input
                  className={styles.allergyInput}
                  style={{ fontSize: 12 }}
                  value={allergyInput}
                  onChange={e => setAllergyInput(e.target.value)}
                  onKeyDown={handleAddAllergy}
                  placeholder="Type & Enter..."
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11.5 }}>Existing Medical Conditions</label>
              <input
                className="form-input"
                style={{ padding: '6px 10px', fontSize: 12.5 }}
                value={form.conditions}
                onChange={e => handleChange('conditions', e.target.value)}
                placeholder="Diabetes, Hypertension, Asthma, etc."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className={styles.footer}>
        {errorMsg && (
          <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 13, marginRight: 'auto' }}>
            {errorMsg}
          </span>
        )}
        {savedSuccess && (
          <span className={styles.successMsg}>✓ Patient successfully processed and added to Nurse Queue (PRN: {generatedId ? `PRN-2026-${generatedId.replace(/\D/g, '')}` : 'ASSIGNED'}, ID: {generatedId})</span>
        )}
        <button className="btn btn-outline" onClick={handleClear}>Clear Form</button>
        <button className="btn btn-primary" onClick={isExistingPatient ? handleAddToNurseQueue : handleSubmit}>
          <UserPlus size={15} />
          {isExistingPatient ? 'Add to Nurse Station' : 'Add Patient'}
        </button>
      </div>
    </div>
  );
}
