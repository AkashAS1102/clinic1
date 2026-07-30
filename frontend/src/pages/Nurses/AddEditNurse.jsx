import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  UserPlus, Edit2, Save, Trash2, RotateCcw, 
  CheckCircle2, AlertCircle, UserCheck, Stethoscope, 
  Clock, DollarSign, Award, Phone, Mail, FileText,
  UploadCloud, ChevronRight, Check, X, Camera
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './AddEditNurse.module.css';

const emptyNurse = {
  name: '',
  gender: 'Female',
  dob: '1992-04-18',
  department: 'ICU & Critical Care',
  designation: 'Senior Staff Nurse (RN)',
  qualification: 'B.Sc Nursing, RN',
  university: 'State Medical Nursing College',
  contact: '',
  email: '',
  address: '',
  licenseNumber: '',
  experience: '5',
  joiningDate: '2022-03-01',
  employmentType: 'Full-Time',
  specialties: ['ICU Monitoring', 'Ventilator Care', 'IV Cannulation'],
  assignedWard: 'Ward A - ICU Suite',
  availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  shift: 'Morning (06:00 - 14:00)',
  salary: '650000',
  bankDetails: 'ICICI Bank, Acc # 3344556677, IFSC ICIC000012',
  username: '',
  password: '••••••••',
  status: 'Active',
  photo: null,
};

const nurseWards = [
  'Ward A - ICU Suite',
  'Emergency Block - Ground',
  'Ward B - Pediatrics',
  'Cardiology OPD - Room 102',
  'General Medicine Ward',
  'Operation Theatre / Recovery Suite'
];

const nurseShifts = [
  'Morning (06:00 - 14:00)',
  'Afternoon (14:00 - 22:00)',
  'Night (22:00 - 06:00)',
  'Full Day (08:00 - 20:00)'
];

