import { useApp } from '../../context/AppContext';
import styles from './DoctorView.module.css';

function DoctorAvatar({ name, photo }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['avatar-blue', 'avatar-green', 'avatar-purple', 'avatar-orange'];
  const idx = name.charCodeAt(0) % colors.length;
  
  if (photo) {
    return <img src={photo} alt={name} className={styles.docPhoto} />;
  }
  
  return (
    <div className={`avatar ${colors[idx]}`} style={{ width: 44, height: 44, fontSize: 15 }}>
      {initials}
    </div>
  );
}

export default function DoctorView() {
  const { doctors } = useApp();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className="page-title">Doctor View</h1>
        <p className="page-subtitle">Directory of all our clinic specialists.</p>
      </div>

      <div className={styles.grid}>
        {doctors.map(doc => (
          <div key={doc.id} className={styles.doctorCard}>
            <DoctorAvatar name={doc.name} photo={doc.photo} />
            <div className={styles.docInfo}>
              <div className={styles.docName}>Dr. {doc.name}</div>
              <div className={styles.docMeta}>
                <span className={styles.deptTag}>{doc.department}</span>
                <span className={styles.docId}>⊞ {doc.id}</span>
              </div>
            </div>
            <span className={`badge ${doc.status === 'Active' ? 'badge-green' : 'badge-yellow'}`}>
              {doc.status}
            </span>
          </div>
        ))}
        {doctors.length === 0 && (
          <div className={styles.empty}>No doctors available.</div>
        )}
      </div>
    </div>
  );
}
