import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, BedDouble, Activity, Stethoscope, 
  Pill, TestTube, History, User, Calendar
} from 'lucide-react';

export default function IPPatientChart() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('id');
  const navigate = useNavigate();
  const { patients, ipPatients, nurseQueue, pastConsultations } = useApp();

  const ipPatient = useMemo(() => ipPatients.find(p => p.patientId === patientId || p.id === patientId), [ipPatients, patientId]);
  const basePatient = useMemo(() => patients.find(p => p.id === patientId), [patients, patientId]);
  
  const name = ipPatient?.patientName || basePatient?.fullName || 'Unknown Patient';
  const ageGender = `${ipPatient?.age || basePatient?.age || '--'} / ${ipPatient?.gender || basePatient?.gender || '--'}`;
  const admitDate = ipPatient?.admissionDate || '--';

  // 1. Room Log
  const roomLogs = [
    { date: admitDate, action: 'Admission', ward: ipPatient?.ward || 'General', room: ipPatient?.allocatedRoomId || 'Pending', by: ipPatient?.doctorName || 'Dr. Kavitha' }
  ];

  // 2. History & Conditions
  const conditions = basePatient?.conditions ? basePatient.conditions.split(',').map(c => c.trim()) : ['Hypertension', 'Fever'];

  // 3. Vitals (from NurseQueue)
  const vitals = useMemo(() => {
    return nurseQueue.filter(q => q.patientId === patientId).map(q => ({
      date: q.createdAt || admitDate,
      bp: q.bp || '--',
      pulse: q.pulse || '--',
      temp: q.temp || '--',
      spo2: q.spo2 || '--'
    }));
  }, [nurseQueue, patientId, admitDate]);

  // 4. Consultations / Rounds
  const rounds = useMemo(() => {
    return pastConsultations.filter(c => c.patientId === patientId).map(c => ({
      date: c.date || admitDate,
      doctor: c.doctorName || '--',
      diagnosis: c.diagnosis || 'Observation',
      notes: c.chiefComplaint || '--'
    }));
  }, [pastConsultations, patientId, admitDate]);

  // 5. Prescriptions / eMAR
  const meds = useMemo(() => {
    let m = [];
    pastConsultations.filter(c => c.patientId === patientId).forEach(c => {
      if(c.prescriptions) {
        c.prescriptions.forEach(p => m.push({ date: c.date || admitDate, medicine: p.medicine, dosage: p.dosage, frequency: p.frequency, status: 'Active' }));
      }
    });
    return m.length > 0 ? m : [{ date: admitDate, medicine: 'Paracetamol', dosage: '500mg', frequency: 'SOS', status: 'Active' }];
  }, [pastConsultations, patientId, admitDate]);

  // 6. Lab Tests
  const labs = useMemo(() => {
    let l = [];
    pastConsultations.filter(c => c.patientId === patientId).forEach(c => {
      if(c.labTests && Array.isArray(c.labTests)) {
        c.labTests.forEach(test => l.push({ date: c.date || admitDate, test: test, status: 'Pending', result: '--' }));
      }
    });
    return l.length > 0 ? l : [{ date: admitDate, test: 'CBC', status: 'Reported', result: 'WBC 11,000' }];
  }, [pastConsultations, patientId, admitDate]);

  const TableCard = ({ title, icon, columns, data, renderRow }) => (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ color: '#0f766e' }}>{icon}</div>
        <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a', fontWeight: 600 }}>{title}</h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead style={{ background: '#fff', borderBottom: '2px solid #f1f5f9' }}>
            <tr>
              {columns.map((col, i) => <th key={i} style={{ padding: '12px 20px', color: '#64748b', fontWeight: 600 }}>{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? data.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>{renderRow(row)}</tr>
            )) : (
              <tr><td colSpan={columns.length} style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px 32px', background: '#f4f7f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{ padding: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={20} color="#475569" />
        </button>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: 24, color: '#0f172a', fontWeight: 700 }}>Inpatient Medical Chart</h1>
          <div style={{ color: '#64748b', fontSize: 14, display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={14}/> {name} (ID: {patientId})</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={14}/> {ageGender}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14}/> Admitted: {admitDate}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 1200 }}>
        <TableCard 
          title="Room & Transfer Log" icon={<BedDouble size={20} />}
          columns={['Date & Time', 'Event', 'Ward / Unit', 'Room & Bed', 'Authorized By']}
          data={roomLogs}
          renderRow={r => (
            <>
              <td style={{ padding: '12px 20px', color: '#334155' }}>{r.date}</td>
              <td style={{ padding: '12px 20px', color: '#0d9488', fontWeight: 500 }}>{r.action}</td>
              <td style={{ padding: '12px 20px' }}>{r.ward}</td>
              <td style={{ padding: '12px 20px', fontWeight: 500 }}>{r.room}</td>
              <td style={{ padding: '12px 20px' }}>{r.by}</td>
            </>
          )}
        />

        <TableCard 
          title="Medical History & Conditions" icon={<History size={20} />}
          columns={['Condition', 'Status', 'Notes']}
          data={conditions.map(c => ({ name: c, status: 'Active', notes: 'Recorded at admission' }))}
          renderRow={r => (
            <>
              <td style={{ padding: '12px 20px', fontWeight: 500, color: '#334155' }}>{r.name}</td>
              <td style={{ padding: '12px 20px' }}><span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{r.status}</span></td>
              <td style={{ padding: '12px 20px', color: '#64748b' }}>{r.notes}</td>
            </>
          )}
        />

        <TableCard 
          title="Vitals Flowsheet" icon={<Activity size={20} />}
          columns={['Date & Time', 'Blood Pressure', 'Heart Rate', 'Temperature', 'SpO2']}
          data={vitals}
          renderRow={r => (
            <>
              <td style={{ padding: '12px 20px', color: '#64748b' }}>{r.date}</td>
              <td style={{ padding: '12px 20px', fontWeight: 500 }}>{r.bp}</td>
              <td style={{ padding: '12px 20px' }}>{r.pulse} bpm</td>
              <td style={{ padding: '12px 20px' }}>{r.temp} &deg;F</td>
              <td style={{ padding: '12px 20px', color: r.spo2 < 95 ? '#dc2626' : 'inherit' }}>{r.spo2}%</td>
            </>
          )}
        />

        <TableCard 
          title="Consultations & Doctor Rounds" icon={<Stethoscope size={20} />}
          columns={['Date & Time', 'Consulting Doctor', 'Diagnosis / Impression', 'Clinical Notes']}
          data={rounds}
          renderRow={r => (
            <>
              <td style={{ padding: '12px 20px', color: '#64748b' }}>{r.date}</td>
              <td style={{ padding: '12px 20px', fontWeight: 500, color: '#0f766e' }}>{r.doctor}</td>
              <td style={{ padding: '12px 20px', fontWeight: 500 }}>{r.diagnosis}</td>
              <td style={{ padding: '12px 20px', color: '#475569' }}>{r.notes}</td>
            </>
          )}
        />

        <TableCard 
          title="Prescriptions & eMAR" icon={<Pill size={20} />}
          columns={['Date Ordered', 'Medication', 'Dosage', 'Frequency', 'Status']}
          data={meds}
          renderRow={r => (
            <>
              <td style={{ padding: '12px 20px', color: '#64748b' }}>{r.date}</td>
              <td style={{ padding: '12px 20px', fontWeight: 600, color: '#334155' }}>{r.medicine}</td>
              <td style={{ padding: '12px 20px' }}>{r.dosage}</td>
              <td style={{ padding: '12px 20px' }}>{r.frequency}</td>
              <td style={{ padding: '12px 20px' }}><span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{r.status}</span></td>
            </>
          )}
        />

        <TableCard 
          title="Lab Tests & Investigations" icon={<TestTube size={20} />}
          columns={['Date Ordered', 'Investigation Name', 'Status', 'Result Summary']}
          data={labs}
          renderRow={r => (
            <>
              <td style={{ padding: '12px 20px', color: '#64748b' }}>{r.date}</td>
              <td style={{ padding: '12px 20px', fontWeight: 500 }}>{r.test}</td>
              <td style={{ padding: '12px 20px' }}><span style={{ background: r.status==='Reported'?'#dcfce7':'#fef3c7', color: r.status==='Reported'?'#16a34a':'#d97706', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{r.status}</span></td>
              <td style={{ padding: '12px 20px', fontWeight: r.status==='Reported'?600:400 }}>{r.result}</td>
            </>
          )}
        />

      </div>
    </div>
  );
}
