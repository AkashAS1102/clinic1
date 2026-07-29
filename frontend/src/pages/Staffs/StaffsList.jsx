import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, Search, Plus, Filter, Trash2, Edit2, 
  ChevronRight, Phone, Mail, CheckCircle2, X, UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './StaffsList.module.css';

export default function StaffsList() {
  const { staffs, addStaff, updateStaff, deleteStaff } = useApp();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal form state
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Reception & Admin');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [shift, setShift] = useState('Morning (08:00 AM - 04:00 PM)');
  const [salary, setSalary] = useState('₹ 35,000 / mo');

  const filteredStaffs = (staffs || []).filter(s => {
    if (!s) return false;
    const matchesSearch = (s.fullName || '').toLowerCase().includes(search.toLowerCase()) || 
                          (s.role || '').toLowerCase().includes(search.toLowerCase()) ||
                          (s.id || '').toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter ? s.department === deptFilter : true;
    const matchesStatus = statusFilter ? s.status === statusFilter : true;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!fullName || !role) {
      alert('Please provide Name and Role.');
      return;
    }
    addStaff({
      fullName,
      role,
      department,
      phone: phone || '9876543210',
      email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@aarogyaclinic.in`,
      shift,
      status: 'Active',
      salary,
      joinDate: new Date().toISOString().slice(0, 10),
    });
    setShowModal(false);
    setFullName('');
    setRole('');
    setPhone('');
    setEmail('');
    setToast('New staff member added to clinic roster!');
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to remove staff member ${name}?`)) {
      deleteStaff(id);
      setToast(`Removed ${name} from records.`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const toggleStatus = (staff) => {
    const newStatus = staff.status === 'Active' ? 'On Leave' : 'Active';
    updateStaff(staff.id, { status: newStatus });
    setToast(`Status for ${staff.fullName} changed to ${newStatus}.`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className={styles.page}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#10b981', color: 'white', padding: '14px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      <div className={styles.topBar}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Hospital Head</Link> <ChevronRight size={14} /> <span>Staff Management</span>
          </div>
          <h1 className={styles.pageTitle}>🧑‍💼 Support Staffs & HR Roster ({staffs.length})</h1>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add New Staff
        </button>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <Search size={16} style={{ color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Search by name, role or ID..." 
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className={styles.select} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          <option value="Reception & Admin">Reception & Admin</option>
          <option value="Pathology & Diagnostic Lab">Pathology & Diagnostic Lab</option>
          <option value="Pharmacy & Billing">Pharmacy & Billing</option>
          <option value="Radiology & Imaging">Radiology & Imaging</option>
          <option value="Sanitation & Facility">Sanitation & Facility</option>
        </select>

        <select className={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="On Leave">On Leave</option>
        </select>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>STAFF ID</th>
              <th>NAME & CONTACT</th>
              <th>ROLE & DEPARTMENT</th>
              <th>ASSIGNED SHIFT</th>
              <th>COMPENSATION</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaffs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  No staff members match the current search filters.
                </td>
              </tr>
            ) : (
              filteredStaffs.map(staff => (
                <tr key={staff.id}>
                  <td style={{ fontWeight: 800, color: '#2563eb' }}>#{staff.id}</td>
                  <td>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>{staff.fullName}</div>
                    <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Phone size={12} /> +91 {staff.phone}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#334155' }}>{staff.role}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{staff.department}</div>
                  </td>
                  <td style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                    {staff.shift}
                  </td>
                  <td style={{ fontWeight: 700, color: '#059669' }}>
                    {staff.salary}
                  </td>
                  <td>
                    <button 
                      onClick={() => toggleStatus(staff)} 
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                      title="Click to toggle status"
                    >
                      <span className={`${styles.badge} ${staff.status === 'Active' ? styles.badgeActive : styles.badgeLeave}`}>
                        ● {staff.status}
                      </span>
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button className={styles.actionBtn} onClick={() => toggleStatus(staff)} title="Toggle Leave Status">
                        <UserCheck size={16} />
                      </button>
                      <button className={styles.actionBtn} style={{ color: '#dc2626' }} onClick={() => handleDelete(staff.id, staff.fullName)} title="Delete Record">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              <span>Add Hospital Staff Member</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name *</label>
                <input type="text" className={styles.input} placeholder="e.g. Ramesh Kumar" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Job Title / Role *</label>
                <input type="text" className={styles.input} placeholder="e.g. Senior Receptionist" value={role} onChange={e => setRole(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Department</label>
                  <select className={styles.input} value={department} onChange={e => setDepartment(e.target.value)}>
                    <option value="Reception & Admin">Reception & Admin</option>
                    <option value="Pathology & Diagnostic Lab">Pathology & Diagnostic Lab</option>
                    <option value="Pharmacy & Billing">Pharmacy & Billing</option>
                    <option value="Radiology & Imaging">Radiology & Imaging</option>
                    <option value="Sanitation & Facility">Sanitation & Facility</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Shift Schedule</label>
                  <select className={styles.input} value={shift} onChange={e => setShift(e.target.value)}>
                    <option value="Morning (08:00 AM - 04:00 PM)">Morning (08:00 AM - 04:00 PM)</option>
                    <option value="General (09:00 AM - 05:00 PM)">General (09:00 AM - 05:00 PM)</option>
                    <option value="Evening (03:00 PM - 11:00 PM)">Evening (03:00 PM - 11:00 PM)</option>
                    <option value="Night (10:00 PM - 06:00 AM)">Night (10:00 PM - 06:00 AM)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <input type="tel" className={styles.input} placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Monthly Salary</label>
                  <input type="text" className={styles.input} placeholder="e.g. ₹ 35,000 / mo" value={salary} onChange={e => setSalary(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Staff Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
