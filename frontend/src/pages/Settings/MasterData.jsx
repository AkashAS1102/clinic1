import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Trash2, Plus } from 'lucide-react';
import styles from './MasterData.module.css';

export default function MasterData() {
  const { 
    departments, setDepartments, 
    designations, setDesignations,
    blocks, setBlocks,
    floors, setFloors
  } = useApp();
  const [activeTab, setActiveTab] = useState('departments');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (!newValue.trim()) return;
    const value = newValue.trim();

    if (activeTab === 'departments') {
      if (!departments.includes(value)) {
        setDepartments([...departments, value]);
      }
    } else if (activeTab === 'designations') {
      if (!designations.includes(value)) setDesignations([...designations, value]);
    } else if (activeTab === 'blocks') {
      if (!blocks.includes(value)) setBlocks([...blocks, value]);
    } else if (activeTab === 'floors') {
      if (!floors.includes(value)) setFloors([...floors, value]);
    }
    setNewValue('');
  };

  const handleDelete = (item) => {
    if (activeTab === 'departments') {
      setDepartments(departments.filter(d => d !== item));
    } else if (activeTab === 'designations') {
      setDesignations(designations.filter(d => d !== item));
    } else if (activeTab === 'blocks') {
      setBlocks(blocks.filter(b => b !== item));
    } else if (activeTab === 'floors') {
      setFloors(floors.filter(f => f !== item));
    }
  };

  const list = activeTab === 'departments' ? departments 
             : activeTab === 'designations' ? designations 
             : activeTab === 'blocks' ? blocks 
             : floors;
  const label = activeTab === 'departments' ? 'Department' 
              : activeTab === 'designations' ? 'Designation' 
              : activeTab === 'blocks' ? 'Block' 
              : 'Floor';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className="page-title">Master Data & Setup</h1>
        <p className="page-subtitle">Manage system departments, staff designations, and hospital structure (blocks/floors).</p>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'departments' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('departments'); setNewValue(''); }}
        >
          Departments
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'designations' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('designations'); setNewValue(''); }}
        >
          Designations
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'blocks' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('blocks'); setNewValue(''); }}
        >
          Blocks
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'floors' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('floors'); setNewValue(''); }}
        >
          Floors
        </button>
      </div>

      <div className={styles.card}>
        <ul className={styles.list}>
          {list.map((item, i) => (
            <li key={i} className={styles.listItem}>
              <span>{item}</span>
              <button 
                className={styles.deleteBtn} 
                onClick={() => handleDelete(item)}
                title={`Delete ${label}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
          {list.length === 0 && (
            <li style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
              No {label.toLowerCase()}s found. Add one below.
            </li>
          )}
        </ul>

        <div className={styles.addForm}>
          <input 
            type="text"
            className={`form-input ${styles.addInput}`}
            placeholder={`New ${label} name...`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={16} />
            Add {label}
          </button>
        </div>
      </div>
    </div>
  );
}