export default function AddEditNurse() {
  const { nurses, addNurse, updateNurse } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const section3Ref = useRef(null);
  const section4Ref = useRef(null);

  const idParam = searchParams.get('id');
  const [mode, setMode] = useState(idParam ? 'edit' : 'add');
  const [selectedId, setSelectedId] = useState(idParam || (nurses[0]?.id || ''));
  const [form, setForm] = useState(emptyNurse);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const [newSpecialty, setNewSpecialty] = useState('');

  useEffect(() => {
    if (idParam && nurses.some(n => n.id === idParam)) {
      setMode('edit');
      setSelectedId(idParam);
    }
  }, [idParam, nurses]);

  useEffect(() => {
    if (mode === 'edit' && selectedId) {
      const target = nurses.find(n => n.id === selectedId);
      if (target) {
        setForm({ ...emptyNurse, ...target });
      }
    } else if (mode === 'add') {
      setForm(emptyNurse);
    }
  }, [mode, selectedId, nurses]);

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
    if (newMode === 'edit' && !selectedId && nurses.length > 0) {
      setSelectedId(nurses[0].id);
    }
  };

  const handleSelectChange = (e) => {
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
      setError('Department / Ward is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (mode === 'add') {
      await addNurse(form);
      setToast(`Nurse ${form.name} saved successfully to clinic roster!`);
      setForm(emptyNurse);
    } else {
      await updateNurse(selectedId, form);
      setToast(`Nurse ${form.name} profile updated successfully!`);
    }

    setTimeout(() => setToast(null), 4000);
  };

  const handleReset = () => {
    if (mode === 'edit' && selectedId) {
      const target = nurses.find(n => n.id === selectedId);
      if (target) setForm({ ...emptyNurse, ...target });
    } else {
      setForm(emptyNurse);
    }
    setError('');
  };

  const handleSaveDraft = () => {
    localStorage.setItem('nurse_form_draft', JSON.stringify(form));
    setToast('Nurse profile saved as draft to local storage! You can resume editing anytime.');
    setTimeout(() => setToast(null), 4000);
  };

  const steps = [
    { num: 1, label: 'Personal' },
    { num: 2, label: 'Professional' },
    { num: 3, label: 'Academic & License' },
    { num: 4, label: 'Ward & Shift Assignment' },
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
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/nurses/all" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Nurses</Link> <ChevronRight size={14} /> <span>{mode === 'add' ? 'Add New Nurse' : 'Edit Nurse Profile'}</span>
          </div>
          <h1 className={styles.pageTitle}>{mode === 'add' ? 'Add New Nurse' : 'Edit Nursing Staff Profile'}</h1>
        </div>

        {/* Mode Selector Tabs */}
        <div className={styles.modeTabs}>
          <button 
            type="button"
            className={`${styles.tabBtn} ${mode === 'add' ? styles.tabActive : ''}`}
            onClick={() => handleModeSwitch('add')}
          >
            <UserPlus size={16} /> Add New Nurse
          </button>
          <button 
            type="button"
            className={`${styles.tabBtn} ${mode === 'edit' ? styles.tabActive : ''}`}
            onClick={() => handleModeSwitch('edit')}
          >
            <Edit2 size={16} /> Edit Existing Nurse
          </button>
        </div>
      </div>

      {/* Nurse Selector in Edit Mode */}
      {mode === 'edit' && (
        <div className={styles.selectBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: '#1e293b' }}>
            <UserCheck size={18} style={{ color: '#2563eb' }} />
            <span>Select Nursing Staff Profile to Modify:</span>
          </div>
          <select className="form-select" style={{ width: 'auto', minWidth: 300, fontWeight: 600 }} value={selectedId} onChange={handleSelectChange}>
            {nurses.map(n => (
              <option key={n.id} value={n.id}>
                Nurse {n.name} ({n.department}) — #{n.id}
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
                <label className={styles.formLabel}>Full Legal Name <span className={styles.req}>*</span></label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  placeholder="e.g. Sunita Menon" 
                  value={form.name} 
                  onChange={e => handleChange('name', e.target.value)}
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Gender <span className={styles.req}>*</span></label>
                <select 
                  className={styles.formSelect} 
                  value={form.gender || 'Female'} 
                  onChange={e => handleChange('gender', e.target.value)}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other / Prefer not to say</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Date of Birth <span className={styles.req}>*</span></label>
                <input 
                  type="date" 
                  className={styles.formInput} 
                  value={form.dob || '1992-04-18'} 
                  onChange={e => handleChange('dob', e.target.value)} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mobile Phone <span className={styles.req}>*</span></label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  placeholder="+91 98111 22334" 
                  value={form.contact || ''} 
                  onChange={e => handleChange('contact', e.target.value)} 
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label className={styles.formLabel}>Email Address <span className={styles.req}>*</span></label>
                <input 
                  type="email" 
                  className={styles.formInput} 
                  placeholder="sunita.menon@clinic.in" 
                  value={form.email || ''} 
                  onChange={e => handleChange('email', e.target.value)} 
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label className={styles.formLabel}>Residential Home Address <span className={styles.req}>*</span></label>
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
              <label className={styles.formLabel}>Nurse ID / Employee Number <span className={styles.req}>*</span></label>
              <input 
                type="text" 
                className={styles.formInput} 
                value={mode === 'edit' ? selectedId : 'NUR-2026-001 (Auto-generated)'} 
                disabled 
                style={{ background: '#f1f5f9', color: '#64748b' }} 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Assigned Department / Unit <span className={styles.req}>*</span></label>
              <select 
                className={styles.formSelect} 
                value={form.department} 
                onChange={e => handleChange('department', e.target.value)}
                required
              >
                <option value="">Select Ward / Unit</option>
                <option value="ICU & Critical Care">ICU & Critical Care</option>
                <option value="Emergency Ward">Emergency Ward</option>
                <option value="Pediatric Ward">Pediatric Ward</option>
                <option value="Cardiology OPD">Cardiology OPD</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Operation Theatre">Operation Theatre / Recovery</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Designation <span className={styles.req}>*</span></label>
              <select 
                className={styles.formSelect} 
                value={form.designation || 'Senior Staff Nurse (RN)'} 
                onChange={e => handleChange('designation', e.target.value)}
              >
                <option value="Senior Staff Nurse (RN)">Senior Staff Nurse (RN)</option>
                <option value="Junior Staff Nurse (GNM)">Junior Staff Nurse (GNM)</option>
                <option value="ICU Specialist Nurse">ICU Specialist Nurse</option>
                <option value="Nurse Supervisor / Head Nurse">Nurse Supervisor / Head Nurse</option>
                <option value="Visiting / On-Call Nurse">Visiting / On-Call Nurse</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Joining Date <span className={styles.req}>*</span></label>
              <input 
                type="date" 
                className={styles.formInput} 
                value={form.joiningDate || '2022-03-01'} 
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
                <option value="On-Call">On-Call / Reliever</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Clinical Experience (Years) <span className={styles.req}>*</span></label>
              <input 
                type="number" 
                className={styles.formInput} 
                placeholder="e.g. 7" 
                value={form.experience || ''} 
                onChange={e => handleChange('experience', e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Section 3 & 4: Dual Grid for Academic & Ward Assignment */}
        <div className={styles.dualSectionGrid} ref={section3Ref}>
          {/* Card Left: Academic & License Details */}
          <div className={styles.subCard}>
            <h4 className={styles.subCardTitle}>3. Academic & License Details</h4>
            
            <div className={styles.formGroup} style={{ marginBottom: 14 }}>
              <label className={styles.formLabel}>Highest Nursing Qualification <span className={styles.req}>*</span></label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="e.g. B.Sc Nursing, RN / GNM" 
                value={form.qualification || ''} 
                onChange={e => handleChange('qualification', e.target.value)} 
              />
            </div>

            <div className={styles.formGroup} style={{ marginBottom: 14 }}>
              <label className={styles.formLabel}>Nursing College / Medical Board <span className={styles.req}>*</span></label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="State Medical Nursing Council" 
                value={form.university || 'State Medical Nursing College'} 
                onChange={e => handleChange('university', e.target.value)} 
              />
            </div>

            <div className={styles.formGroup} style={{ marginBottom: 14 }}>
              <label className={styles.formLabel}>State RN/GNM License Number <span className={styles.req}>*</span></label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="RN-MH-44210" 
                value={form.licenseNumber || ''} 
                onChange={e => handleChange('licenseNumber', e.target.value)} 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Special Certifications</label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="ACLS, BLS, Pediatric Critical Care" 
                value={form.certifications || 'ACLS, BLS Certified'} 
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
                  id="nurseDocsUpload"
                />
                <label htmlFor="nurseDocsUpload" className={styles.fileUploadLabel}>
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

          {/* Card Right: Ward & Shift Assignment */}
          <div className={styles.subCard}>
            <h4 className={styles.subCardTitle}>4. Ward & Shift Assignment</h4>

            <div className={styles.formGroup} style={{ marginBottom: 14 }}>
              <label className={styles.formLabel}>Ward Skills (Multi-select) — Press Enter to add</label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="+ Add skill (e.g. IV Cannulation) and press Enter..." 
                value={newSpecialty} 
                onChange={e => setNewSpecialty(e.target.value)}
                onKeyDown={handleAddSpecialty}
              />
              <div className={styles.specialtyChips}>
                {(form.specialties || ['ICU Monitoring', 'Ventilator Care', 'IV Cannulation']).map(spec => (
                  <span key={spec} className={styles.chip}>
                    {spec} <X size={13} className={styles.chipRemove} onClick={() => removeSpecialty(spec)} />
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: 14 }}>
              <label className={styles.formLabel}>Assigned Ward / Suite <span className={styles.req}>*</span></label>
              <select 
                className={styles.formSelect} 
                value={form.assignedWard || 'Ward A - ICU Suite'} 
                onChange={e => handleChange('assignedWard', e.target.value)}
              >
                {nurseWards.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Shift Schedule Roster <span className={styles.req}>*</span></label>
              <select 
                className={styles.formSelect} 
                value={form.shift || 'Morning (06:00 - 14:00)'} 
                onChange={e => handleChange('shift', e.target.value)}
              >
                {nurseShifts.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
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
              <label className={styles.formLabel}>Annual Salary (₹)</label>
              <input 
                type="number" 
                className={styles.formInput} 
                placeholder="650000" 
                value={form.salary || ''} 
                onChange={e => handleChange('salary', e.target.value)} 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Bank Details (Bank Name, Acc #, IFSC)</label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="ICICI Bank, 3344556677, ICIC000012" 
                value={form.bankDetails || ''} 
                onChange={e => handleChange('bankDetails', e.target.value)} 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>System Role <span className={styles.req}>*</span></label>
              <select 
                className={styles.formSelect} 
                value={form.role || 'Nurse'} 
                onChange={e => handleChange('role', e.target.value)}
              >
                <option value="Nurse">Nurse / Medical Specialist</option>
                <option value="Head Nurse">Head Nurse / Ward Supervisor</option>
                <option value="Nurse Assistant">Nurse Assistant (ANM/GNM)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Username <span className={styles.req}>*</span></label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="e.g. s.menon" 
                value={form.username || form.email?.split('@')[0] || 's.menon'} 
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
            <button type="button" className="btn btn-outline" onClick={() => navigate('/nurses/all')}>
              Cancel
            </button>
            <button type="button" className={styles.btnDraft} onClick={handleSaveDraft}>
              Save as Draft
            </button>
            <button type="submit" className={styles.btnSave}>
              <Save size={16} /> {mode === 'add' ? 'Save Nurse' : 'Update Nursing Profile'}
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
