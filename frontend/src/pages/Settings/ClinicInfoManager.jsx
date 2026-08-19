import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../api/api';
import { 
  Settings, Building2, Phone, Mail, FileText, Check, AlertCircle, Save
} from 'lucide-react';
import styles from './DeptDesig.module.css';

export default function ClinicInfoManager() {
  const { clinicInfo, setClinicInfo } = useApp();
  const [formData, setFormData] = useState(clinicInfo);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (clinicInfo) {
      setFormData(clinicInfo);
    }
  }, [clinicInfo]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('Clinic Name is required', 'error');
      return;
    }
    try {
      await apiService.updateClinicInfo(formData);
    } catch (e) {
      console.warn('Offline fallback saving clinic info', e);
    }
    setClinicInfo(formData);
    showToast('Clinic Info updated successfully!');
  };

  return (
    <div className={styles.page}>
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastInfo}`}>
          {toast.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />} {toast.msg}
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon} style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
            <Settings size={20} />
          </div>
          <div>
            <h1 className={styles.title}>Clinic Info</h1>
            <p className={styles.subtitle}>Update the branding and contact details for your hospital</p>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid var(--border)', maxWidth: 600 }}>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            <Building2 size={14} /> Clinic / Hospital Name
          </label>
          <input 
            className={styles.addInput}
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Aarogya Hospital"
            style={{ width: '100%', marginBottom: 0 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            <FileText size={14} /> Registration No (Displays in Sidebar)
          </label>
          <input 
            className={styles.addInput}
            value={formData.regNo || ''}
            onChange={(e) => handleChange('regNo', e.target.value)}
            placeholder="e.g. MH/2024/8829"
            style={{ width: '100%', marginBottom: 0 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            <Building2 size={14} /> Address
          </label>
          <textarea 
            className={styles.addInput}
            value={formData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Complete address..."
            style={{ width: '100%', marginBottom: 0, minHeight: 80, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              <Phone size={14} /> Phone
            </label>
            <input 
              className={styles.addInput}
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Contact number"
              style={{ width: '100%', marginBottom: 0 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              <Mail size={14} /> Email
            </label>
            <input 
              className={styles.addInput}
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Email address"
              style={{ width: '100%', marginBottom: 0 }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            <FileText size={14} /> GSTIN
          </label>
          <input 
            className={styles.addInput}
            value={formData.gstin || ''}
            onChange={(e) => handleChange('gstin', e.target.value)}
            placeholder="GST Identification Number"
            style={{ width: '100%', marginBottom: 0 }}
          />
        </div>

        <button 
          onClick={handleSave}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            background: 'var(--primary)', color: 'white', 
            padding: '10px 20px', borderRadius: 8, 
            border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 
          }}
        >
          <Save size={16} /> Save Clinic Info
        </button>

      </div>
    </div>
  );
}
