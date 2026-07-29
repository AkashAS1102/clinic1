package com.clinic;

import com.clinic.model.*;
import com.clinic.repository.*;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Runs once at startup:
 *  1. Creates all tables (CREATE TABLE IF NOT EXISTS) — safe to re-run.
 *  2. Seeds demo data if the patients table is empty.
 */
@Component
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final JdbcTemplate           jdbc;
    private final PatientRepository      patientRepo;
    private final DoctorRepository       doctorRepo;
    private final AppointmentRepository  apptRepo;
    private final NurseQueueRepository   queueRepo;
    private final ConsultationRepository conRepo;

    public DataInitializer(JdbcTemplate jdbc,
                           PatientRepository patientRepo,
                           DoctorRepository doctorRepo,
                           AppointmentRepository apptRepo,
                           NurseQueueRepository queueRepo,
                           ConsultationRepository conRepo) {
        this.jdbc        = jdbc;
        this.patientRepo = patientRepo;
        this.doctorRepo  = doctorRepo;
        this.apptRepo    = apptRepo;
        this.queueRepo   = queueRepo;
        this.conRepo     = conRepo;
    }

    @PostConstruct
    public void init() {
        createSchema();
        if (patientRepo.count() == 0) {
            seedData();
        } else {
            log.info("Database already contains data — skipping seed.");
        }
    }

    // ── Schema ────────────────────────────────────────────────────────────────

    private void createSchema() {
        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS patients (
              id                    TEXT PRIMARY KEY,
              phone                 TEXT NOT NULL,
              fullName              TEXT NOT NULL,
              dob                   TEXT,
              gender                TEXT,
              address               TEXT,
              emergencyContactName  TEXT,
              emergencyContactPhone TEXT,
              bloodGroup            TEXT,
              allergies             TEXT DEFAULT '[]',
              conditions            TEXT,
              referringDoctor       TEXT,
              photoUrl              TEXT,
              lastVisit             TEXT,
              createdAt             TEXT DEFAULT (datetime('now'))
            )""");

        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS doctors (
              id            TEXT PRIMARY KEY,
              name          TEXT NOT NULL,
              department    TEXT,
              qualification TEXT,
              contact       TEXT,
              email         TEXT,
              availableDays TEXT DEFAULT '[]',
              timeSlot      TEXT,
              fee           REAL DEFAULT 0,
              status        TEXT DEFAULT 'Active',
              photoUrl      TEXT,
              createdAt     TEXT DEFAULT (datetime('now'))
            )""");

        jdbc.execute("""
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
            )""");

        jdbc.execute("""
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
            )""");

        jdbc.execute("""
            CREATE TABLE IF NOT EXISTS consultations (
              id             TEXT PRIMARY KEY,
              patientId      TEXT,
              patientName    TEXT,
              token          TEXT,
              diagnosis      TEXT,
              scanType       TEXT,
              scanNotes      TEXT,
              labTests       TEXT,
              nextVisitDate  TEXT,
              nextVisitNotes TEXT,
              prescriptions  TEXT DEFAULT '[]',
              status         TEXT DEFAULT 'Active',
              createdAt      TEXT DEFAULT (datetime('now'))
            )""");

        log.info("✅ Database schema ready");
    }

    // ── Seed ──────────────────────────────────────────────────────────────────

    private void seedData() {
        log.info("🌱 Seeding demo data...");
        String now = com.clinic.service.PatientService.now();

        // ── Patients ──────────────────────────────────────────────────────────

        Patient p1 = patient("P-882019", "9876543210", "Priya Sharma",      "1985-10-14", "Female",
            "12, Gandhi Nagar, Near Shiv Temple, Pune, Maharashtra 411001",
            "Ramesh Sharma", "9876543211", "B+", List.of("Penicillin"),
            "Hypertension", "Dr. Arjun Mehta", "2024-03-02", now);

        Patient p2 = patient("P-112233", "9845001122", "Rajesh Kumar",      "1980-12-05", "Male",
            "45, MG Road, Koramangala, Bengaluru, Karnataka 560034",
            "Sunita Kumar", "9845001123", "O+", List.of(),
            "", "", "2024-01-15", now);

        Patient p3 = patient("P-112234", "9845001122", "Sunita Kumar",      "1982-04-22", "Female",
            "45, MG Road, Koramangala, Bengaluru, Karnataka 560034",
            "Rajesh Kumar", "9845001122", "A+", List.of("Sulfa"),
            "Asthma", "", "2024-02-20", now);

        Patient p4 = patient("P-112235", "9845001122", "Aryan Kumar",       "2010-09-14", "Male",
            "45, MG Road, Koramangala, Bengaluru, Karnataka 560034",
            "Rajesh Kumar", "9845001122", "O+", List.of(),
            "", "", "2023-11-05", now);

        Patient p5 = patient("P-776655", "9900112233", "Mohan Lal Gupta",  "1979-12-04", "Male",
            "22, Sector 15, Chandigarh, Punjab 160015",
            "Kavita Gupta", "9900112234", "AB+", List.of(),
            "Diabetes Type 2", "Dr. Sanjay Patel", "2024-04-10", now);

        patientRepo.saveAll(List.of(p1, p2, p3, p4, p5));

        // ── Doctors ───────────────────────────────────────────────────────────

        Doctor d1 = doctor("DOC-8832", "Arjun Mehta",   "Cardiology",       "MD, FACC",
            "+91 98765 43210", "arjun.mehta@clinic.in",
            List.of("Mon","Tue","Wed","Fri"), "Full Day (09:00 - 17:00)", 800.0, "Active", now);

        Doctor d2 = doctor("DOC-8845", "Deepa Nair",    "Neurology",        "MD, DM",
            "+91 98765 43211", "deepa.nair@clinic.in",
            List.of("Mon","Wed","Thu"), "Morning OP (09:00 - 13:00)", 1000.0, "On Leave", now);

        Doctor d3 = doctor("DOC-8901", "Sanjay Patel",  "Pediatrics",       "MBBS, DCH",
            "+91 97654 32100", "sanjay.patel@clinic.in",
            List.of("Tue","Thu","Sat"), "Evening OP (14:00 - 18:00)", 600.0, "Active", now);

        Doctor d4 = doctor("DOC-9012", "Kavitha Reddy", "General Medicine", "MBBS, MD",
            "+91 98765 43212", "kavitha.reddy@clinic.in",
            List.of("Mon","Tue","Wed","Thu","Fri"), "Full Day (09:00 - 17:00)", 500.0, "Active", now);

        doctorRepo.saveAll(List.of(d1, d2, d3, d4));

        // ── Appointments ──────────────────────────────────────────────────────

        Appointment a1 = appt("APT-001","P-882019","Priya Sharma",
            "DOC-8832","Dr. Arjun Mehta","Cardiology",
            "2024-05-15","09:00 AM","Routine follow-up for hypertension management.",
            "A-012","Scheduled", now);

        Appointment a2 = appt("APT-002","P-776655","Mohan Lal Gupta",
            "DOC-9012","Dr. Kavitha Reddy","General Medicine",
            "2024-05-15","10:00 AM","Blood sugar follow-up.",
            "A-013","Completed", now);

        apptRepo.saveAll(List.of(a1, a2));

        // ── Nurse Queue ───────────────────────────────────────────────────────

        NurseQueue nq1 = queue("A-012","P-882019","Priya Sharma",   "F",39,"Dr. Arjun Mehta",
            "Pending","130/85","","98.6","","","","","","","",false, now);

        NurseQueue nq2 = queue("A-013","P-776655","Mohan Lal Gupta","M",44,"Dr. Kavitha Reddy",
            "Pending","","","","","","","","","","",false, now);

        NurseQueue nq3 = queue("B-045","P-112233","Rajesh Kumar",   "M",43,"Dr. Arjun Mehta",
            "Pending","","","","","","","","","","",false, now);

        NurseQueue nq4 = queue("A-011","P-112234","Sunita Kumar",   "F",41,"Dr. Kavitha Reddy",
            "Done","130/85","","98.2","62","158","24.8","98","105",
            "Cold and cough for 2 days","Patient seems anxious. BP slightly elevated.",true, now);

        queueRepo.saveAll(List.of(nq1, nq2, nq3, nq4));

        log.info("✅ Seed complete — 5 patients, 4 doctors, 2 appointments, 4 queue entries");
    }

    // ── Builder helpers ───────────────────────────────────────────────────────

    private Patient patient(String id, String phone, String fullName,
                            String dob, String gender, String address,
                            String ecName, String ecPhone,
                            String bloodGroup, List<String> allergies,
                            String conditions, String referringDoctor,
                            String lastVisit, String createdAt) {
        Patient p = new Patient();
        p.setId(id); p.setPhone(phone); p.setFullName(fullName);
        p.setDob(dob); p.setGender(gender); p.setAddress(address);
        p.setEmergencyContactName(ecName); p.setEmergencyContactPhone(ecPhone);
        p.setBloodGroup(bloodGroup); p.setAllergies(allergies);
        p.setConditions(conditions); p.setReferringDoctor(referringDoctor);
        p.setLastVisit(lastVisit); p.setCreatedAt(createdAt);
        return p;
    }

    private Doctor doctor(String id, String name, String department,
                          String qualification, String contact, String email,
                          List<String> availableDays, String timeSlot,
                          Double fee, String status, String createdAt) {
        Doctor d = new Doctor();
        d.setId(id); d.setName(name); d.setDepartment(department);
        d.setQualification(qualification); d.setContact(contact); d.setEmail(email);
        d.setAvailableDays(availableDays); d.setTimeSlot(timeSlot);
        d.setFee(fee); d.setStatus(status); d.setCreatedAt(createdAt);
        return d;
    }

    private Appointment appt(String id, String patientId, String patientName,
                             String doctorId, String doctorName, String department,
                             String date, String timeSlot, String reason,
                             String token, String status, String createdAt) {
        Appointment a = new Appointment();
        a.setId(id); a.setPatientId(patientId); a.setPatientName(patientName);
        a.setDoctorId(doctorId); a.setDoctorName(doctorName); a.setDepartment(department);
        a.setDate(date); a.setTimeSlot(timeSlot); a.setReason(reason);
        a.setToken(token); a.setStatus(status); a.setCreatedAt(createdAt);
        return a;
    }

    private NurseQueue queue(String token, String patientId, String patientName,
                             String gender, int age, String doctorName,
                             String status,
                             String bp, String pulse, String temp,
                             String weight, String height, String bmi,
                             String spo2, String rbs,
                             String chiefComplaint, String nurseNotes,
                             boolean sentToDoctor, String createdAt) {
        NurseQueue q = new NurseQueue();
        q.setToken(token); q.setPatientId(patientId); q.setPatientName(patientName);
        q.setGender(gender); q.setAge(age); q.setDoctorName(doctorName);
        q.setStatus(status);
        q.setBp(bp); q.setPulse(pulse); q.setTemp(temp);
        q.setWeight(weight); q.setHeight(height); q.setBmi(bmi);
        q.setSpo2(spo2); q.setRbs(rbs);
        q.setChiefComplaint(chiefComplaint); q.setNurseNotes(nurseNotes);
        q.setSentToDoctor(sentToDoctor); q.setCreatedAt(createdAt);
        return q;
    }
}
