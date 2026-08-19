import { Search, Bell, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import styles from './TopBar.module.css';

export default function TopBar() {
  const { clinicInfo } = useApp();
  return (
    <header className={styles.topbar}>
      <div className={styles.title}>{clinicInfo?.name || 'Hospital'} Management System</div>
      <div className={styles.search}>
        <Search size={15} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search patients, doctors..."
          className={styles.searchInput}
        />
      </div>
      <div className={styles.actions}>
        <button className={styles.iconBtn} aria-label="Notifications">
          <Bell size={18} strokeWidth={1.8} />
          <span className={styles.notifDot} />
        </button>
        <button className={styles.iconBtn} aria-label="Settings">
          <Settings size={18} strokeWidth={1.8} />
        </button>
        <div className={styles.avatar}>
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=doctor&backgroundColor=b6e3f4"
            alt="User"
            className={styles.avatarImg}
          />
        </div>
      </div>
    </header>
  );
}
