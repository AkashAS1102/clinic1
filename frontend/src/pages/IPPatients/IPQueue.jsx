import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, Clock, Building2, User, ChevronRight, Activity, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import styles from './IPPatients.module.css';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'
];
function avatarColor(name = '') {
  const str = name || '';
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h + str.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export default function IPQueue() {
  const { ipPatients } = useApp();
  const navigate = useNavigate();

  // Filter patients that came from consultation (admitted) but do not have a room yet.
  const pendingAllocation = useMemo(() => {
    return ipPatients.filter(p => !p.allocatedRoomId && p.status !== 'Discharged');
  }, [ipPatients]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Clock size={22} strokeWidth={2} />
          </div>
          <div>
            <h1 className={styles.title}>Pending Room Allocation</h1>
            <p className={styles.subtitle}>IP patients awaiting physical bed allocation</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.totalBadge}>
            <BedDouble size={13} /> {pendingAllocation.length} Waiting
          </span>
        </div>
      </div>

      {/* Patient List */}
      {pendingAllocation.length === 0 ? (
        <div className={styles.emptyState}>
          <BedDouble size={56} strokeWidth={1.2} className={styles.emptyIcon} />
          <div className={styles.emptyTitle}>No pending allocations</div>
          <div className={styles.emptyDesc}>
            All admitted IP patients have been assigned a physical room.
          </div>
        </div>
      ) : (
        <div className={styles.patientList}>
          {pendingAllocation.map(ip => (
            <div key={ip.id} className={styles.patientCard}>
              <div className={styles.cardHeader} style={{ cursor: 'default' }}>
                <div className={styles.cardLeft}>
                  <div
                    className={styles.avatar}
                    style={{ background: avatarColor(ip.patientName) }}
                  >
                    {getInitials(ip.patientName)}
                  </div>
                  <div className={styles.cardInfo}>
                    <div className={styles.cardName}>
                      {ip.patientName}
                      {ip.isUrgent && (
                        <span className={styles.urgentTag}>🔴 URGENT</span>
                      )}
                    </div>
                    <div className={styles.cardMeta}>
                      <span>ID: #{ip.patientId || ip.id}</span>
                      {ip.age && <><span className={styles.dot}>•</span><span>{ip.age}Y</span></>}
                      {ip.gender && <><span className={styles.dot}>•</span><span>{ip.gender === 'M' ? 'Male' : ip.gender === 'F' ? 'Female' : ip.gender}</span></>}
                      {ip.doctorName && <><span className={styles.dot}>•</span><span>Admitting Dr: {ip.doctorName}</span></>}
                    </div>
                  </div>
                </div>

                <div className={styles.cardRight} style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div className={styles.wardBadge}>
                    <Building2 size={12} />
                    {ip.ward || 'General Ward'}
                  </div>
                  <div className={styles.admitDate}>
                    <Clock size={11} />
                    {ip.admissionDate}
                  </div>
                  
                  <button 
                    onClick={() => navigate('/room-booking/allocate', { state: { patientId: ip.id } })}
                    style={{
                      background: '#2563eb', color: 'white', border: 'none', 
                      padding: '8px 16px', borderRadius: '6px', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 13
                    }}
                  >
                    <BedDouble size={14} /> Book Now <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
