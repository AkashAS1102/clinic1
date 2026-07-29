import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, Award, CheckCircle2, ChevronRight, 
  Search, Filter, User, Clock, Wallet, CreditCard, Plus, X, Edit2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './SalaryManagement.module.css';

export default function SalaryManagement() {
  const { payrolls, updatePayroll, addPayroll } = useApp();
  const [filter, setFilter] = useState('All');
  const [selectedPay, setSelectedPay] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Edit State
  const [baseSalary, setBaseSalary] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [status, setStatus] = useState('Paid');

  // Add State
  const [newEmpName, setNewEmpName] = useState('');
  const [newRole, setNewRole] = useState('Staff Nurse');
  const [newDept, setNewDept] = useState('General Ward');
  const [newBase, setNewBase] = useState('35000');
  const [newBank, setNewBank] = useState('HDFC •••• 5544');

  const depts = ['All', 'Reception & Patient Care', 'Pathology Lab', 'Pharmacy', 'ICU & Critical Care', 'Emergency Ward', 'Cardiology'];

  const filteredPayrolls = filter === 'All' 
    ? (payrolls || []) 
    : (payrolls || []).filter(p => p.department === filter);

  const totalBudget = (payrolls || []).reduce((acc, p) => acc + (p.netPayable || 0), 0);
  const totalPaid = (payrolls || []).filter(p => p.status === 'Paid').reduce((acc, p) => acc + (p.netPayable || 0), 0);
  const totalPendingCount = (payrolls || []).filter(p => p.status !== 'Paid').length;

  const openEditModal = (p) => {
    setSelectedPay(p);
    setBaseSalary(p.baseSalary || 0);
    setBonus(p.bonus || 0);
    setDeductions(p.deductions || 0);
    setStatus(p.status || 'Paid');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedPay) return;
    const net = Number(baseSalary) + Number(bonus) - Number(deductions);
    updatePayroll(selectedPay.id, {
      baseSalary: Number(baseSalary),
      bonus: Number(bonus),
      deductions: Number(deductions),
      netPayable: net,
      status: status,
      payDate: status === 'Paid' ? new Date().toISOString().slice(0, 10) : 'Processing',
    });
    setToast(`Updated payroll for ${selectedPay.name}. Net Payable: ₹ ${net.toLocaleString('en-IN')}`);
    setTimeout(() => setToast(null), 3500);
    setSelectedPay(null);
  };

  const handleMarkPaid = (p) => {
    updatePayroll(p.id, {
      status: 'Paid',
      payDate: new Date().toISOString().slice(0, 10),
    });
    setToast(`Processed & Dispatched ₹ ${p.netPayable.toLocaleString('en-IN')} to ${p.name}!`);
    setTimeout(() => setToast(null), 3500);
  };

  const handleCreatePayroll = (e) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;
    const baseNum = Number(newBase) || 30000;
    addPayroll({
      empId: `EMP-${Math.floor(1000 + Math.random() * 8999)}`,
      name: newEmpName.trim(),
      role: newRole,
      department: newDept,
      baseSalary: baseNum,
      bonus: 0,
      deductions: 0,
      netPayable: baseNum,
      status: 'Processing',
      month: 'July 2026',
      payDate: 'Processing',
      bankAccount: newBank || 'ICICI •••• 0000',
    });
    setToast(`Added ${newEmpName.trim()} to monthly payroll!`);
    setTimeout(() => setToast(null), 3500);
    setNewEmpName('');
    setShowAddModal(false);
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
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Dashboard</Link> <ChevronRight size={14} /> <Link to="/" style={{ color: "#2563eb", textDecoration: "none", cursor: "pointer", fontWeight: 500 }}>Hospital Head</Link> <ChevronRight size={14} /> <span>Salary & Payroll</span>
          </div>
          <h1 className={styles.pageTitle}>💰 Staff Salary & Monthly Payroll Management</h1>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> + Register New Payroll
        </button>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Wallet />
          </div>
          <div>
            <div className={styles.statTitle}>Monthly Payroll Budget</div>
            <div className={styles.statValue}>₹ {totalBudget.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle2 />
          </div>
          <div>
            <div className={styles.statTitle}>Dispatched This Month</div>
            <div className={styles.statValue}>₹ {totalPaid.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef9c3', color: '#d97706' }}>
            <Clock />
          </div>
          <div>
            <div className={styles.statTitle}>Pending Processing</div>
            <div className={styles.statValue}>{totalPendingCount} Staffs</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f3e8ff', color: '#7e22ce' }}>
            <Award />
          </div>
          <div>
            <div className={styles.statTitle}>Active Staffs on Payroll</div>
            <div className={styles.statValue}>{(payrolls || []).length} Records</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        {depts.map(d => (
          <button 
            key={d} 
            className={`${styles.filterBtn} ${filter === d ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter(d)}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee Details</th>
              <th>Department</th>
              <th>Base Salary</th>
              <th>Overtime / Bonus</th>
              <th>Deductions</th>
              <th>Net Payable</th>
              <th>Bank / Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayrolls.map(p => (
              <tr key={p.id}>
                <td>
                  <div className={styles.empName}>{p.name}</div>
                  <div className={styles.empRole}>{p.role} • <span style={{ color: '#2563eb' }}>{p.empId}</span></div>
                </td>
                <td><span style={{ fontWeight: 600 }}>{p.department}</span></td>
                <td>₹ {(p.baseSalary || 0).toLocaleString('en-IN')}</td>
                <td style={{ color: '#16a34a', fontWeight: 600 }}>+ ₹ {(p.bonus || 0).toLocaleString('en-IN')}</td>
                <td style={{ color: '#dc2626', fontWeight: 600 }}>- ₹ {(p.deductions || 0).toLocaleString('en-IN')}</td>
                <td>
                  <strong style={{ fontSize: 16, color: '#0f172a' }}>₹ {(p.netPayable || 0).toLocaleString('en-IN')}</strong>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Month: {p.month || 'July 2026'}</div>
                </td>
                <td>
                  <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 600, color: '#475569' }}>🏦 {p.bankAccount}</div>
                  <span className={`${styles.badge} ${p.status === 'Paid' ? styles.badgePaid : p.status === 'Pending' ? styles.badgePending : styles.badgeProc}`}>
                    ● {p.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className={styles.actionBtn} onClick={() => openEditModal(p)} style={{ marginRight: 8 }}>
                    <Edit2 size={13} /> Edit
                  </button>
                  {p.status !== 'Paid' && (
                    <button className={`${styles.actionBtn} ${styles.actionBtnPay}`} onClick={() => handleMarkPaid(p)}>
                      <CreditCard size={13} /> Disburse
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {selectedPay && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPay(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Edit Salary: {selectedPay.name}</h3>
              <button onClick={() => setSelectedPay(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Base Monthly Salary (₹)</label>
                  <input type="number" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={baseSalary} onChange={e => setBaseSalary(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Overtime / Bonus Pay (₹)</label>
                  <input type="number" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={bonus} onChange={e => setBonus(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Tax / Absent Deductions (₹)</label>
                  <input type="number" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={deductions} onChange={e => setDeductions(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Payment Status</label>
                  <select style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 600 }} value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="Paid">Paid</option>
                    <option value="Processing">Processing</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedPay(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Compensation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Register New Staff Payroll</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePayroll}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Employee Full Name *</label>
                <input type="text" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} placeholder="e.g. Rahul Sharma" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Job Role</label>
                  <input type="text" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={newRole} onChange={e => setNewRole(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Department</label>
                  <select style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 600 }} value={newDept} onChange={e => setNewDept(e.target.value)}>
                    {depts.filter(d => d !== 'All').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Base Monthly Salary (₹)</label>
                  <input type="number" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={newBase} onChange={e => setNewBase(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Bank Account / IFSC</label>
                  <input type="text" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14 }} value={newBank} onChange={e => setNewBank(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save to Monthly Payroll</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
