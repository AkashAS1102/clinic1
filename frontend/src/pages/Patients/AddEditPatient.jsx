import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, Phone, Calendar, HeartPulse, Activity, 
  MapPin, AlertCircle, ChevronRight, Save, ArrowLeft, 
  CheckCircle2, ShieldAlert, UserCheck, Shield, Briefcase, Camera, X 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './AddEditPatient.module.css';

function calcAge(dob) {
  if (!dob) return '';
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function AddEditPatient() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const { patients, addPatient, updatePatient, doctors } = useApp();
  const navigate = useNavigate();

  // Demographic & Personal
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [govtId, setGovtId] = useState('');
  const [occupation, setOccupation] = useState('');
  const [relationshipToFamily, setRelationshipToFamily] = useState('Self');
  const [photoPreview, setPhotoPreview] = useState(null);

  // Address & Guardian
  const [address, setAddress] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Clinical Profile
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [referringDoctor, setReferringDoctor] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [patientCategory, setPatientCategory] = useState('General');

  // Insurance & Administrative
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [registeredBy, setRegisteredBy] = useState('Front Desk Admin');
  const [status, setStatus] = useState('Active');

  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      const existing = patients.find(p => p.id === editId);
      if (existing) {
        setFullName(existing.fullName || '');
        setPhone(existing.phone || '');
        setDob(existing.dob || '');
        setGender(existing.gender || 'Male');
        setMaritalStatus(existing.maritalStatus || 'Single');
        setGovtId(existing.govtId || '');
        setOccupation(existing.occupation || '');
        setRelationshipToFamily(existing.relationshipToFamily || 'Self');
        setPhotoPreview(existing.photo || null);

        setAddress(existing.address || '');
        setGuardianName(existing.guardianName || '');
        setEmergencyContactName(existing.emergencyContactName || '');
        setEmergencyContactPhone(existing.emergencyContactPhone || '');

        setBloodGroup(existing.bloodGroup || 'O+');
        setReferringDoctor(existing.referringDoctor || '');
        setAllergies(existing.allergies ? existing.allergies.join(', ') : '');
        setConditions(existing.conditions || '');
        setPatientCategory(existing.patientCategory || 'General');

        setInsuranceProvider(existing.insuranceProvider || '');
        setPolicyNumber(existing.policyNumber || '');
        setRegisteredBy(existing.registeredBy || 'Front Desk Admin');
        setStatus(existing.status || 'Active');
      }
    }
  }, [editId, patients]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      alert('Please enter at least Full Name and Phone Number.');
      return;
    }

    setSaving(true);
    const allergiesArray = allergies
      ? allergies.split(',').map(a => a.trim()).filter(a => a)
      : [];

    const payload = {
      fullName,
      phone,
      dob,
      gender,
      maritalStatus,
      govtId,
      occupation,
      relationshipToFamily,
      photo: photoPreview,
      address,
      guardianName,
      emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
      referringDoctor,
      allergies: allergiesArray,
      conditions,
      patientCategory,
      insuranceProvider,
      policyNumber,
      registeredBy,
      status,
    };

    if (editId) {
      await updatePatient(editId, payload);
      setToast(`Patient record #${editId} updated with full registration details!`);
    } else {
      await addPatient(payload);
      setToast('New patient registered successfully with complete profile!');
    }

    setSaving(false);
    setTimeout(() => {
      navigate(editId ? `/patients/details?id=${editId}` : '/patients/list');
    }, 1500);
  };

  return (
    <div className={styles.page}>
      {toast && (
        <div className={styles.toast}>
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/patients/all" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Patients</Link> <ChevronRight size={14} /> 
            <span>{editId ? 'Edit Patient Record' : 'Register New Patient'}</span>
          </div>
          <h1 className={styles.pageTitle}>{editId ? `Edit Patient Profile #${editId}` : 'Register New Patient Profile'}</h1>
        </div>

        <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Cancel & Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.formCard}>
        {/* SECTION 1: Personal & Demographic Information */}
        <h3 className={styles.sectionTitle}>
          <User size={18} style={{ color: '#2563eb' }} /> Personal & Demographic Information
        </h3>

        {/* Photo preview upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
            {photoPreview ? (
              <img src={photoPreview} alt="Patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={32} style={{ color: '#64748b' }} />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>Patient Identification Photo</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Upload passport size photo for EMR identification</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', background: 'white' }}>
                <Camera size={13} /> Upload Photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              </label>
              {photoPreview && (
                <button type="button" className="btn btn-outline btn-sm" style={{ color: '#dc2626', borderColor: '#fecaca' }} onClick={() => setPhotoPreview(null)}>
                  <X size={13} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={styles.formGridThree}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name *</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="e.g. Priya Sharma" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Phone Number (10 Digits) *</label>
            <input 
              type="tel" 
              className={styles.input} 
              placeholder="9876543210" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Permanent Reg No. (PRN) 🔒</label>
            <input 
              type="text" 
              className={styles.input} 
              value={editId ? (patients.find(p => p.id === editId)?.regNo || `PRN-2026-${editId.replace(/\D/g, '')}`) : 'PRN-2026-AUTO (Assigned on Save)'} 
              disabled
              style={{ background: '#f0fdf4', color: '#16a34a', fontWeight: 800, borderColor: '#bbf7d0', cursor: 'not-allowed' }}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Govt ID / Aadhaar / ABHA</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="e.g. AADHAAR-8921-4321-9901" 
              value={govtId}
              onChange={e => setGovtId(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formGridThree}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Date of Birth</label>
            <input 
              type="date" 
              className={styles.input} 
              value={dob}
              onChange={e => setDob(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Calculated Age</label>
            <input 
              type="text" 
              className={styles.input} 
              style={{ fontWeight: 700, background: '#f1f5f9' }}
              value={calcAge(dob) ? `${calcAge(dob)} years` : 'Auto-computed'} 
              readOnly 
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Gender</label>
            <select 
              className={styles.select} 
              value={gender}
              onChange={e => setGender(e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className={styles.formGridThree}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Marital Status</label>
            <select 
              className={styles.select} 
              value={maritalStatus}
              onChange={e => setMaritalStatus(e.target.value)}
            >
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Occupation</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="e.g. Software Engineer, Teacher" 
              value={occupation}
              onChange={e => setOccupation(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Relationship to Family</label>
            <select 
              className={styles.select} 
              value={relationshipToFamily}
              onChange={e => setRelationshipToFamily(e.target.value)}
            >
              <option value="Self">Self (Primary Holder)</option>
              <option value="Spouse">Spouse</option>
              <option value="Child">Child</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* SECTION 2: Address & Guardian */}
        <h3 className={styles.sectionTitle}>
          <MapPin size={18} style={{ color: '#4338ca' }} /> Residential & Guardian Details
        </h3>
        <div className={styles.formGrid}>
          <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
            <label className={styles.label}>Full Residential Address</label>
            <textarea 
              className={styles.textarea} 
              placeholder="House No., Street/Colony, Landmark, City, State PIN"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Guardian Name (Required for Minors / Elderly)</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="e.g. Father, Mother, or Caretaker Name" 
              value={guardianName}
              onChange={e => setGuardianName(e.target.value)}
            />
          </div>
        </div>

        {/* SECTION 3: Clinical Profile & Category */}
        <h3 className={styles.sectionTitle}>
          <HeartPulse size={18} style={{ color: '#dc2626' }} /> Clinical Profile & Medical Category
        </h3>
        <div className={styles.formGridThree}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Patient Category *</label>
            <select 
              className={styles.select}
              style={{ fontWeight: 700, color: '#2563eb' }}
              value={patientCategory}
              onChange={e => setPatientCategory(e.target.value)}
            >
              <option value="General">General Patient</option>
              <option value="VIP">VIP ⭐</option>
              <option value="Senior Citizen">Senior Citizen 👴</option>
              <option value="Staff">Staff / Employee</option>
              <option value="Corporate / Insurance">Corporate / Insurance 🛡️</option>
              <option value="Below Poverty Line (BPL)">Below Poverty Line (BPL)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Blood Group</label>
            <select 
              className={styles.select}
              value={bloodGroup}
              onChange={e => setBloodGroup(e.target.value)}
            >
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

          <div className={styles.formGroup}>
            <label className={styles.label}>Referring Doctor</label>
            <select 
              className={styles.select}
              value={referringDoctor}
              onChange={e => setReferringDoctor(e.target.value)}
            >
              <option value="">Direct / Self-Walk In</option>
              {doctors.map(d => (
                <option key={d.id} value={d.name}>{d.name} ({d.specialty || 'General'})</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Known Drug / Environmental Allergies (Comma separated)</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="e.g. Penicillin, Sulfa drugs, Peanuts, Dust" 
              value={allergies}
              onChange={e => setAllergies(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Chronic or Past Medical Conditions</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma" 
              value={conditions}
              onChange={e => setConditions(e.target.value)}
            />
          </div>
        </div>

        {/* SECTION 4: Insurance & Billing Profile */}
        <h3 className={styles.sectionTitle}>
          <Shield size={18} style={{ color: '#059669' }} /> Insurance & Administrative Billing Details
        </h3>
        <div className={styles.formGridThree}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Insurance / TPA Provider</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="e.g. Star Health, HDFC Ergo, CGHS, ICICI Lombard" 
              value={insuranceProvider}
              onChange={e => setInsuranceProvider(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Policy / TPA ID Number</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="e.g. STAR-POL-882019-X" 
              value={policyNumber}
              onChange={e => setPolicyNumber(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Account Status</label>
            <select 
              className={styles.select}
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive / Suspended</option>
            </select>
          </div>
        </div>

        {/* SECTION 5: Emergency Contact */}
        <h3 className={styles.sectionTitle}>
          <UserCheck size={18} style={{ color: '#16a34a' }} /> Emergency Contact Information
        </h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Emergency Contact Person Name</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="e.g. Ramesh Sharma (Brother)" 
              value={emergencyContactName}
              onChange={e => setEmergencyContactName(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Emergency Contact Phone</label>
            <input 
              type="tel" 
              className={styles.input} 
              placeholder="9876543211" 
              value={emergencyContactPhone}
              onChange={e => setEmergencyContactPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className={styles.btnActions}>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : editId ? 'Update Complete Patient Profile' : 'Save & Register Complete Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
