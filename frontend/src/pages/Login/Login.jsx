import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, Eye, EyeOff, ShieldCheck, Activity } from 'lucide-react';
import styles from './Login.module.css';

export default function Login() {
  const { user, login, error, setError, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/registration" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setSubmitting(true);
    await login(username.trim(), password.trim());
    setSubmitting(false);
  };

  const demoAccounts = [
    { role: 'Super Admin', user: 'admin', pass: 'admin123', color: '#dc2626' },
    { role: 'Doctor', user: 'dr.arjun', pass: 'doctor123', color: '#2563eb' },
    { role: 'Nurse', user: 'nurse.sunita', pass: 'nurse123', color: '#059669' },
    { role: 'Receptionist', user: 'reception', pass: 'reception123', color: '#7c3aed' },
    { role: 'Pharmacist', user: 'pharmacist', pass: 'pharma123', color: '#d97706' },
    { role: 'Manager', user: 'manager', pass: 'manager123', color: '#0891b2' },
  ];

  const cachedClinicInfo = JSON.parse(localStorage.getItem('clinicInfo') || 'null');
  const clinicName = cachedClinicInfo?.name || 'Aarogya Hospital';

  return (
    <div className={styles.loginPage}>
      <div className={styles.leftPanel}>
        <div className={styles.brandSection}>
          <div className={styles.logoIcon}>
            <Activity size={36} />
          </div>
          <h1 className={styles.brandTitle}>{clinicName} HMS</h1>
          <p className={styles.brandSub}>Hospital Management System</p>
        </div>
        <div className={styles.features}>
          <div className={styles.featureItem}>
            <ShieldCheck size={20} />
            <span>Role-Based Secure Access</span>
          </div>
          <div className={styles.featureItem}>
            <Activity size={20} />
            <span>Real-time Patient Tracking</span>
          </div>
          <div className={styles.featureItem}>
            <Lock size={20} />
            <span>Audit-Logged Operations</span>
          </div>
        </div>
        <p className={styles.copyright}>&copy; {new Date().getFullYear()} {clinicName}. All rights reserved.</p>
      </div>

      <div className={styles.rightPanel}>
        <form className={styles.loginCard} onSubmit={handleSubmit}>
          <h2 className={styles.cardTitle}>Sign In</h2>
          <p className={styles.cardSub}>Enter your credentials to access the system</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Username</label>
            <div className={styles.inputWrap}>
              <User size={18} className={styles.inputIcon} />
              <input
                type="text"
                className={styles.input}
                placeholder="Enter your username"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                autoFocus
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Password</label>
            <div className={styles.inputWrap}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="Enter your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.loginBtn} disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>

          <div className={styles.demoSection}>
            <p className={styles.demoTitle}>Demo Accounts</p>
            <div className={styles.demoGrid}>
              {demoAccounts.map(acc => (
                <button
                  key={acc.user}
                  type="button"
                  className={styles.demoBtn}
                  style={{ borderColor: acc.color }}
                  onClick={() => { setUsername(acc.user); setPassword(acc.pass); setError(''); }}
                >
                  <span className={styles.demoDot} style={{ background: acc.color }} />
                  <span className={styles.demoRole}>{acc.role}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
