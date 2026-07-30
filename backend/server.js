// ═══════════════════════════════════════════════════════════
//  Clinic Backend — Express + SQLite (better-sqlite3)
//  Runs on port 8080  |  All routes prefixed with /api
// ═══════════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const helmet   = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const app  = express();
const PORT = process.env.PORT || 8080;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'clinic.db');
const JWT_SECRET = process.env.JWT_SECRET || 'aarogya-hms-default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// ── Security Middleware ──────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts, please try again after 15 minutes' }
});

// ── Database setup ───────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ───────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id                   TEXT PRIMARY KEY,
    phone                TEXT NOT NULL,
    fullName             TEXT NOT NULL,
    dob                  TEXT,
    gender               TEXT,
    maritalStatus        TEXT DEFAULT 'Single',
    occupation           TEXT,
    address              TEXT,
    guardianName         TEXT,
    emergencyContactName TEXT,
    emergencyContactPhone TEXT,
    bloodGroup           TEXT,
    allergies            TEXT DEFAULT '[]',
    conditions           TEXT,
    referringDoctor      TEXT,
    patientCategory      TEXT DEFAULT 'General',
    insuranceProvider    TEXT,
    policyNumber         TEXT,
    registeredBy         TEXT DEFAULT 'Front Desk Admin',
    status               TEXT DEFAULT 'Active',
    relationshipToFamily TEXT,
    photoUrl             TEXT,
    lastVisit            TEXT,
    createdAt            TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS doctors (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    department     TEXT,
    qualification  TEXT,
    contact        TEXT,
    email          TEXT,
    availableDays  TEXT DEFAULT '[]',
    timeSlot       TEXT,
    fee            REAL DEFAULT 0,
    status         TEXT DEFAULT 'Active',
    licenseNumber  TEXT,
    experience     TEXT,
    photoUrl       TEXT,
    createdAt      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS nurses (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    employeeId     TEXT,
    department     TEXT,
    qualification  TEXT,
    contact        TEXT,
    email          TEXT,
    shift          TEXT,
    availableDays  TEXT DEFAULT '[]',
    licenseNumber  TEXT,
    experience     TEXT,
    status         TEXT DEFAULT 'Active',
    joiningDate    TEXT,
    photoUrl       TEXT,
    createdAt      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id          TEXT PRIMARY KEY,
    patientId   TEXT NOT NULL,
    patientName TEXT,
    doctorId    TEXT,
    doctorName  TEXT,
    department  TEXT,
    date        TEXT,
    timeSlot    TEXT,
    reason      TEXT,
    token       TEXT UNIQUE,
    status      TEXT DEFAULT 'Scheduled',
    createdAt   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS nurse_queue (
    token          TEXT PRIMARY KEY,
    patientId      TEXT NOT NULL,
    patientName    TEXT,
    gender         TEXT,
    age            INTEGER,
    doctorName     TEXT,
    status         TEXT DEFAULT 'Pending',
    bp             TEXT DEFAULT '',
    pulse          TEXT DEFAULT '',
    temp           TEXT DEFAULT '',
    weight         TEXT DEFAULT '',
    height         TEXT DEFAULT '',
    bmi            TEXT DEFAULT '',
    spo2           TEXT DEFAULT '',
    rbs            TEXT DEFAULT '',
    chiefComplaint TEXT DEFAULT '',
    nurseNotes     TEXT DEFAULT '',
    sentToDoctor   INTEGER DEFAULT 0,
    createdAt      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS consultations (
    id             TEXT PRIMARY KEY,
    patientId      TEXT,
    patientName    TEXT,
    token          TEXT,
    doctorName     TEXT,
    diagnosis      TEXT,
    scanType       TEXT,
    scanNotes      TEXT,
    labTests       TEXT,
    nextVisitDate  TEXT,
    nextVisitNotes TEXT,
    prescriptions  TEXT DEFAULT '[]',
    vitals         TEXT DEFAULT '{}',
    chiefComplaint TEXT,
    status         TEXT DEFAULT 'Active',
    createdAt      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS staffs (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    role        TEXT,
    department  TEXT,
    contact     TEXT,
    email       TEXT,
    employeeId  TEXT,
    shift       TEXT,
    joiningDate TEXT,
    status      TEXT DEFAULT 'Active',
    salary      REAL DEFAULT 0,
    createdAt   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id             TEXT PRIMARY KEY,
    roomNumber     TEXT,
    ward           TEXT,
    type           TEXT,
    status         TEXT DEFAULT 'Available',
    patientId      TEXT,
    patientName    TEXT,
    assignedDoctor TEXT,
    assignedNurse  TEXT,
    admissionDate  TEXT,
    bed            TEXT,
    floor          TEXT,
    createdAt      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payroll (
    id           TEXT PRIMARY KEY,
    employeeId   TEXT NOT NULL,
    employeeName TEXT,
    role         TEXT,
    department   TEXT,
    basicSalary  REAL DEFAULT 0,
    allowances   REAL DEFAULT 0,
    deductions   REAL DEFAULT 0,
    netSalary    REAL DEFAULT 0,
    month        TEXT,
    year         TEXT,
    status       TEXT DEFAULT 'Pending',
    paidDate     TEXT,
    createdAt    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shifts (
    id           TEXT PRIMARY KEY,
    employeeId   TEXT NOT NULL,
    employeeName TEXT,
    role         TEXT,
    shiftType    TEXT,
    startTime    TEXT,
    endTime      TEXT,
    date         TEXT,
    hoursWorked  REAL DEFAULT 0,
    status       TEXT DEFAULT 'Scheduled',
    notes        TEXT,
    createdAt    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pharmacy_inventory (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    generic      TEXT,
    category     TEXT,
    manufacturer TEXT,
    batchNumber  TEXT,
    expiryDate   TEXT,
    stock        INTEGER DEFAULT 0,
    minThreshold INTEGER DEFAULT 10,
    unit         TEXT DEFAULT 'Tablet',
    costPrice    REAL DEFAULT 0,
    sellingPrice REAL DEFAULT 0,
    supplier     TEXT,
    location     TEXT,
    createdAt    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pharmacy_queue (
    id           TEXT PRIMARY KEY,
    token        TEXT,
    patientId    TEXT,
    patientName  TEXT,
    age          TEXT,
    doctorName   TEXT,
    status       TEXT DEFAULT 'Ready to Dispense',
    allergies    TEXT,
    diagnosis    TEXT,
    items        TEXT DEFAULT '[]',
    totalAmount  REAL DEFAULT 0,
    createdAt    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pharmacy_bills (
    id            TEXT PRIMARY KEY,
    rxId          TEXT,
    patientName   TEXT,
    patientId     TEXT,
    date          TEXT,
    itemsCount    INTEGER DEFAULT 0,
    subtotal      REAL DEFAULT 0,
    gst           REAL DEFAULT 0,
    discount      REAL DEFAULT 0,
    total         REAL DEFAULT 0,
    paymentMethod TEXT,
    status        TEXT DEFAULT 'Paid',
    items         TEXT DEFAULT '[]',
    returnReason  TEXT,
    createdAt     TEXT DEFAULT (datetime('now'))
  );
`);

// ── Auth & Audit Tables ─────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN (
      'super_admin','doctor','nurse','receptionist',
      'pharmacist','lab_tech','billing_clerk','manager'
    )),
    display_name TEXT,
    staff_ref_id TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT DEFAULT (datetime('now')),
    user_id TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    ip_address TEXT,
    changes_json TEXT
  );
`);

// Create indexes for audit_log if they don't exist
try {
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource_type, resource_id)`);
} catch(e) { /* indexes may already exist */ }

// ── Seed default admin user ─────────────────────────────────
const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 12);
  db.prepare(`INSERT INTO users (id, username, password_hash, role, display_name, is_active)
    VALUES (?, ?, ?, ?, ?, ?)`).run('USR-ADMIN-001', 'admin', hash, 'super_admin', 'System Administrator', 1);
  console.log('🔐 Default admin user created (username: admin, password: admin123)');
}

// Seed role-based users for demo doctors, nurses, staff
const demoUsers = [
  { id: 'USR-DOC-001', username: 'dr.arjun', password: 'doctor123', role: 'doctor', display_name: 'Dr. Arjun Mehta', staff_ref_id: 'DOC-8832' },
  { id: 'USR-DOC-002', username: 'dr.kavitha', password: 'doctor123', role: 'doctor', display_name: 'Dr. Kavitha Reddy', staff_ref_id: 'DOC-9012' },
  { id: 'USR-NUR-001', username: 'nurse.sunita', password: 'nurse123', role: 'nurse', display_name: 'Sunita Menon', staff_ref_id: 'NUR-4011' },
  { id: 'USR-REC-001', username: 'reception', password: 'reception123', role: 'receptionist', display_name: 'Ananya Verma', staff_ref_id: 'STF-001' },
  { id: 'USR-PHR-001', username: 'pharmacist', password: 'pharma123', role: 'pharmacist', display_name: 'Amitabh Verma', staff_ref_id: 'STF-003' },
  { id: 'USR-MGR-001', username: 'manager', password: 'manager123', role: 'manager', display_name: 'Hospital Manager', staff_ref_id: null },
];
const insertUser = db.prepare(`INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name, staff_ref_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)`);
for (const u of demoUsers) {
  insertUser.run(u.id, u.username, bcrypt.hashSync(u.password, 12), u.role, u.display_name, u.staff_ref_id);
}

// ── Auth Middleware ──────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function rbac(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions for this action' });
    }
    next();
  };
}

// ── Audit Log Helper ────────────────────────────────────────
function logAudit(userId, userRole, action, resourceType, resourceId, ip, changes) {
  try {
    db.prepare(`INSERT INTO audit_log (user_id, user_role, action, resource_type, resource_id, ip_address, changes_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      userId || 'anonymous', userRole || 'unknown', action, resourceType, resourceId || null, ip || null,
      changes ? JSON.stringify(changes) : null
    );
  } catch(e) { console.error('Audit log error:', e.message); }
}

// ── Migration: add new columns if they don't exist (safe ALTER TABLE) ──────────
const existingCols = db.prepare("PRAGMA table_info(patients)").all().map(c => c.name);
const newCols = [
  { name: 'maritalStatus',     def: "TEXT DEFAULT 'Single'" },
  { name: 'occupation',        def: 'TEXT' },
  { name: 'guardianName',      def: 'TEXT' },
  { name: 'patientCategory',   def: "TEXT DEFAULT 'General'" },
  { name: 'insuranceProvider', def: 'TEXT' },
  { name: 'policyNumber',      def: 'TEXT' },
  { name: 'registeredBy',         def: "TEXT DEFAULT 'Front Desk Admin'" },
  { name: 'status',               def: "TEXT DEFAULT 'Active'" },
  { name: 'relationshipToFamily', def: 'TEXT' },
];
for (const col of newCols) {
  if (!existingCols.includes(col.name)) {
    db.exec(`ALTER TABLE patients ADD COLUMN ${col.name} ${col.def}`);
    console.log(`✅ Added column patients.${col.name}`);
  }
}

// ── Migration: add new columns for doctors if they don't exist ──────────
const existingDocCols = db.prepare("PRAGMA table_info(doctors)").all().map(c => c.name);
const newDocCols = [
  { name: 'licenseNumber', def: 'TEXT' },
  { name: 'experience',    def: 'TEXT' },
];
for (const col of newDocCols) {
  if (!existingDocCols.includes(col.name)) {
    db.exec(`ALTER TABLE doctors ADD COLUMN ${col.name} ${col.def}`);
    console.log(`✅ Added column doctors.${col.name}`);
  }
}

// ── Migration: add new columns for consultations if they don't exist ──────────
const existingConsCols = db.prepare("PRAGMA table_info(consultations)").all().map(c => c.name);
const newConsCols = [
  { name: 'date', def: 'TEXT' },
  { name: 'department', def: 'TEXT' },
  { name: 'notes', def: 'TEXT' },
];
for (const col of newConsCols) {
  if (!existingConsCols.includes(col.name)) {
    db.exec(`ALTER TABLE consultations ADD COLUMN ${col.name} ${col.def}`);
    console.log(`✅ Added column consultations.${col.name}`);
  }
}

// ── ID Generators ────────────────────────────────────────────
function genPatientId() {
  const existing = db.prepare('SELECT id FROM patients').all().map(r => r.id);
  let id;
  do {
    id = `P-${String(Math.floor(100000 + Math.random() * 899999))}`;
  } while (existing.includes(id));
  return id;
}

function genDoctorId() {
  const existing = db.prepare('SELECT id FROM doctors').all().map(r => r.id);
  let id;
  do {
    id = `DOC-${String(Math.floor(1000 + Math.random() * 8999))}`;
  } while (existing.includes(id));
  return id;
}

function genAppointmentId() {
  const n = db.prepare('SELECT COUNT(*) as c FROM appointments').get().c;
  return `APT-${String(n + 1).padStart(3, '0')}`;
}

function genToken(doctorId, date) {
  // Token = letter prefix (from doctor) + sequential number for that doctor+day
  const prefix = doctorId ? doctorId.slice(-1).toUpperCase() : 'A';
  const count = db.prepare(
    'SELECT COUNT(*) as c FROM appointments WHERE doctorId = ? AND date = ?'
  ).get(doctorId || '', date || '') || { c: 0 };
  return `${prefix}-${String(count.c + 1).padStart(3, '0')}`;
}

// ── Seed helpers ─────────────────────────────────────────────
function seedIfEmpty() {
  console.log('🌱 Ensuring demo data is present in database (INSERT OR IGNORE)...');

  // Patients
  const insertPatient = db.prepare(`
    INSERT OR IGNORE INTO patients
      (id,phone,fullName,dob,gender,address,emergencyContactName,emergencyContactPhone,bloodGroup,allergies,conditions,referringDoctor,lastVisit)
    VALUES
      (@id,@phone,@fullName,@dob,@gender,@address,@emergencyContactName,@emergencyContactPhone,@bloodGroup,@allergies,@conditions,@referringDoctor,@lastVisit)
  `);
  const patients = [
    { id:'P-882019', phone:'9876543210', fullName:'Priya Sharma', dob:'1985-10-14', gender:'Female',
      address:'12, Gandhi Nagar, Near Shiv Temple, Pune, Maharashtra 411001',
      emergencyContactName:'Ramesh Sharma', emergencyContactPhone:'9876543211',
      bloodGroup:'B+', allergies:JSON.stringify(['Penicillin']), conditions:'Hypertension',
      referringDoctor:'Dr. Arjun Mehta', lastVisit:'2024-03-02' },
    { id:'P-112233', phone:'9845001122', fullName:'Rajesh Kumar', dob:'1980-12-05', gender:'Male',
      address:'45, MG Road, Koramangala, Bengaluru, Karnataka 560034',
      emergencyContactName:'Sunita Kumar', emergencyContactPhone:'9845001123',
      bloodGroup:'O+', allergies:JSON.stringify([]), conditions:'', referringDoctor:'', lastVisit:'2024-01-15' },
    { id:'P-112234', phone:'9845001122', fullName:'Sunita Kumar', dob:'1982-04-22', gender:'Female',
      address:'45, MG Road, Koramangala, Bengaluru, Karnataka 560034',
      emergencyContactName:'Rajesh Kumar', emergencyContactPhone:'9845001122',
      bloodGroup:'A+', allergies:JSON.stringify(['Sulfa']), conditions:'Asthma', referringDoctor:'', lastVisit:'2024-02-20' },
    { id:'P-112235', phone:'9845001122', fullName:'Aryan Kumar', dob:'2010-09-14', gender:'Male',
      address:'45, MG Road, Koramangala, Bengaluru, Karnataka 560034',
      emergencyContactName:'Rajesh Kumar', emergencyContactPhone:'9845001122',
      bloodGroup:'O+', allergies:JSON.stringify([]), conditions:'', referringDoctor:'', lastVisit:'2023-11-05' },
    { id:'P-776655', phone:'9900112233', fullName:'Mohan Lal Gupta', dob:'1979-12-04', gender:'Male',
      address:'22, Sector 15, Chandigarh, Punjab 160015',
      emergencyContactName:'Kavita Gupta', emergencyContactPhone:'9900112234',
      bloodGroup:'AB+', allergies:JSON.stringify([]), conditions:'Diabetes Type 2',
      referringDoctor:'Dr. Sanjay Patel', lastVisit:'2024-04-10' },
  ];
  patients.forEach(p => insertPatient.run(p));

  // Doctors
  const insertDoctor = db.prepare(`
    INSERT OR IGNORE INTO doctors (id,name,department,qualification,contact,email,availableDays,timeSlot,fee,status)
    VALUES (@id,@name,@department,@qualification,@contact,@email,@availableDays,@timeSlot,@fee,@status)
  `);
  const doctors = [
    { id:'DOC-8832', name:'Arjun Mehta', department:'Cardiology', qualification:'MD, FACC',
      contact:'+91 98765 43210', email:'arjun.mehta@clinic.in',
      availableDays:JSON.stringify(['Mon','Tue','Wed','Fri']), timeSlot:'Full Day (09:00 - 17:00)', fee:800, status:'Active' },
    { id:'DOC-8845', name:'Deepa Nair', department:'Neurology', qualification:'MD, DM',
      contact:'+91 98765 43211', email:'deepa.nair@clinic.in',
      availableDays:JSON.stringify(['Mon','Wed','Thu']), timeSlot:'Morning OP (09:00 - 13:00)', fee:1000, status:'On Leave' },
    { id:'DOC-8901', name:'Sanjay Patel', department:'Pediatrics', qualification:'MBBS, DCH',
      contact:'+91 97654 32100', email:'sanjay.patel@clinic.in',
      availableDays:JSON.stringify(['Tue','Thu','Sat']), timeSlot:'Evening OP (14:00 - 18:00)', fee:600, status:'Active' },
    { id:'DOC-9012', name:'Kavitha Reddy', department:'General Medicine', qualification:'MBBS, MD',
      contact:'+91 98765 43212', email:'kavitha.reddy@clinic.in',
      availableDays:JSON.stringify(['Mon','Tue','Wed','Thu','Fri']), timeSlot:'Full Day (09:00 - 17:00)', fee:500, status:'Active' },
  ];
  doctors.forEach(d => insertDoctor.run(d));

  // Nurses
  const insertNurse = db.prepare(`
    INSERT OR IGNORE INTO nurses (id,name,employeeId,department,qualification,contact,email,shift,availableDays,licenseNumber,experience,status,joiningDate,photoUrl)
    VALUES (@id,@name,@employeeId,@department,@qualification,@contact,@email,@shift,@availableDays,@licenseNumber,@experience,@status,@joiningDate,@photoUrl)
  `);
  const nurses = [
    { id:'NUR-4011', name:'Sunita Menon', employeeId:'NUR-4011', department:'ICU & Critical Care', qualification:'B.Sc Nursing, RN',
      contact:'+91 98111 22334', email:'sunita.menon@clinic.in', shift:'Morning (06:00 - 14:00)',
      availableDays:JSON.stringify(['Mon','Tue','Wed','Thu','Fri']), licenseNumber:'RN-MH-44210', experience:'7',
      status:'Active', joiningDate:'2021-04-12', photoUrl:'' },
    { id:'NUR-4012', name:'Anjali Deshmukh', employeeId:'NUR-4012', department:'Emergency Ward', qualification:'GNM, RN',
      contact:'+91 98222 33445', email:'anjali.d@clinic.in', shift:'Afternoon (14:00 - 22:00)',
      availableDays:JSON.stringify(['Mon','Wed','Fri','Sat']), licenseNumber:'RN-MH-55321', experience:'5',
      status:'Active', joiningDate:'2022-08-01', photoUrl:'' },
    { id:'NUR-4013', name:'Meenakshi Sundaram', employeeId:'NUR-4013', department:'Pediatric Ward', qualification:'M.Sc Nursing (Pediatrics)',
      contact:'+91 98333 44556', email:'m.sundaram@clinic.in', shift:'Morning (06:00 - 14:00)',
      availableDays:JSON.stringify(['Mon','Tue','Wed','Thu']), licenseNumber:'RN-TN-77889', experience:'10',
      status:'On Leave', joiningDate:'2019-11-15', photoUrl:'' },
    { id:'NUR-4014', name:'Rekha Sharma', employeeId:'NUR-4014', department:'Cardiology OPD', qualification:'B.Sc Nursing',
      contact:'+91 98444 55667', email:'rekha.sharma@clinic.in', shift:'Full Day (08:00 - 20:00)',
      availableDays:JSON.stringify(['Tue','Thu','Sat','Sun']), licenseNumber:'RN-DL-11223', experience:'4',
      status:'Active', joiningDate:'2023-01-20', photoUrl:'' }
  ];
  nurses.forEach(n => insertNurse.run(n));

  // Appointments + Nurse Queue
  const insertAppt = db.prepare(`
    INSERT OR IGNORE INTO appointments (id,patientId,patientName,doctorId,doctorName,department,date,timeSlot,reason,token,status)
    VALUES (@id,@patientId,@patientName,@doctorId,@doctorName,@department,@date,@timeSlot,@reason,@token,@status)
  `);
  const insertQueue = db.prepare(`
    INSERT OR IGNORE INTO nurse_queue (token,patientId,patientName,gender,age,doctorName,status,bp,temp,weight,height,bmi,spo2,rbs,chiefComplaint,nurseNotes,sentToDoctor)
    VALUES (@token,@patientId,@patientName,@gender,@age,@doctorName,@status,@bp,@temp,@weight,@height,@bmi,@spo2,@rbs,@chiefComplaint,@nurseNotes,@sentToDoctor)
  `);

  insertAppt.run({ id:'APT-001', patientId:'P-882019', patientName:'Priya Sharma', doctorId:'DOC-8832',
    doctorName:'Dr. Arjun Mehta', department:'Cardiology', date:'2024-05-15', timeSlot:'09:00 AM',
    reason:'Routine follow-up for hypertension management.', token:'A-012', status:'Scheduled' });
  insertAppt.run({ id:'APT-002', patientId:'P-776655', patientName:'Mohan Lal Gupta', doctorId:'DOC-9012',
    doctorName:'Dr. Kavitha Reddy', department:'General Medicine', date:'2024-05-15', timeSlot:'10:00 AM',
    reason:'Blood sugar follow-up.', token:'A-013', status:'Completed' });

  insertQueue.run({ token:'A-012', patientId:'P-882019', patientName:'Priya Sharma', gender:'F', age:39,
    doctorName:'Dr. Arjun Mehta', status:'Pending', bp:'130/85', temp:'98.6',
    weight:'', height:'', bmi:'', spo2:'', rbs:'', chiefComplaint:'', nurseNotes:'', sentToDoctor:0 });
  insertQueue.run({ token:'A-013', patientId:'P-776655', patientName:'Mohan Lal Gupta', gender:'M', age:44,
    doctorName:'Dr. Kavitha Reddy', status:'Pending', bp:'', temp:'',
    weight:'', height:'', bmi:'', spo2:'', rbs:'', chiefComplaint:'', nurseNotes:'', sentToDoctor:0 });
  insertQueue.run({ token:'B-045', patientId:'P-112233', patientName:'Rajesh Kumar', gender:'M', age:43,
    doctorName:'Dr. Arjun Mehta', status:'Pending', bp:'', temp:'',
    weight:'', height:'', bmi:'', spo2:'', rbs:'', chiefComplaint:'', nurseNotes:'', sentToDoctor:0 });
  insertQueue.run({ token:'A-011', patientId:'P-112234', patientName:'Sunita Kumar', gender:'F', age:41,
    doctorName:'Dr. Kavitha Reddy', status:'Done', bp:'130/85', temp:'98.2',
    weight:'62', height:'158', bmi:'24.8', spo2:'98', rbs:'105',
    chiefComplaint:'Cold and cough for 2 days', nurseNotes:'Patient seems anxious. BP slightly elevated.', sentToDoctor:1 });

  // Consultations
  const insertCons = db.prepare(`
    INSERT OR IGNORE INTO consultations (id,patientId,patientName,token,diagnosis,scanType,scanNotes,labTests,nextVisitDate,nextVisitNotes,prescriptions,status)
    VALUES (@id,@patientId,@patientName,@token,@diagnosis,@scanType,@scanNotes,@labTests,@nextVisitDate,@nextVisitNotes,@prescriptions,@status)
  `);
  insertCons.run({
    id: 'CONS-101', patientId: 'P-882019', patientName: 'Priya Sharma', token: 'A-012',
    diagnosis: 'Essential Hypertension, Well Controlled', scanType: 'ECG', scanNotes: 'Normal sinus rhythm, no acute ST changes.',
    labTests: 'Lipid Profile, HbA1c', nextVisitDate: '2024-06-15', nextVisitNotes: 'Continue current medication and diet.',
    prescriptions: JSON.stringify([{ medicine: 'Tab Amlodipine 5mg', dosage: '1-0-0', duration: '30 Days' }]), status: 'Completed'
  });
  insertCons.run({
    id: 'CONS-102', patientId: 'P-776655', patientName: 'Mohan Lal Gupta', token: 'A-013',
    diagnosis: 'Type 2 Diabetes Mellitus with Mild Neuropathy', scanType: 'None', scanNotes: '',
    labTests: 'Fasting Blood Sugar, Post Prandial BS', nextVisitDate: '2024-06-10', nextVisitNotes: 'Monitor morning sugar levels daily.',
    prescriptions: JSON.stringify([{ medicine: 'Tab Metformin 500mg', dosage: '1-0-1', duration: '30 Days' }, { medicine: 'Tab Methylcobalamin', dosage: '0-1-0', duration: '30 Days' }]), status: 'Completed'
  });

  // Staffs
  const insertStaff = db.prepare(`
    INSERT OR IGNORE INTO staffs (id,name,role,department,contact,email,employeeId,shift,joiningDate,status,salary)
    VALUES (@id,@name,@role,@department,@contact,@email,@employeeId,@shift,@joiningDate,@status,@salary)
  `);
  [
    { id:'STF-001', name:'Ananya Verma', role:'Front Desk Receptionist', department:'Reception & Patient Care', contact:'9845112233', email:'ananya.v@aarogyaclinic.in', employeeId:'STF-001', shift:'Morning (08:00 AM - 04:00 PM)', joiningDate:'2021-03-15', status:'Active', salary:35000 },
    { id:'STF-002', name:'Kavita Nair', role:'Senior Lab Technician', department:'Pathology & Diagnostic Lab', contact:'9845112234', email:'kavita.n@aarogyaclinic.in', employeeId:'STF-002', shift:'General (09:00 AM - 05:00 PM)', joiningDate:'2020-08-01', status:'Active', salary:42000 },
    { id:'STF-003', name:'Amitabh Verma', role:'Chief Pharmacist & Billing', department:'Pharmacy & Billing', contact:'9845112235', email:'amitabh.v@aarogyaclinic.in', employeeId:'STF-003', shift:'General (09:00 AM - 05:00 PM)', joiningDate:'2019-11-10', status:'Active', salary:45000 }
  ].forEach(s => insertStaff.run(s));

  // Rooms
  const insertRoom = db.prepare(`
    INSERT OR IGNORE INTO rooms (id,roomNumber,ward,type,status,patientId,patientName,assignedDoctor,assignedNurse,admissionDate,bed,floor)
    VALUES (@id,@roomNumber,@ward,@type,@status,@patientId,@patientName,@assignedDoctor,@assignedNurse,@admissionDate,@bed,@floor)
  `);
  [
    { id:'RM-101', roomNumber:'Bed 101', ward:'General Ward A (Male)', type:'General Bed', status:'Occupied', patientId:'P-882019', patientName:'Priya Sharma', assignedDoctor:'Dr. Arjun Mehta', assignedNurse:'Sister Anjali Nair', admissionDate:'2026-07-22', bed:'101', floor:'1st Floor' },
    { id:'RM-102', roomNumber:'Bed 102', ward:'General Ward A (Male)', type:'General Bed', status:'Available', patientId:null, patientName:null, assignedDoctor:null, assignedNurse:null, admissionDate:null, bed:'102', floor:'1st Floor' },
    { id:'RM-201', roomNumber:'ICU Bed 01', ward:'Intensive Care Unit (ICU)', type:'ICU Ventilator Bed', status:'Occupied', patientId:'P-112235', patientName:'Aryan Kumar', assignedDoctor:'Dr. Sanjay Patel', assignedNurse:'Sister Sunita Menon', admissionDate:'2026-07-23', bed:'ICU-01', floor:'2nd Floor' }
  ].forEach(r => insertRoom.run(r));

  // Payroll
  const insertPay = db.prepare(`
    INSERT OR IGNORE INTO payroll (id,employeeId,employeeName,role,department,basicSalary,allowances,deductions,netSalary,month,year,status,paidDate)
    VALUES (@id,@employeeId,@employeeName,@role,@department,@basicSalary,@allowances,@deductions,@netSalary,@month,@year,@status,@paidDate)
  `);
  [
    { id:'PAY-101', employeeId:'STF-001', employeeName:'Ananya Verma', role:'Front Desk Receptionist', department:'Reception & Patient Care', basicSalary:35000, allowances:2500, deductions:500, netSalary:37000, month:'July', year:'2026', status:'Paid', paidDate:'2026-07-01' },
    { id:'PAY-102', employeeId:'STF-002', employeeName:'Kavita Nair', role:'Senior Lab Technician', department:'Pathology Lab', basicSalary:45000, allowances:3000, deductions:0, netSalary:48000, month:'July', year:'2026', status:'Paid', paidDate:'2026-07-01' }
  ].forEach(p => insertPay.run(p));

  // Shifts
  const insertShift = db.prepare(`
    INSERT OR IGNORE INTO shifts (id,employeeId,employeeName,role,shiftType,startTime,endTime,date,hoursWorked,status,notes)
    VALUES (@id,@employeeId,@employeeName,@role,@shiftType,@startTime,@endTime,@date,@hoursWorked,@status,@notes)
  `);
  [
    { id:'SHF-101', employeeId:'STF-001', employeeName:'Ananya Verma', role:'Front Desk Receptionist', shiftType:'Morning', startTime:'08:00 AM', endTime:'04:00 PM', date:'2026-07-25', hoursWorked:8, status:'Scheduled', notes:'On time' },
    { id:'SHF-102', employeeId:'STF-002', employeeName:'Kavita Nair', role:'Senior Lab Technician', shiftType:'General', startTime:'09:00 AM', endTime:'05:00 PM', date:'2026-07-25', hoursWorked:8, status:'Scheduled', notes:'Lab routine' }
  ].forEach(s => insertShift.run(s));

  // Pharmacy Inventory
  const insertMed = db.prepare(`
    INSERT OR IGNORE INTO pharmacy_inventory (id,name,generic,category,manufacturer,batchNumber,expiryDate,stock,minThreshold,unit,costPrice,sellingPrice,supplier,location)
    VALUES (@id,@name,@generic,@category,@manufacturer,@batchNumber,@expiryDate,@stock,@minThreshold,@unit,@costPrice,@sellingPrice,@supplier,@location)
  `);
  [
    { id:'MED-101', name:'Tab. Amoxicillin + Clavulanic Acid 625mg (Augmentin)', generic:'Amoxicillin', category:'Antibiotic', manufacturer:'GSK', batchNumber:'BAT-2025-A88', expiryDate:'2027-11-30', stock:240, minThreshold:50, unit:'Strip of 10', costPrice:150, sellingPrice:185, supplier:'GlaxoSmithKline India', location:'Rack A1' },
    { id:'MED-102', name:'Tab. Paracetamol 650mg (Dolo 650)', generic:'Paracetamol', category:'Analgesic / Antipyretic', manufacturer:'Micro Labs', batchNumber:'BAT-2026-D12', expiryDate:'2028-04-15', stock:25, minThreshold:100, unit:'Strip of 15', costPrice:20, sellingPrice:32, supplier:'Micro Labs Ltd', location:'Rack A2' },
    { id:'MED-103', name:'Syr. Ascoril LS Expectorant 100ml', generic:'Levosalbutamol', category:'Cough & Cold', manufacturer:'Glenmark', batchNumber:'BAT-2025-L99', expiryDate:'2026-08-10', stock:15, minThreshold:30, unit:'Bottle (100ml)', costPrice:90, sellingPrice:118, supplier:'Glenmark Pharmaceuticals', location:'Rack B1' },
    { id:'MED-104', name:'Tab. Pan-D (Pantoprazole 40mg + Domperidone)', generic:'Pantoprazole', category:'Antacid / PPI', manufacturer:'Alkem', batchNumber:'BAT-2026-P04', expiryDate:'2028-01-20', stock:310, minThreshold:75, unit:'Strip of 15', costPrice:110, sellingPrice:140, supplier:'Alkem Laboratories', location:'Rack C1' },
    { id:'MED-105', name:'Tab. Metformin 500mg SR (Glycomet)', generic:'Metformin', category:'Anti-Diabetic', manufacturer:'USV', batchNumber:'BAT-2025-M44', expiryDate:'2027-09-01', stock:450, minThreshold:100, unit:'Strip of 20', costPrice:40, sellingPrice:55, supplier:'USV Private Limited', location:'Rack D1' }
  ].forEach(m => insertMed.run(m));

  // Pharmacy Queue
  const insertRx = db.prepare(`
    INSERT OR IGNORE INTO pharmacy_queue (id,token,patientId,patientName,age,doctorName,status,allergies,diagnosis,items,totalAmount)
    VALUES (@id,@token,@patientId,@patientName,@age,@doctorName,@status,@allergies,@diagnosis,@items,@totalAmount)
  `);
  [
    { id:'RX-9001', token:'A-013', patientId:'P-776655', patientName:'Mohan Lal Gupta', age:'44M', doctorName:'Dr. Kavitha Reddy', status:'Ready to Dispense', allergies:'Penicillin', diagnosis:'Acute Upper Respiratory Infection', items:JSON.stringify([{medId:'MED-101', name:'Tab. Amoxicillin + Clavulanic Acid 625mg', dosage:'1-0-1 after meals', qty:10, price:185}, {medId:'MED-102', name:'Tab. Paracetamol 650mg (Dolo 650)', dosage:'1-1-1 SOS', qty:15, price:32}]), totalAmount:217 },
    { id:'RX-9002', token:'C-012', patientId:'P-998877', patientName:'Anand Kumar', age:'52M', doctorName:'Dr. Arjun Mehta', status:'Ready to Dispense', allergies:'None', diagnosis:'Hypertension & Type-2 Diabetes Mellitus Follow-up', items:JSON.stringify([{medId:'MED-105', name:'Tab. Metformin 500mg SR (Glycomet)', dosage:'1-0-1 after meals', qty:60, price:55}]), totalAmount:55 }
  ].forEach(x => insertRx.run(x));

  console.log('✅ Demo data seed verification complete');
}

seedIfEmpty();

// ═══════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════

// ── Helper: parse patient row from DB ───────────────────────
function parsePatient(row) {
  if (!row) return null;
  return {
    ...row,
    allergies: (() => { try { return JSON.parse(row.allergies || '[]'); } catch { return []; } })(),
  };
}

function parseDoctor(row) {
  if (!row) return null;
  return {
    ...row,
    availableDays: (() => { try { return JSON.parse(row.availableDays || '[]'); } catch { return []; } })(),
  };
}

function parseQueueEntry(row) {
  if (!row) return null;
  return {
    ...row,
    sentToDoctor: row.sentToDoctor === 1 || row.sentToDoctor === true,
    vitals: {
      bp: row.bp || '',
      pulse: row.pulse || '',
      temp: row.temp || '',
      weight: row.weight || '',
      height: row.height || '',
      bmi: row.bmi || '',
      spo2: row.spo2 || '',
      rbs: row.rbs || '',
    },
  };
}

function parseConsultation(row) {
  if (!row) return null;
  let dateStr = row.date;
  if (!dateStr || !String(dateStr).trim() || String(dateStr).trim() === 'undefined') {
    if (row.createdAt) {
      try {
        const cleanDt = String(row.createdAt).replace(' ', 'T');
        const dt = new Date(cleanDt);
        if (!isNaN(dt.getTime())) {
          dateStr = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } else {
          dateStr = String(row.createdAt).slice(0, 10);
        }
      } catch (e) {
        dateStr = String(row.createdAt).slice(0, 10);
      }
    } else {
      dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return {
    ...row,
    date: dateStr,
    prescriptions: (() => { try { return JSON.parse(row.prescriptions || '[]'); } catch { return []; } })(),
    labTests: row.labTests ? row.labTests.split(',').filter(Boolean) : [],
  };
}

// ════════════════════════════════════════════
//  AUTHENTICATION ROUTES
// ════════════════════════════════════════════
app.post('/api/auth/login', authLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Update last login
  db.prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?').run(user.id);

  const tokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    display_name: user.display_name,
    staff_ref_id: user.staff_ref_id
  };
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  logAudit(user.id, user.role, 'LOGIN', 'auth', user.id, req.ip, { username });

  res.json({
    token,
    user: tokenPayload
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  logAudit(req.user.id, req.user.role, 'LOGOUT', 'auth', req.user.id, req.ip, null);
  res.json({ message: 'Logged out successfully' });
});

// ── Audit Log Query (admin only) ────────────────────────────
app.get('/api/audit-logs', authMiddleware, rbac('super_admin', 'manager'), (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const rows = db.prepare('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ? OFFSET ?').all(limit, offset);
  const total = db.prepare('SELECT COUNT(*) as count FROM audit_log').get().count;
  res.json({ data: rows, total, limit, offset });
});

// ── Health ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ════════════════════════════════════════════
//  PATIENTS
// ════════════════════════════════════════════
app.get('/api/patients', (req, res) => {
  const rows = db.prepare('SELECT * FROM patients ORDER BY createdAt DESC').all();
  res.json(rows.map(parsePatient));
});

app.get('/api/patients/phone/:phone', (req, res) => {
  // Strip to 10 digits for comparison
  let phone = req.params.phone.replace(/\D/g, '');
  if (phone.startsWith('91') && phone.length > 10) phone = phone.slice(2);

  const rows = db.prepare('SELECT * FROM patients').all();
  const matched = rows.filter(p => {
    let pClean = (p.phone || '').replace(/\D/g, '');
    if (pClean.startsWith('91') && pClean.length > 10) pClean = pClean.slice(2);
    return pClean === phone;
  });
  res.json(matched.map(parsePatient));
});

app.get('/api/patients/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Patient not found' });
  res.json(parsePatient(row));
});

app.post('/api/patients', (req, res) => {
  const b = req.body;
  const id = genPatientId();

  // Clean phone to 10 digits
  let phone = (b.phone || '').replace(/\D/g, '');
  if (phone.startsWith('91') && phone.length > 10) phone = phone.slice(2);

  db.prepare(`
    INSERT INTO patients (
      id,phone,fullName,dob,gender,maritalStatus,occupation,
      address,guardianName,emergencyContactName,emergencyContactPhone,
      bloodGroup,allergies,conditions,referringDoctor,
      patientCategory,insuranceProvider,policyNumber,registeredBy,status,
      relationshipToFamily,photoUrl,lastVisit
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, phone, b.fullName || '', b.dob || '', b.gender || '',
    b.maritalStatus || 'Single', b.occupation || '',
    b.address || '', b.guardianName || '',
    b.emergencyContactName || '', b.emergencyContactPhone || '',
    b.bloodGroup || '',
    JSON.stringify(Array.isArray(b.allergies) ? b.allergies : []),
    b.conditions || '', b.referringDoctor || '',
    b.patientCategory || 'General', b.insuranceProvider || '', b.policyNumber || '',
    b.registeredBy || 'Front Desk Admin', b.status || 'Active',
    b.relationshipToFamily || '',
    b.photoUrl || null, b.lastVisit || null
  );

  const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
  res.status(201).json(parsePatient(row));
});

app.put('/api/patients/:id', (req, res) => {
  const b = req.body;
  const existing = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Patient not found' });

  let phone = (b.phone || existing.phone || '').replace(/\D/g, '');
  if (phone.startsWith('91') && phone.length > 10) phone = phone.slice(2);

  db.prepare(`
    UPDATE patients SET
      phone=?,fullName=?,dob=?,gender=?,maritalStatus=?,occupation=?,
      address=?,guardianName=?,emergencyContactName=?,emergencyContactPhone=?,
      bloodGroup=?,allergies=?,conditions=?,referringDoctor=?,
      patientCategory=?,insuranceProvider=?,policyNumber=?,registeredBy=?,status=?,
      relationshipToFamily=?,photoUrl=?,lastVisit=?
    WHERE id=?
  `).run(
    phone, b.fullName ?? existing.fullName, b.dob ?? existing.dob,
    b.gender ?? existing.gender,
    b.maritalStatus ?? existing.maritalStatus ?? 'Single',
    b.occupation ?? existing.occupation ?? '',
    b.address ?? existing.address,
    b.guardianName ?? existing.guardianName ?? '',
    b.emergencyContactName ?? existing.emergencyContactName,
    b.emergencyContactPhone ?? existing.emergencyContactPhone,
    b.bloodGroup ?? existing.bloodGroup,
    JSON.stringify(Array.isArray(b.allergies) ? b.allergies : JSON.parse(existing.allergies || '[]')),
    b.conditions ?? existing.conditions,
    b.referringDoctor ?? existing.referringDoctor,
    b.patientCategory ?? existing.patientCategory ?? 'General',
    b.insuranceProvider ?? existing.insuranceProvider ?? '',
    b.policyNumber ?? existing.policyNumber ?? '',
    b.registeredBy ?? existing.registeredBy ?? 'Front Desk Admin',
    b.status ?? existing.status ?? 'Active',
    b.relationshipToFamily ?? existing.relationshipToFamily ?? '',
    b.photoUrl ?? existing.photoUrl,
    b.lastVisit ?? existing.lastVisit,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  res.json(parsePatient(row));
});

app.delete('/api/patients/:id', (req, res) => {
  db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ════════════════════════════════════════════
//  DOCTORS
// ════════════════════════════════════════════
app.get('/api/doctors', (req, res) => {
  const rows = db.prepare('SELECT * FROM doctors ORDER BY name').all();
  res.json(rows.map(parseDoctor));
});

app.get('/api/doctors/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Doctor not found' });
  res.json(parseDoctor(row));
});

app.post('/api/doctors', (req, res) => {
  const b = req.body;
  const id = genDoctorId();

  db.prepare(`
    INSERT INTO doctors (id,name,department,qualification,contact,email,availableDays,timeSlot,fee,status,licenseNumber,experience)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, b.name || '', b.department || '', b.qualification || '',
    b.contact || '', b.email || '',
    JSON.stringify(Array.isArray(b.availableDays) ? b.availableDays : []),
    b.timeSlot || '', parseFloat(b.fee) || 0, b.status || 'Active',
    b.licenseNumber || '', b.experience || ''
  );

  const row = db.prepare('SELECT * FROM doctors WHERE id = ?').get(id);
  res.status(201).json(parseDoctor(row));
});

app.put('/api/doctors/:id', (req, res) => {
  const b = req.body;
  const existing = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Doctor not found' });

  db.prepare(`
    UPDATE doctors SET name=?,department=?,qualification=?,contact=?,email=?,
      availableDays=?,timeSlot=?,fee=?,status=?,licenseNumber=?,experience=?
    WHERE id=?
  `).run(
    b.name ?? existing.name, b.department ?? existing.department,
    b.qualification ?? existing.qualification, b.contact ?? existing.contact,
    b.email ?? existing.email,
    JSON.stringify(Array.isArray(b.availableDays) ? b.availableDays : JSON.parse(existing.availableDays || '[]')),
    b.timeSlot ?? existing.timeSlot,
    parseFloat(b.fee ?? existing.fee) || 0,
    b.status ?? existing.status,
    b.licenseNumber ?? existing.licenseNumber,
    b.experience ?? existing.experience,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id);
  res.json(parseDoctor(row));
});

app.delete('/api/doctors/:id', (req, res) => {
  db.prepare('DELETE FROM doctors WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ════════════════════════════════════════════
//  NURSES
// ════════════════════════════════════════════
function genNurseId() {
  const existing = db.prepare('SELECT id FROM nurses').all().map(r => r.id);
  let id;
  do { id = `NRS-${String(Math.floor(1000 + Math.random() * 8999))}`; }
  while (existing.includes(id));
  return id;
}

app.get('/api/nurses', (req, res) => {
  const rows = db.prepare('SELECT * FROM nurses ORDER BY name').all();
  res.json(rows.map(r => ({ ...r, availableDays: JSON.parse(r.availableDays || '[]') })));
});

app.get('/api/nurses/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM nurses WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Nurse not found' });
  res.json({ ...row, availableDays: JSON.parse(row.availableDays || '[]') });
});

app.post('/api/nurses', (req, res) => {
  const b = req.body;
  const id = genNurseId();
  db.prepare(`
    INSERT INTO nurses (id,name,employeeId,department,qualification,contact,email,shift,availableDays,licenseNumber,experience,status,joiningDate)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, b.name || '', b.employeeId || id, b.department || '',
    b.qualification || '', b.contact || '', b.email || '',
    b.shift || '', JSON.stringify(Array.isArray(b.availableDays) ? b.availableDays : []),
    b.licenseNumber || '', b.experience || '',
    b.status || 'Active', b.joiningDate || ''
  );
  const row = db.prepare('SELECT * FROM nurses WHERE id = ?').get(id);
  res.status(201).json({ ...row, availableDays: JSON.parse(row.availableDays || '[]') });
});

app.put('/api/nurses/:id', (req, res) => {
  const b = req.body;
  const existing = db.prepare('SELECT * FROM nurses WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Nurse not found' });
  db.prepare(`
    UPDATE nurses SET name=?,employeeId=?,department=?,qualification=?,contact=?,email=?,
      shift=?,availableDays=?,licenseNumber=?,experience=?,status=?,joiningDate=?
    WHERE id=?
  `).run(
    b.name ?? existing.name, b.employeeId ?? existing.employeeId,
    b.department ?? existing.department, b.qualification ?? existing.qualification,
    b.contact ?? existing.contact, b.email ?? existing.email,
    b.shift ?? existing.shift,
    JSON.stringify(Array.isArray(b.availableDays) ? b.availableDays : JSON.parse(existing.availableDays || '[]')),
    b.licenseNumber ?? existing.licenseNumber, b.experience ?? existing.experience,
    b.status ?? existing.status, b.joiningDate ?? existing.joiningDate,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM nurses WHERE id = ?').get(req.params.id);
  res.json({ ...row, availableDays: JSON.parse(row.availableDays || '[]') });
});

app.delete('/api/nurses/:id', (req, res) => {
  db.prepare('DELETE FROM nurses WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ════════════════════════════════════════════
//  APPOINTMENTS
// ════════════════════════════════════════════
app.get('/api/appointments', (req, res) => {
  const rows = db.prepare('SELECT * FROM appointments ORDER BY createdAt DESC').all();
  res.json(rows);
});

app.post('/api/appointments', (req, res) => {
  const b = req.body;
  const id = genAppointmentId();
  const token = genToken(b.doctorId, b.date);

  db.prepare(`
    INSERT INTO appointments (id,patientId,patientName,doctorId,doctorName,department,date,timeSlot,reason,token,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, b.patientId || '', b.patientName || '',
    b.doctorId || '', b.doctorName || '', b.department || '',
    b.date || '', b.timeSlot || '', b.reason || '', token,
    b.status || 'Scheduled'
  );

  // Auto-add to nurse queue
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(b.patientId);
  const age = patient?.dob
    ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / (1000*60*60*24*365.25))
    : (b.age || 0);
  const gender = patient?.gender === 'Male' ? 'M' : patient?.gender === 'Female' ? 'F' : (b.gender || 'O');

  // Only add if not already in queue
  const existingQ = db.prepare('SELECT token FROM nurse_queue WHERE token = ?').get(token);
  if (!existingQ) {
    db.prepare(`
      INSERT INTO nurse_queue (token,patientId,patientName,gender,age,doctorName,status,bp,pulse,temp,weight,height,bmi,spo2,rbs,chiefComplaint,nurseNotes,sentToDoctor)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(token, b.patientId, b.patientName, gender, age, b.doctorName, 'Pending',
      '','','','','','','','','','',0);
  }

  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
  res.status(201).json(appt);
});

app.put('/api/appointments/:id', (req, res) => {
  const b = req.body;
  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Appointment not found' });

  db.prepare(`
    UPDATE appointments SET status=?,date=?,timeSlot=?,reason=? WHERE id=?
  `).run(
    b.status ?? existing.status,
    b.date ?? existing.date,
    b.timeSlot ?? existing.timeSlot,
    b.reason ?? existing.reason,
    req.params.id
  );

  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  res.json(appt);
});

// ════════════════════════════════════════════
//  NURSE QUEUE
// ════════════════════════════════════════════
app.get('/api/nurse-queue', (req, res) => {
  const rows = db.prepare("SELECT * FROM nurse_queue WHERE DATE(createdAt, 'localtime') = DATE('now', 'localtime') ORDER BY createdAt ASC").all();
  res.json(rows.map(parseQueueEntry));
});

app.post('/api/nurse-queue', (req, res) => {
  const b = req.body;
  let token = b.token;
  if (!token) {
    const count = db.prepare("SELECT COUNT(*) as c FROM nurse_queue WHERE DATE(createdAt, 'localtime') = DATE('now', 'localtime') AND token LIKE 'REG-%'").get().c;
    token = `REG-${String(count + 1).padStart(3, '0')}`;
  }

  // Upsert
  db.prepare(`
    INSERT OR REPLACE INTO nurse_queue (token,patientId,patientName,gender,age,doctorName,status,bp,pulse,temp,weight,height,bmi,spo2,rbs,chiefComplaint,nurseNotes,sentToDoctor)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    token, b.patientId || '', b.patientName || '',
    b.gender || '', b.age || 0, b.doctorName || 'Not Assigned',
    b.status || 'Pending',
    '', '', '', '', '', '', '', '', '', '', 0
  );

  const row = db.prepare('SELECT * FROM nurse_queue WHERE token = ?').get(token);
  res.status(201).json(parseQueueEntry(row));
});

app.put('/api/nurse-queue/:token', (req, res) => {
  const b = req.body;
  const existing = db.prepare('SELECT * FROM nurse_queue WHERE token = ?').get(req.params.token);
  if (!existing) return res.status(404).json({ error: 'Queue entry not found' });

  // Build SET clause dynamically for only provided fields
  const allowed = ['status','bp','pulse','temp','weight','height','bmi','spo2','rbs','chiefComplaint','nurseNotes','sentToDoctor','doctorName'];
  const sets = [];
  const vals = [];

  for (const field of allowed) {
    if (b[field] !== undefined) {
      sets.push(`${field} = ?`);
      vals.push(field === 'sentToDoctor' ? (b[field] ? 1 : 0) : b[field]);
    }
  }

  if (sets.length > 0) {
    vals.push(req.params.token);
    db.prepare(`UPDATE nurse_queue SET ${sets.join(', ')} WHERE token = ?`).run(...vals);
  }

  const row = db.prepare('SELECT * FROM nurse_queue WHERE token = ?').get(req.params.token);
  res.json(parseQueueEntry(row));
});

// ════════════════════════════════════════════
//  CONSULTATIONS
// ════════════════════════════════════════════
app.get('/api/consultations', (req, res) => {
  const rows = db.prepare('SELECT * FROM consultations ORDER BY createdAt DESC').all();
  res.json(rows.map(parseConsultation));
});

app.get('/api/consultations/patient/:patientId', (req, res) => {
  const rows = db.prepare('SELECT * FROM consultations WHERE patientId = ? ORDER BY createdAt DESC').all(req.params.patientId);
  res.json(rows.map(parseConsultation));
});

app.post('/api/consultations', (req, res) => {
  const b = req.body;
  const id = `CON-${Date.now()}`;

  const labTestsStr = Array.isArray(b.labTests)
    ? b.labTests.join(',')
    : (b.labTests || '');

  const dateVal = b.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  db.prepare(`
    INSERT INTO consultations (id,patientId,patientName,token,diagnosis,scanType,scanNotes,labTests,nextVisitDate,nextVisitNotes,prescriptions,status,date,department,notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, b.patientId || '', b.patientName || '', b.token || '',
    b.diagnosis || '', b.scanType || '', b.scanNotes || '',
    labTestsStr, b.nextVisitDate || '', b.nextVisitNotes || '',
    JSON.stringify(Array.isArray(b.prescriptions) ? b.prescriptions : []),
    'Active', dateVal, b.department || 'General', b.notes || ''
  );

  // Update patient's lastVisit
  if (b.patientId) {
    db.prepare('UPDATE patients SET lastVisit = ? WHERE id = ?')
      .run(new Date().toISOString().slice(0, 10), b.patientId);
  }

  const row = db.prepare('SELECT * FROM consultations WHERE id = ?').get(id);
  res.status(201).json(parseConsultation(row));
});

app.put('/api/consultations/:id/complete', (req, res) => {
  const cons = db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id);
  if (!cons) return res.status(404).json({ error: 'Consultation not found' });

  db.prepare('UPDATE consultations SET status = ? WHERE id = ?').run('Completed', req.params.id);

  // Flip nurse queue status to Done
  if (cons.token) {
    db.prepare('UPDATE nurse_queue SET status = ? WHERE token = ?').run('Done', cons.token);
  }

  const updated = db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id);
  res.json(parseConsultation(updated));
});

// Appointment conflict check
app.post('/api/appointments/check-conflict', (req, res) => {
  const { doctorId, date, timeSlot } = req.body;
  const existing = db.prepare(
    "SELECT id FROM appointments WHERE doctorId = ? AND date = ? AND timeSlot = ? AND status != 'Cancelled'"
  ).get(doctorId, date, timeSlot);
  if (existing) {
    return res.status(409).json({ conflict: true, message: 'Time slot already booked' });
  }
  res.json({ conflict: false });
});

// ════════════════════════════════════════════
//  STAFFS
// ════════════════════════════════════════════
function genStaffId() {
  const n = db.prepare('SELECT COUNT(*) as c FROM staffs').get().c;
  return `STF-${String(n + 101).padStart(3, '0')}`;
}

app.get('/api/staffs', (req, res) => {
  res.json(db.prepare('SELECT * FROM staffs ORDER BY name').all());
});

app.post('/api/staffs', (req, res) => {
  const b = req.body;
  const id = b.id || genStaffId();
  db.prepare(`
    INSERT OR REPLACE INTO staffs (id,name,role,department,contact,email,employeeId,shift,joiningDate,status,salary)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, b.name||'', b.role||'', b.department||'', b.contact||'', b.email||'',
    b.employeeId||id, b.shift||'', b.joiningDate||'', b.status||'Active', parseFloat(b.salary)||0);
  res.status(201).json(db.prepare('SELECT * FROM staffs WHERE id = ?').get(id));
});

app.put('/api/staffs/:id', (req, res) => {
  const b = req.body;
  const ex = db.prepare('SELECT * FROM staffs WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Staff not found' });
  db.prepare(`
    UPDATE staffs SET name=?,role=?,department=?,contact=?,email=?,employeeId=?,shift=?,joiningDate=?,status=?,salary=?
    WHERE id=?
  `).run(b.name??ex.name, b.role??ex.role, b.department??ex.department,
    b.contact??ex.contact, b.email??ex.email, b.employeeId??ex.employeeId,
    b.shift??ex.shift, b.joiningDate??ex.joiningDate, b.status??ex.status,
    parseFloat(b.salary??ex.salary)||0, req.params.id);
  res.json(db.prepare('SELECT * FROM staffs WHERE id = ?').get(req.params.id));
});

app.delete('/api/staffs/:id', (req, res) => {
  db.prepare('DELETE FROM staffs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ════════════════════════════════════════════
//  ROOMS
// ════════════════════════════════════════════
function genRoomId() {
  const n = db.prepare('SELECT COUNT(*) as c FROM rooms').get().c;
  return `RM-${String(n + 101).padStart(3, '0')}`;
}

app.get('/api/rooms', (req, res) => {
  res.json(db.prepare('SELECT * FROM rooms ORDER BY ward, roomNumber').all());
});

app.post('/api/rooms', (req, res) => {
  const b = req.body;
  const id = b.id || genRoomId();
  db.prepare(`
    INSERT OR REPLACE INTO rooms (id,roomNumber,ward,type,status,patientId,patientName,assignedDoctor,assignedNurse,admissionDate,bed,floor)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, b.roomNumber||'', b.ward||'', b.type||'General',
    b.status||'Available', b.patientId||null, b.patientName||null,
    b.assignedDoctor||null, b.assignedNurse||null, b.admissionDate||null,
    b.bed||'', b.floor||'');
  res.status(201).json(db.prepare('SELECT * FROM rooms WHERE id = ?').get(id));
});

app.put('/api/rooms/:id', (req, res) => {
  const b = req.body;
  const ex = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Room not found' });
  db.prepare(`
    UPDATE rooms SET roomNumber=?,ward=?,type=?,status=?,patientId=?,patientName=?,
      assignedDoctor=?,assignedNurse=?,admissionDate=?,bed=?,floor=?
    WHERE id=?
  `).run(b.roomNumber??ex.roomNumber, b.ward??ex.ward, b.type??ex.type,
    b.status??ex.status, b.patientId??ex.patientId, b.patientName??ex.patientName,
    b.assignedDoctor??ex.assignedDoctor, b.assignedNurse??ex.assignedNurse,
    b.admissionDate??ex.admissionDate, b.bed??ex.bed, b.floor??ex.floor,
    req.params.id);
  res.json(db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id));
});

app.delete('/api/rooms/:id', (req, res) => {
  db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ════════════════════════════════════════════
//  PAYROLL
// ════════════════════════════════════════════
function genPayrollId() {
  return `PAY-${Date.now()}`;
}

app.get('/api/hr/payroll', (req, res) => {
  res.json(db.prepare('SELECT * FROM payroll ORDER BY createdAt DESC').all());
});

app.post('/api/hr/payroll', (req, res) => {
  const b = req.body;
  const id = b.id || genPayrollId();
  const net = (parseFloat(b.basicSalary)||0) + (parseFloat(b.allowances)||0) - (parseFloat(b.deductions)||0);
  db.prepare(`
    INSERT OR REPLACE INTO payroll (id,employeeId,employeeName,role,department,basicSalary,allowances,deductions,netSalary,month,year,status,paidDate)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, b.employeeId||'', b.employeeName||'', b.role||'', b.department||'',
    parseFloat(b.basicSalary)||0, parseFloat(b.allowances)||0, parseFloat(b.deductions)||0,
    net, b.month||'', b.year||'', b.status||'Pending', b.paidDate||null);
  res.status(201).json(db.prepare('SELECT * FROM payroll WHERE id = ?').get(id));
});

app.put('/api/hr/payroll/:id', (req, res) => {
  const b = req.body;
  const ex = db.prepare('SELECT * FROM payroll WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Payroll record not found' });
  const net = (parseFloat(b.basicSalary??ex.basicSalary)||0) + (parseFloat(b.allowances??ex.allowances)||0) - (parseFloat(b.deductions??ex.deductions)||0);
  db.prepare(`
    UPDATE payroll SET employeeName=?,role=?,basicSalary=?,allowances=?,deductions=?,netSalary=?,
      month=?,year=?,status=?,paidDate=? WHERE id=?
  `).run(b.employeeName??ex.employeeName, b.role??ex.role,
    parseFloat(b.basicSalary??ex.basicSalary)||0, parseFloat(b.allowances??ex.allowances)||0,
    parseFloat(b.deductions??ex.deductions)||0, net,
    b.month??ex.month, b.year??ex.year, b.status??ex.status,
    b.paidDate??ex.paidDate, req.params.id);
  res.json(db.prepare('SELECT * FROM payroll WHERE id = ?').get(req.params.id));
});

// ════════════════════════════════════════════
//  SHIFTS / WORKING HOURS
// ════════════════════════════════════════════
function genShiftId() {
  return `SHF-${Date.now()}`;
}

app.get('/api/hr/shifts', (req, res) => {
  res.json(db.prepare('SELECT * FROM shifts ORDER BY date DESC, startTime').all());
});

app.post('/api/hr/shifts', (req, res) => {
  const b = req.body;
  const id = b.id || genShiftId();
  db.prepare(`
    INSERT OR REPLACE INTO shifts (id,employeeId,employeeName,role,shiftType,startTime,endTime,date,hoursWorked,status,notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, b.employeeId||'', b.employeeName||'', b.role||'',
    b.shiftType||'', b.startTime||'', b.endTime||'', b.date||'',
    parseFloat(b.hoursWorked)||0, b.status||'Scheduled', b.notes||'');
  res.status(201).json(db.prepare('SELECT * FROM shifts WHERE id = ?').get(id));
});

app.put('/api/hr/shifts/:id', (req, res) => {
  const b = req.body;
  const ex = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Shift not found' });
  db.prepare(`
    UPDATE shifts SET employeeName=?,role=?,shiftType=?,startTime=?,endTime=?,date=?,hoursWorked=?,status=?,notes=?
    WHERE id=?
  `).run(b.employeeName??ex.employeeName, b.role??ex.role,
    b.shiftType??ex.shiftType, b.startTime??ex.startTime, b.endTime??ex.endTime,
    b.date??ex.date, parseFloat(b.hoursWorked??ex.hoursWorked)||0,
    b.status??ex.status, b.notes??ex.notes, req.params.id);
  res.json(db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id));
});

// ════════════════════════════════════════════
//  PHARMACY — INVENTORY
// ════════════════════════════════════════════
function genPharmId(table) {
  const n = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
  return `${table.toUpperCase().slice(0,3)}-${Date.now()}-${n}`;
}

function parseInventory(row) {
  if (!row) return null;
  return { ...row };
}

app.get('/api/pharmacy/inventory', (req, res) => {
  res.json(db.prepare('SELECT * FROM pharmacy_inventory ORDER BY name').all().map(parseInventory));
});

app.post('/api/pharmacy/inventory', (req, res) => {
  const b = req.body;
  const id = b.id || `MED-${Date.now()}`;
  db.prepare(`
    INSERT OR REPLACE INTO pharmacy_inventory
      (id,name,generic,category,manufacturer,batchNumber,expiryDate,stock,minThreshold,unit,costPrice,sellingPrice,supplier,location)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, b.name||'', b.generic||'', b.category||'', b.manufacturer||'',
    b.batchNumber||'', b.expiryDate||'', parseInt(b.stock)||0,
    parseInt(b.minThreshold)||10, b.unit||'Tablet',
    parseFloat(b.costPrice)||0, parseFloat(b.sellingPrice)||0,
    b.supplier||'', b.location||'');
  res.status(201).json(db.prepare('SELECT * FROM pharmacy_inventory WHERE id = ?').get(id));
});

app.put('/api/pharmacy/inventory/:id', (req, res) => {
  const b = req.body;
  const ex = db.prepare('SELECT * FROM pharmacy_inventory WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Medication not found' });
  db.prepare(`
    UPDATE pharmacy_inventory SET name=?,generic=?,category=?,manufacturer=?,batchNumber=?,
      expiryDate=?,stock=?,minThreshold=?,unit=?,costPrice=?,sellingPrice=?,supplier=?,location=?
    WHERE id=?
  `).run(b.name??ex.name, b.generic??ex.generic, b.category??ex.category,
    b.manufacturer??ex.manufacturer, b.batchNumber??ex.batchNumber,
    b.expiryDate??ex.expiryDate, parseInt(b.stock??ex.stock)||0,
    parseInt(b.minThreshold??ex.minThreshold)||10, b.unit??ex.unit,
    parseFloat(b.costPrice??ex.costPrice)||0, parseFloat(b.sellingPrice??ex.sellingPrice)||0,
    b.supplier??ex.supplier, b.location??ex.location, req.params.id);
  res.json(db.prepare('SELECT * FROM pharmacy_inventory WHERE id = ?').get(req.params.id));
});

app.delete('/api/pharmacy/inventory/:id', (req, res) => {
  db.prepare('DELETE FROM pharmacy_inventory WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ════════════════════════════════════════════
//  PHARMACY — PRESCRIPTION QUEUE
// ════════════════════════════════════════════
function parseRx(row) {
  if (!row) return null;
  return {
    ...row,
    items: (() => { try { return JSON.parse(row.items || '[]'); } catch { return []; } })(),
  };
}

app.get('/api/pharmacy/prescriptions', (req, res) => {
  res.json(db.prepare('SELECT * FROM pharmacy_queue ORDER BY createdAt DESC').all().map(parseRx));
});

app.post('/api/pharmacy/prescriptions', (req, res) => {
  const b = req.body;
  const id = b.id || `RX-${Date.now()}`;
  db.prepare(`
    INSERT OR REPLACE INTO pharmacy_queue (id,token,patientId,patientName,age,doctorName,status,allergies,diagnosis,items,totalAmount)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, b.token||'', b.patientId||'', b.patientName||'',
    b.age||'', b.doctorName||'', b.status||'Ready to Dispense',
    Array.isArray(b.allergies) ? b.allergies.join(',') : (b.allergies||''),
    b.diagnosis||'',
    JSON.stringify(Array.isArray(b.items) ? b.items : []),
    parseFloat(b.totalAmount)||0);
  res.status(201).json(parseRx(db.prepare('SELECT * FROM pharmacy_queue WHERE id = ?').get(id)));
});

// Dispense prescription — ATOMIC: deduct stock + mark dispensed + create bill
app.put('/api/pharmacy/prescriptions/:id/dispense', (req, res) => {
  const { paymentMethod } = req.body;
  const rx = db.prepare('SELECT * FROM pharmacy_queue WHERE id = ?').get(req.params.id);
  if (!rx) return res.status(404).json({ error: 'Prescription not found' });
  if (rx.status === 'Dispensed') return res.status(409).json({ error: 'Already dispensed' });

  const items = (() => { try { return JSON.parse(rx.items || '[]'); } catch { return []; } })();
  const sub = items.reduce((s, i) => s + (parseFloat(i.price)||0) * (parseInt(i.qty)||1), 0);
  const gst = Math.round(sub * 0.12 * 100) / 100;
  const disc = Math.round(sub * 0.05 * 100) / 100;
  const total = Math.round((sub + gst - disc) * 100) / 100;
  const billId = `INV-${Date.now()}`;
  const now = new Date().toLocaleString('en-IN');

  // ATOMIC TRANSACTION
  const dispense = db.transaction(() => {
    // 1. Deduct stock for each item
    for (const item of items) {
      if (item.name) {
        db.prepare(`
          UPDATE pharmacy_inventory SET stock = MAX(0, stock - ?)
          WHERE LOWER(name) LIKE LOWER(?)
        `).run(parseInt(item.qty)||1, `%${item.name}%`);
      }
    }
    // 2. Mark Rx as Dispensed
    db.prepare('UPDATE pharmacy_queue SET status = ? WHERE id = ?').run('Dispensed', req.params.id);
    // 3. Create bill
    db.prepare(`
      INSERT INTO pharmacy_bills (id,rxId,patientName,patientId,date,itemsCount,subtotal,gst,discount,total,paymentMethod,status,items)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(billId, rx.id, rx.patientName, rx.patientId, now,
      items.length, sub, gst, disc, total,
      paymentMethod || 'Cash', 'Paid',
      rx.items);
  });

  dispense();

  res.json({
    success: true,
    bill: db.prepare('SELECT * FROM pharmacy_bills WHERE id = ?').get(billId),
    rx: parseRx(db.prepare('SELECT * FROM pharmacy_queue WHERE id = ?').get(req.params.id)),
  });
});

// ════════════════════════════════════════════
//  PHARMACY — BILLS
// ════════════════════════════════════════════
function parseBill(row) {
  if (!row) return null;
  return {
    ...row,
    items: (() => { try { return JSON.parse(row.items || '[]'); } catch { return []; } })(),
  };
}

app.get('/api/pharmacy/bills', (req, res) => {
  res.json(db.prepare('SELECT * FROM pharmacy_bills ORDER BY createdAt DESC').all().map(parseBill));
});

// Return bill — ATOMIC: restore stock + mark returned
app.put('/api/pharmacy/bills/:id/return', (req, res) => {
  const { returnReason } = req.body;
  const bill = db.prepare('SELECT * FROM pharmacy_bills WHERE id = ?').get(req.params.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });
  if (bill.status !== 'Paid') return res.status(409).json({ error: 'Bill cannot be returned' });

  const items = (() => { try { return JSON.parse(bill.items || '[]'); } catch { return []; } })();

  const doReturn = db.transaction(() => {
    // 1. Restore stock
    for (const item of items) {
      if (item.name) {
        db.prepare(`
          UPDATE pharmacy_inventory SET stock = stock + ?
          WHERE LOWER(name) LIKE LOWER(?)
        `).run(parseInt(item.qty)||1, `%${item.name}%`);
      }
    }
    // 2. Mark bill as returned
    db.prepare('UPDATE pharmacy_bills SET status = ?, returnReason = ? WHERE id = ?')
      .run('Returned & Refunded', returnReason || '', req.params.id);
  });

  doReturn();
  res.json({ success: true, bill: parseBill(db.prepare('SELECT * FROM pharmacy_bills WHERE id = ?').get(req.params.id)) });
});

// ── 404 catch-all ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏥  Clinic Backend running at http://localhost:${PORT}`);
  console.log(`   Health:       GET  http://localhost:${PORT}/api/health`);
  console.log(`   Patients:     GET  http://localhost:${PORT}/api/patients`);
  console.log(`   Pharmacy:     GET  http://localhost:${PORT}/api/pharmacy/inventory`);
  console.log(`   Staffs:       GET  http://localhost:${PORT}/api/staffs`);
  console.log(`   Rooms:        GET  http://localhost:${PORT}/api/rooms\n`);
});
