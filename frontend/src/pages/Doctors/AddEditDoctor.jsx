import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  UserPlus, Edit2, Save, Trash2, RotateCcw, 
  CheckCircle2, AlertCircle, UserCheck, Stethoscope, 
  Clock, DollarSign, Award, Phone, Mail, FileText,
  UploadCloud, ChevronRight, Check, X, Camera
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { daysOfWeek, doctorTimeSlots, qualifications } from '../../mockData';
import styles from './AddEditDoctor.module.css';

const emptyDoctor = {
  name: '',
  gender: 'Male',
  dob: '1985-06-15',
  department: '',
  designation: 'Senior Consultant',
  qualification: 'MD, DM Cardiology',
  university: 'AIIMS Medical College',
  contact: '',
  email: '',
  address: '',
  licenseNumber: '',
  experience: '8',
  joiningDate: '2022-01-10',
  employmentType: 'Full-Time',
  specialties: ['General OPD', 'Specialized Consultation'],
  opdRoom: 'Room 102 - OPD Block A',
  availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  timeSlot: 'Full Day (09:00 - 17:00)',
  fee: 600,
  salary: '1800000',
  bankDetails: 'HDFC Bank, Acc # 5521998822, IFSC HDFC000123',
  username: '',
  password: '••••••••',
  status: 'Active',
  photo: null,
};

