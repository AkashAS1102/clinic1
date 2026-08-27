import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login/Login';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Registration from './pages/Registration/Registration';
import AllDoctors from './pages/Doctors/AllDoctors';
import DoctorsList from './pages/Doctors/DoctorsList';
import DoctorDetails from './pages/Doctors/DoctorDetails';
import AddEditDoctor from './pages/Doctors/AddEditDoctor';
import Appointments from './pages/Appointments/Appointments';
import NurseStation from './pages/NurseStation/NurseStation';
import Consultation from './pages/Consultation/Consultation';
import Nurses from './pages/Nurses/Nurses';
import AllNurses from './pages/Nurses/AllNurses';
import NursesList from './pages/Nurses/NursesList';
import NurseDetails from './pages/Nurses/NurseDetails';
import AddEditNurse from './pages/Nurses/AddEditNurse';
import AllPatients from './pages/Patients/AllPatients';
import PatientsList from './pages/Patients/PatientsList';
import PatientDetails from './pages/Patients/PatientDetails';
import AddEditPatient from './pages/Patients/AddEditPatient';
import PatientHistory from './pages/Patients/PatientHistory';
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import StaffsList from './pages/Staffs/StaffsList';
import RoomAssigns from './pages/Rooms/RoomAssigns';
import SalaryManagement from './pages/HR/SalaryManagement';
import WorkingHours from './pages/HR/WorkingHours';
import PharmacyDashboard from './pages/Pharmacy/PharmacyDashboard';
import PharmacyInventory from './pages/Pharmacy/PharmacyInventory';
import PharmacyPrescriptions from './pages/Pharmacy/PharmacyPrescriptions';
import PharmacyBilling from './pages/Pharmacy/PharmacyBilling';
import MasterData from './pages/Settings/MasterData';
import DepartmentManager from './pages/Settings/DepartmentManager';
import DesignationManager from './pages/Settings/DesignationManager';
import RoomManager from './pages/Settings/RoomManager';
import ClinicInfoManager from './pages/Settings/ClinicInfoManager';
import IPQueuePage from './pages/IPPatients/IPQueuePage';
import IPPatientChart from './pages/IPPatients/IPPatientChart';
import IPPatientView from './pages/IPPatients/IPPatientView';
import BedManagementPage from './pages/IPPatients/BedManagementPage';
import InPatientStayPage from './pages/IPPatients/InPatientStayPage';
import RoomAllocationWizard from './pages/IPPatients/RoomAllocationWizard';
import DischargeBillingPage from './pages/IPPatients/DischargeBillingPage';
import styles from './App.module.css';

function OfflineBanner() {
  const { backendOnline } = useApp();
  if (backendOnline) return null;
  return (
    <div style={{
      background: '#fef3c7', borderBottom: '1px solid #fde68a', color: '#b45309',
      padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 500
    }}>
      <span>⚡ Offline Mode: Backend server not unreachable. Running entirely on local frontend reactive demo engine!</span>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:18,color:'#64748b'}}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppProvider>
              <div className={styles.layout}>
                <Sidebar />
                <div className={styles.main}>
                  <TopBar />
                  <OfflineBanner />
                  <div className={styles.content}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/registration" replace />} />
                      <Route path="/registration" element={<Registration />} />
                      <Route path="/manager/dashboard" element={<ManagerDashboard />} />
                      <Route path="/head/dashboard" element={<Navigate to="/manager/dashboard" replace />} />
                      <Route path="/head" element={<Navigate to="/manager/dashboard" replace />} />
                      <Route path="/head/*" element={<Navigate to="/manager/dashboard" replace />} />
                      <Route path="/head-portal" element={<Navigate to="/manager/dashboard" replace />} />
                      <Route path="/portal" element={<Navigate to="/manager/dashboard" replace />} />
                      <Route path="/portal/*" element={<Navigate to="/manager/dashboard" replace />} />
                      <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
                      <Route path="/staffs/list" element={<StaffsList />} />
                      <Route path="/rooms/assign" element={<RoomAssigns />} />
                      <Route path="/hr/salary" element={<SalaryManagement />} />
                      <Route path="/hr/shifts" element={<WorkingHours />} />
                      <Route path="/pharmacy" element={<Navigate to="/pharmacy/dashboard" replace />} />
                      <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
                      <Route path="/pharmacy/inventory" element={<PharmacyInventory />} />
                      <Route path="/pharmacy/prescriptions" element={<PharmacyPrescriptions />} />
                      <Route path="/pharmacy/billing" element={<PharmacyBilling />} />
                      <Route path="/patients" element={<Navigate to="/patients/all" replace />} />
                      <Route path="/patients/all" element={<AllPatients />} />
                      <Route path="/patients/list" element={<PatientsList />} />
                      <Route path="/patients/details" element={<PatientDetails />} />
                      <Route path="/patients/manage" element={<AddEditPatient />} />
                      <Route path="/patients/history" element={<PatientHistory />} />
                      <Route path="/doctors" element={<Navigate to="/doctors/all" replace />} />
                      <Route path="/doctor-view" element={<Navigate to="/doctors/list" replace />} />
                      <Route path="/doctors/all" element={<AllDoctors />} />
                      <Route path="/doctors/list" element={<DoctorsList />} />
                      <Route path="/doctors/details" element={<DoctorDetails />} />
                      <Route path="/doctors/manage" element={<AddEditDoctor />} />
                      <Route path="/nurses" element={<Navigate to="/nurses/all" replace />} />
                      <Route path="/nurses/all" element={<AllNurses />} />
                      <Route path="/nurses/list" element={<NursesList />} />
                      <Route path="/nurses/details" element={<NurseDetails />} />
                      <Route path="/nurses/manage" element={<AddEditNurse />} />
                      <Route path="/appointments" element={<Appointments />} />
                      <Route path="/nurse-station" element={<NurseStation />} />
                      <Route path="/consultation" element={<Consultation />} />
                      <Route path="/ip-patients" element={<Navigate to="/ip-patients/queue" replace />} />
                      <Route path="/ip-patients/queue" element={<IPQueuePage />} />
                      <Route path="/ip-patients/chart" element={<IPPatientChart />} />
                      <Route path="/ip-patients/view" element={<IPPatientView />} />
                      <Route path="/ip-patients/stay" element={<InPatientStayPage />} />
                      <Route path="/room-booking/generator" element={<RoomManager />} />
                      <Route path="/room-booking/allocate" element={<RoomAllocationWizard />} />
                      <Route path="/room-booking/bed-management" element={<BedManagementPage />} />
                      <Route path="/ip-patients/discharge" element={<DischargeBillingPage />} />
                      <Route path="/settings/departments" element={<DepartmentManager />} />
                      <Route path="/settings/designations" element={<DesignationManager />} />
                      <Route path="/settings/rooms" element={<RoomManager />} />
                      <Route path="/settings/master-data" element={<MasterData />} />
                      <Route path="/settings/clinic-info" element={<ClinicInfoManager />} />
                    </Routes>
                  </div>
                </div>
              </div>
            </AppProvider>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}