export default function AddEditDoctor() {
  const { doctors, addDoctor, updateDoctor, deleteDoctor, departments, designations } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const section3Ref = useRef(null);
  const section4Ref = useRef(null);

  const idParam = searchParams.get('id');
  const [mode, setMode] = useState(idParam ? 'edit' : 'add');
  const [selectedId, setSelectedId] = useState(idParam || (doctors[0]?.id || ''));
  const [form, setForm] = useState(emptyDoctor);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const [newSpecialty, setNewSpecialty] = useState('');

  useEffect(() => {
    if (idParam && doctors.some(d => d.id === idParam)) {
      setMode('edit');
      setSelectedId(idParam);
    }
  }, [idParam, doctors]);

  useEffect(() => {
    if (mode === 'edit' && selectedId) {
      const doc = doctors.find(d => d.id === selectedId);
      if (doc) {
        setForm({ ...emptyDoctor, ...doc });
      }
    } else if (mode === 'add') {
      setForm(emptyDoctor);
    }
  }, [mode, selectedId, doctors]);

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    if (error) setError('');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file must be under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, photo: reader.result }));
        setToast('Profile photo uploaded & previewed successfully!');
        setTimeout(() => setToast(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStepClick = (stepNum) => {
    setActiveStep(stepNum);
    const refs = { 1: section1Ref, 2: section2Ref, 3: section3Ref, 4: section3Ref, 5: section4Ref };
    const target = refs[stepNum];
    if (target && target.current) {
      target.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddSpecialty = (e) => {
    if (e.key === 'Enter' && newSpecialty.trim()) {
      e.preventDefault();
      if (!form.specialties.includes(newSpecialty.trim())) {
        setForm(prev => ({ ...prev, specialties: [...prev.specialties, newSpecialty.trim()] }));
      }
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (spec) => {
    setForm(prev => ({ ...prev, specialties: prev.specialties.filter(s => s !== spec) }));
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError('');
    setToast(null);
    if (newMode === 'edit' && !selectedId && doctors.length > 0) {
      setSelectedId(doctors[0].id);
    }
  };

  const handleDoctorSelectChange = (e) => {
    const newId = e.target.value;
    setSelectedId(newId);
    setSearchParams({ id: newId });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Full Name is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!form.department) {
      setError('Department is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (mode === 'add') {
      await addDoctor(form);
      setToast(`Dr. ${form.name} saved successfully to clinic roster!`);
      setForm(emptyDoctor);
    } else {
      await updateDoctor(selectedId, form);
      setToast(`Dr. ${form.name} profile updated successfully!`);
    }

    setTimeout(() => setToast(null), 4000);
  };

  const handleReset = () => {
    if (mode === 'edit' && selectedId) {
      const doc = doctors.find(d => d.id === selectedId);
      if (doc) setForm({ ...emptyDoctor, ...doc });
    } else {
      setForm(emptyDoctor);
    }
    setError('');
  };

  const handleSaveDraft = () => {
    localStorage.setItem('doc_form_draft', JSON.stringify(form));
    setToast('Doctor profile saved as draft to local storage! You can resume editing anytime.');
    setTimeout(() => setToast(null), 4000);
  };

  const steps = [
    { num: 1, label: 'Personal' },
    { num: 2, label: 'Professional' },
    { num: 3, label: 'Academic & Medical' },
    { num: 4, label: 'Consultation Assignment' },
    { num: 5, label: 'Salary & System Access' },
  ];

  return (
    <div className={styles.page}>
      {/* Toast Notification */}
      {toast && (
        <div className={styles.toast}>
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* Breadcrumb & Top Bar */}
      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/doctors/all" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Doctors</Link> <ChevronRight size={14} /> <span>{mode === 'add' ? 'Add New Doctor' : 'Edit Doctor'}</span>
          </div>
          <h1 className={styles.pageTitle}>{mode === 'add' ? 'Add New Doctor' : 'Edit Doctor Profile'}</h1>
        </div>

        {/* Mode Selector Tabs */}
        <div className={styles.modeTabs}>
          <button 
            type="button"
            className={`${styles.tabBtn} ${mode === 'add' ? styles.tabActive : ''}`}
            onClick={() => handleModeSwitch('add')}
          >
            <UserPlus size={16} /> Add New Doctor
          </button>
          <button 
            type="button"
            className={`${styles.tabBtn} ${mode === 'edit' ? styles.tabActive : ''}`}
            onClick={() => handleModeSwitch('edit')}
          >
            <Edit2 size={16} /> Edit Existing Doctor
          </button>
        </div>
      </div>

      {/* Doctor Selector in Edit Mode */}
      {mode === 'edit' && (
        <div className={styles.selectBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: '#1e293b' }}>
            <UserCheck size={18} style={{ color: '#2563eb' }} />
            <span>Select Physician Profile to Modify:</span>
          </div>
          <select className="form-select" style={{ width: 'auto', minWidth: 300, fontWeight: 600 }} value={selectedId} onChange={handleDoctorSelectChange}>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                Dr. {d.name} ({d.department}) — #{d.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Step Progress Indicator Bar */}
      <div className={styles.stepBar}>
        {steps.map((s, idx) => (
          <React.Fragment key={s.num}>
            <div 
              className={`${styles.stepItem} ${activeStep === s.num ? styles.stepActive : ''}`}
              onClick={() => handleStepClick(s.num)}
            >
              <div className={styles.stepNum}>{s.num}</div>
              <span className={styles.stepText}>{s.label}</span>
            </div>
            {idx < steps.length - 1 && <div className={styles.stepDivider}></div>}
          </React.Fragment>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 18px', borderRadius: 10, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSave}>
        {/* Section 1: Personal Information */}
        <div className={styles.formSection} ref={section1Ref}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>1. Personal Information</h3>
            <span className={styles.reqNotice}>* Required Fields</span>
          </div>

          <div className={styles.personalGrid}>
            {/* Drag & Drop Photo Box with real file input */}
            <div className={styles.dragBox} onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              {form.photo ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <img src={form.photo} alt="Upload Preview" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #2563eb' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>Click to Change Photo</span>
                </div>
              ) : (
                <>
                  <UploadCloud size={38} className={styles.dragIcon} />
                  <span className={styles.dragText}>Click or Browse to upload photo</span>
                  <span className={styles.dragSub}>JPG, PNG UP TO 5MB</span>
                </>
              )}
            </div>

            {/* Fields Grid */}
            <div className={styles.fieldsGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name <span className={styles.req}>*</span></label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  placeholder="e.g. Dr. Jonathan Smith" 
                  value={form.name} 
                  onChange={e => handleChange('name', e.target.value)}
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Gender <span className={styles.req}>*</span></label>
                <select 
                  className={styles.formSelect} 
                  value={form.gender || 'Male'} 
                  onChange={e => handleChange('gender', e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Prefer not to say</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Date of Birth <span className={styles.req}>*</span></label>
                <input 
                  type="date" 
                  className={styles.formInput} 
                  value={form.dob || '1985-06-15'} 
                  onChange={e => handleChange('dob', e.target.value)} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mobile Number <span className={styles.req}>*</span></label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  placeholder="+91 98765 43210" 
                  value={form.contact || ''} 
                  onChange={e => handleChange('contact', e.target.value)} 
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label className={styles.formLabel}>Email Address <span className={styles.req}>*</span></label>
                <input 
                  type="email" 
                  className={styles.formInput} 
                  placeholder="j.smith@clinic.in" 
                  value={form.email || ''} 
                  onChange={e => handleChange('email', e.target.value)} 
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label className={styles.formLabel}>Home Address <span className={styles.req}>*</span></label>
                <textarea 
                  className={styles.formTextarea} 
                  placeholder="Street, City, State, ZIP Code" 
                  value={form.address || ''} 
                  onChange={e => handleChange('address', e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Professional Information */}
        <div className={styles.formSection} ref={section2Ref}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>2. Professional Information</h3>
          </div>

          <div className={styles.fieldsGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Employee ID / Doctor ID <span className={styles.req}>*</span></label>
              <input 
                type="text" 
                className={styles.formInput} 
                value={mode === 'edit' ? selectedId : 'EMP-2024-001 (Auto-generated)'} 
                disabled 
                style={{ background: '#f1f5f9', color: '#64748b' }} 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Department <span className={styles.req}>*</span></label>
              <select 
                className={styles.formSelect} 
                value={form.department} 
                onChange={e => handleChange('department', e.target.value)}
                required
              >
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Designation <span className={styles.req}>*</span></label>
              <select 
                className={styles.formSelect} 
                value={form.designation || ''} 
                onChange={e => handleChange('designation', e.target.value)}
              >
                <option value="">Select Designation</option>
                {designations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Joining Date <span className={styles.req}>*</span></label>
              <input 
                type="date" 
                className={styles.formInput} 
                value={form.joiningDate || '2022-01-10'} 
                onChange={e => handleChange('joiningDate', e.target.value)} 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Employment Type <span className={styles.req}>*</span></label>
              <select 
                className={styles.formSelect} 
                value={form.employmentType || 'Full-Time'} 
                onChange={e => handleChange('employmentType', e.target.value)}
              >
                <option value="Full-Time">Full-Time Staff</option>
                <option value="Part-Time">Part-Time Roster</option>
                <option value="Visiting">On-Call Visiting Specialist</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Experience (Years) <span className={styles.req}>*</span></label>
              <input 
                type="number" 
                className={styles.formInput} 
                placeholder="e.g. 12" 
                value={form.experience || ''} 
                onChange={e => handleChange('experience', e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Section 3 & 4: Dual Grid for Academic & Consultation Assignment */}
        <div className={styles.dualSectionGrid} ref={section3Ref}>
          {/* Card Left: Academic & Medical Details */}
          <div className={styles.subCard}>
            <h4 className={styles.subCardTitle}>3. Academic & Medical Details</h4>
            
            <div className={styles.formGroup} style={{ marginBottom: 14 }}>
              <label className={styles.formLabel}>Highest Qualification <span className={styles.req}>*</span></label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="e.g. Ph.D. / DM in Cardiology" 
                value={form.qualification || ''} 
                onChange={e => handleChange('qualification', e.target.value)} 
              />
            </div>

            <div className={styles.formGroup} style={{ marginBottom: 14 }}>
              <label className={styles.formLabel}>University / Medical Board <span className={styles.req}>*</span></label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="AIIMS / Oxford University" 
                value={form.university || 'AIIMS Medical College'} 
                onChange={e => handleChange('university', e.target.value)} 
              />
            </div>

            <div className={styles.formGroup} style={{ marginBottom: 14 }}>
              <label className={styles.formLabel}>Medical License Number <span className={styles.req}>*</span></label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="MCI-MH-89210" 
                value={form.licenseNumber || ''} 
                onChange={e => handleChange('licenseNumber', e.target.value)} 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Certifications / Fellowships</label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="List certifications separated by commas" 
                value={form.certifications || 'ACLS, BLS, Fellow of Cardiology Society'} 
                onChange={e => handleChange('certifications', e.target.value)} 
              />
            </div>

            <div className={styles.formGroup} style={{ marginTop: 14 }}>
              <label className={styles.formLabel}>Upload Certificates & Documents</label>
              <div className={styles.fileUploadBox}>
                <input 
                  type="file" 
                  multiple 
                  className={styles.fileInput} 
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    const fileNames = files.map(f => f.name);
                    handleChange('documents', [...(form.documents || []), ...fileNames]);
                  }}
                  id="docDocsUpload"
                />
                <label htmlFor="docDocsUpload" className={styles.fileUploadLabel}>
                  <UploadCloud size={20} />
                  <span>Choose files or drag & drop</span>
                </label>
              </div>
              {form.documents && form.documents.length > 0 && (
                <div className={styles.fileList}>
                  {form.documents.map((docName, idx) => (
                    <div key={idx} className={styles.fileItem}>
                      <FileText size={14} />
                      <span>{docName}</span>
                      <X size={14} className={styles.fileRemove} onClick={() => {
                        const newDocs = form.documents.filter((_, i) => i !== idx);
                        handleChange('documents', newDocs);
                      }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card Right: Consultation Assignment */}
          <div className={styles.subCard}>
            <h4 className={styles.subCardTitle}>4. Consultation Assignment</h4>

            <div className={styles.formGroup} style={{ marginBottom: 14 }}>
              <label className={styles.formLabel}>Specialties (Multi-select) — Press Enter to add</label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="+ Add specialty and press Enter..." 
                value={newSpecialty} 
                onChange={e => setNewSpecialty(e.target.value)}
                onKeyDown={handleAddSpecialty}
              />
              <div className={styles.specialtyChips}>
                {(form.specialties || ['General Consultation', 'Specialized Care']).map(spec => (
                  <span key={spec} className={styles.chip}>
                    {spec} <X size={13} className={styles.chipRemove} onClick={() => removeSpecialty(spec)} />
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: 14 }}>
              <label className={styles.formLabel}>Assigned OPD Ward / Room <span className={styles.req}>*</span></label>
              <select 
                className={styles.formSelect} 
                value={form.opdRoom || 'Room 102 - OPD Block A'} 
                onChange={e => handleChange('opdRoom', e.target.value)}
              >
                <option value="Room 101 - OPD Block A">Room 101 - OPD Block A</option>
                <option value="Room 102 - OPD Block A">Room 102 - OPD Block A</option>
                <option value="Room 205 - Cardiac Suite">Room 205 - Cardiac Suite</option>
                <option value="Room 304 - Pediatric Ward">Room 304 - Pediatric Ward</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Consultation Fee (₹) <span className={styles.req}>*</span></label>
              <input 
                type="number" 
                className={styles.formInput} 
                placeholder="600" 
                value={form.fee || ''} 
                onChange={e => handleChange('fee', e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Section 5: Salary & System Access */}
        <div className={styles.formSection} ref={section4Ref}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>5. Salary & System Access</h3>
          </div>

          <div className={styles.fieldsGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Annual Honorarium / Salary (₹)</label>
              <input 
                type="number" 
                className={styles.formInput} 
                placeholder="1800000" 
                value={form.salary || ''} 
                onChange={e => handleChange('salary', e.target.value)} 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Bank Details (Bank Name, Acc #, IFSC)</label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="National Bank, 123456789, NB-098765" 
                value={form.bankDetails || ''} 
                onChange={e => handleChange('bankDetails', e.target.value)} 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>System Role <span className={styles.req}>*</span></label>
              <select 
                className={styles.formSelect} 
                value={form.role || 'Doctor'} 
                onChange={e => handleChange('role', e.target.value)}
              >
                <option value="Doctor">Doctor / Medical Specialist</option>
                <option value="Department Head">Department Head / Chief Medical Officer</option>
                <option value="Visiting Consultant">Visiting Consultant</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Username <span className={styles.req}>*</span></label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="e.g. j.smith" 
                value={form.username || form.email?.split('@')[0] || 'a.mehta'} 
                onChange={e => handleChange('username', e.target.value)} 
              />
            </div>

            <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
              <label className={styles.formLabel}>Password <span className={styles.req}>*</span></label>
              <input 
                type="password" 
                className={styles.formInput} 
                placeholder="••••••••" 
                value={form.password || '••••••••'} 
                onChange={e => handleChange('password', e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Bottom Form Action Bar */}
        <div className={styles.formBar}>
          <div className={styles.barLeft}>
            {/* Reset button removed by user request */}
          </div>

          <div className={styles.barRight}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/doctors/all')}>
              Cancel
            </button>
            <button type="button" className={styles.btnDraft} onClick={handleSaveDraft}>
              Save as Draft
            </button>
            <button type="submit" className={styles.btnSave}>
              <Save size={16} /> {mode === 'add' ? 'Save Doctor' : 'Update Doctor Profile'}
            </button>
            <label className={styles.activeToggle}>
              <input 
                type="checkbox" 
                className={styles.checkbox}
                checked={form.status === 'Active'} 
                onChange={e => handleChange('status', e.target.checked ? 'Active' : 'Inactive')} 
              />
              Active Status
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
