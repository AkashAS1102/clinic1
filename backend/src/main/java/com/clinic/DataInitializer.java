package com.clinic;

import com.clinic.model.*;
import com.clinic.repository.*;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Component
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final PatientRepository patientRepo;
    private final DoctorRepository doctorRepo;
    private final AppointmentRepository apptRepo;
    private final NurseQueueRepository queueRepo;
    private final NurseRepository nurseRepo;
    private final StaffRepository staffRepo;
    private final RoomRepository roomRepo;
    private final PayrollRepository payrollRepo;
    private final ShiftRepository shiftRepo;
    private final PharmacyInventoryRepository pharmacyRepo;
    private final ConsultationRepository consultationRepo;
    private final IpPatientRepository ipPatientRepo;
    private final PharmacyBillRepository pharmacyBillRepo;

    public DataInitializer(PatientRepository patientRepo, DoctorRepository doctorRepo,
            AppointmentRepository apptRepo, NurseQueueRepository queueRepo,
            NurseRepository nurseRepo, StaffRepository staffRepo, RoomRepository roomRepo,
            PayrollRepository payrollRepo, ShiftRepository shiftRepo,
            PharmacyInventoryRepository pharmacyRepo,
            ConsultationRepository consultationRepo,
            IpPatientRepository ipPatientRepo,
            PharmacyBillRepository pharmacyBillRepo) {
        this.patientRepo = patientRepo; this.doctorRepo = doctorRepo;
        this.apptRepo = apptRepo; this.queueRepo = queueRepo;
        this.nurseRepo = nurseRepo; this.staffRepo = staffRepo;
        this.roomRepo = roomRepo; this.payrollRepo = payrollRepo;
        this.shiftRepo = shiftRepo; this.pharmacyRepo = pharmacyRepo;
        this.consultationRepo = consultationRepo;
        this.ipPatientRepo = ipPatientRepo;
        this.pharmacyBillRepo = pharmacyBillRepo;
    }

    @PostConstruct
    public void init() {
        log.info("Database schema managed by Hibernate ddl-auto=update");
        if (patientRepo.count() == 0) seedData();
        else log.info("Database already contains core data - verifying module seeds...");

        seedConsultationsIfEmpty();
        seedIpPatientsIfEmpty();
        seedPharmacyBillsIfEmpty();
    }

    private void seedData() {
        log.info("Seeding demo data for all modules...");
        String now = ts();

        patientRepo.saveAll(List.of(
            patient("P-882019","9876543210","Priya Sharma","1985-10-14","Female",
                "12, Gandhi Nagar, Pune, Maharashtra 411001","Ramesh Sharma","9876543211",
                "B+",List.of("Penicillin"),"Hypertension","Dr. Arjun Mehta","2024-03-02",now),
            patient("P-112233","9845001122","Rajesh Kumar","1980-12-05","Male",
                "45, MG Road, Bengaluru, Karnataka 560034","Sunita Kumar","9845001123",
                "O+",List.of(),"","","2024-01-15",now),
            patient("P-112234","9845001122","Sunita Kumar","1982-04-22","Female",
                "45, MG Road, Bengaluru, Karnataka 560034","Rajesh Kumar","9845001122",
                "A+",List.of("Sulfa"),"Asthma","","2024-02-20",now),
            patient("P-112235","9845001122","Aryan Kumar","2010-09-14","Male",
                "45, MG Road, Bengaluru, Karnataka 560034","Rajesh Kumar","9845001122",
                "O+",List.of(),"","","2023-11-05",now),
            patient("P-776655","9900112233","Mohan Lal Gupta","1979-12-04","Male",
                "22, Sector 15, Chandigarh 160015","Kavita Gupta","9900112234",
                "AB+",List.of(),"Diabetes Type 2","Dr. Sanjay Patel","2024-04-10",now)
        ));

        doctorRepo.saveAll(List.of(
            doctor("DOC-8832","Arjun Mehta","Cardiology","MD, FACC","+91 98765 43210",
                "arjun.mehta@clinic.in",List.of("Mon","Tue","Wed","Fri"),
                "Full Day (09:00 - 17:00)",800.0,"Active",now),
            doctor("DOC-8845","Deepa Nair","Neurology","MD, DM","+91 98765 43211",
                "deepa.nair@clinic.in",List.of("Mon","Wed","Thu"),
                "Morning OP (09:00 - 13:00)",1000.0,"On Leave",now),
            doctor("DOC-8901","Sanjay Patel","Pediatrics","MBBS, DCH","+91 97654 32100",
                "sanjay.patel@clinic.in",List.of("Tue","Thu","Sat"),
                "Evening OP (14:00 - 18:00)",600.0,"Active",now),
            doctor("DOC-9012","Kavitha Reddy","General Medicine","MBBS, MD","+91 98765 43212",
                "kavitha.reddy@clinic.in",List.of("Mon","Tue","Wed","Thu","Fri"),
                "Full Day (09:00 - 17:00)",500.0,"Active",now)
        ));

        apptRepo.saveAll(List.of(
            appt("APT-001","P-882019","Priya Sharma","DOC-8832","Dr. Arjun Mehta","Cardiology",
                "2024-05-15","09:00 AM","Routine follow-up for hypertension.","A-012","Scheduled",now),
            appt("APT-002","P-776655","Mohan Lal Gupta","DOC-9012","Dr. Kavitha Reddy","General Medicine",
                "2024-05-15","10:00 AM","Blood sugar follow-up.","A-013","Completed",now)
        ));

        queueRepo.saveAll(List.of(
            queue("A-012","P-882019","Priya Sharma","F",39,"Dr. Arjun Mehta",
                "Pending","130/85","","98.6","","","","","","","",false,now),
            queue("A-013","P-776655","Mohan Lal Gupta","M",44,"Dr. Kavitha Reddy",
                "Pending","","","","","","","","","","",false,now),
            queue("B-045","P-112233","Rajesh Kumar","M",43,"Dr. Arjun Mehta",
                "Pending","","","","","","","","","","",false,now),
            queue("A-011","P-112234","Sunita Kumar","F",41,"Dr. Kavitha Reddy",
                "Done","130/85","","98.2","62","158","24.8","98","105",
                "Cold and cough for 2 days","Patient seems anxious.",true,now)
        ));

        nurseRepo.saveAll(List.of(
            nurse("NUR-1001","Meena Pillai","EMP-N001","General Ward","B.Sc Nursing",
                "+91 98001 11001","meena.pillai@clinic.in","Morning",
                List.of("Mon","Tue","Wed","Thu","Fri"),"NUR-KL-2018-001","6 years","Active","2018-06-01",now),
            nurse("NUR-1002","Kavya Sharma","EMP-N002","ICU","M.Sc Nursing",
                "+91 98001 11002","kavya.sharma@clinic.in","Evening",
                List.of("Mon","Wed","Fri","Sat"),"NUR-MH-2020-002","4 years","Active","2020-03-15",now),
            nurse("NUR-1003","Sujata Rao","EMP-N003","Pediatrics","B.Sc Nursing",
                "+91 98001 11003","sujata.rao@clinic.in","Night",
                List.of("Tue","Thu","Sat","Sun"),"NUR-KA-2019-003","5 years","Active","2019-08-10",now)
        ));

        staffRepo.saveAll(List.of(
            staff("STF-2001","Ramesh Iyer","Receptionist","Front Desk",
                "+91 99001 22001","ramesh.iyer@clinic.in","EMP-S001","Morning","2021-04-01","Active",28000.0,now),
            staff("STF-2002","Anita Gupta","Lab Technician","Pathology",
                "+91 99001 22002","anita.gupta@clinic.in","EMP-S002","Morning","2020-09-15","Active",32000.0,now),
            staff("STF-2003","Vinod Kumar","Pharmacist","Pharmacy",
                "+91 99001 22003","vinod.kumar@clinic.in","EMP-S003","Full Day","2019-11-01","Active",36000.0,now),
            staff("STF-2004","Priya Nair","Housekeeping","Maintenance",
                "+91 99001 22004","priya.nair@clinic.in","EMP-S004","Morning","2022-01-10","Active",18000.0,now)
        ));

        roomRepo.saveAll(List.of(
            room("RM-101","101","A","General Ward","1","Block A","Floor 1",1200.0,"Available"),
            room("RM-102","102","B","General Ward","1","Block A","Floor 1",1200.0,"Available"),
            room("RM-103","103","C","General Ward","1","Block A","Floor 1",1200.0,"Available"),
            room("RM-201","201","A","Semi-Private","2","Block B","Floor 2",2500.0,"Available"),
            room("RM-202","202","B","Semi-Private","2","Block B","Floor 2",2500.0,"Available"),
            room("RM-301","301","A","Private","1","Block C","Floor 3",5000.0,"Available"),
            room("RM-302","302","B","Private","1","Block C","Floor 3",5000.0,"Available"),
            room("RM-ICU1","ICU-01","A","ICU","1","Block D","Floor 1",8000.0,"Available"),
            room("RM-ICU2","ICU-02","B","ICU","2","Block D","Floor 1",8000.0,"Available")
        ));

        payrollRepo.saveAll(List.of(
            payroll("PAY-0001","EMP-N001","Meena Pillai","Nurse","General Ward",
                35000.0,5000.0,2000.0,38000.0,"September","2026","Paid","2026-09-05",now),
            payroll("PAY-0002","EMP-N002","Kavya Sharma","Nurse","ICU",
                40000.0,6000.0,2500.0,43500.0,"September","2026","Paid","2026-09-05",now),
            payroll("PAY-0003","EMP-S001","Ramesh Iyer","Receptionist","Front Desk",
                28000.0,3000.0,1500.0,29500.0,"September","2026","Pending",null,now),
            payroll("PAY-0004","EMP-S003","Vinod Kumar","Pharmacist","Pharmacy",
                36000.0,4000.0,1800.0,38200.0,"September","2026","Pending",null,now)
        ));

        shiftRepo.saveAll(List.of(
            shift("SHF-0001","EMP-N001","Meena Pillai","Nurse","Morning","07:00","15:00","2026-09-15",8.0,"Completed","",now),
            shift("SHF-0002","EMP-N002","Kavya Sharma","Nurse","Evening","15:00","23:00","2026-09-15",8.0,"In Progress","",now),
            shift("SHF-0003","EMP-N003","Sujata Rao","Nurse","Night","23:00","07:00","2026-09-15",8.0,"Scheduled","",now),
            shift("SHF-0004","EMP-S001","Ramesh Iyer","Receptionist","Morning","08:00","16:00","2026-09-15",8.0,"In Progress","",now)
        ));

        pharmacyRepo.saveAll(List.of(
            med("MED-001","Paracetamol 500mg","Paracetamol","Tablet / Capsule","Sun Pharma","BATCH-2026-P01","2028-06-30",500,50,"Strips",2.50,15.0,"MedLine Distributors","Shelf A-1",now),
            med("MED-002","Amoxicillin 250mg","Amoxicillin","Antibiotic","Cipla","BATCH-2026-A01","2027-12-31",200,30,"Strips",18.0,80.0,"Cipla Direct","Shelf B-2",now),
            med("MED-003","Metformin 500mg","Metformin","Tablet / Capsule","Lupin","BATCH-2026-M01","2028-03-31",350,40,"Strips",4.0,22.0,"MedLine Distributors","Shelf A-3",now),
            med("MED-004","Azithromycin 500mg","Azithromycin","Antibiotic","Abbott","BATCH-2026-AZ01","2027-09-30",150,20,"Strips",30.0,120.0,"Abbott Distributors","Shelf B-1",now),
            med("MED-005","Atorvastatin 10mg","Atorvastatin","Tablet / Capsule","Torrent","BATCH-2026-AT01","2028-01-31",280,30,"Strips",5.0,28.0,"Torrent Direct","Shelf A-2",now),
            med("MED-006","Pantoprazole 40mg","Pantoprazole","Tablet / Capsule","Zydus","BATCH-2026-PAN01","2027-11-30",300,40,"Strips",6.0,32.0,"MedLine Distributors","Shelf A-4",now),
            med("MED-007","Cetirizine 10mg","Cetirizine","Tablet / Capsule","Sun Pharma","BATCH-2026-C01","2028-08-31",400,50,"Strips",3.0,18.0,"MedLine Distributors","Shelf A-5",now),
            med("MED-008","Normal Saline 500ml","Sodium Chloride","IV Fluid","Baxter","BATCH-2026-NS01","2027-06-30",80,15,"Bottles",45.0,180.0,"Baxter Healthcare","Shelf C-1",now),
            med("MED-009","Dextrose 5% 500ml","Dextrose","IV Fluid","Fresenius","BATCH-2026-D01","2027-08-31",60,15,"Bottles",55.0,210.0,"Fresenius Kabi","Shelf C-2",now),
            med("MED-010","Omeprazole 20mg","Omeprazole","Tablet / Capsule","Cipla","BATCH-2026-O01","2028-04-30",320,40,"Strips",5.5,26.0,"Cipla Direct","Shelf A-6",now)
        ));

        log.info("Seed complete: patients(5), doctors(4), appointments(2), queue(4), nurses(3), staffs(4), rooms(9), payroll(4), shifts(4), pharmacy(10)");
    }

    private String ts() { return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")); }

    private Patient patient(String id,String phone,String fullName,String dob,String gender,
            String address,String ecName,String ecPhone,String bloodGroup,List<String> allergies,
            String conditions,String referringDoctor,String lastVisit,String createdAt) {
        Patient p=new Patient(); p.setId(id); p.setPhone(phone); p.setFullName(fullName);
        p.setDob(dob); p.setGender(gender); p.setAddress(address);
        p.setEmergencyContactName(ecName); p.setEmergencyContactPhone(ecPhone);
        p.setBloodGroup(bloodGroup); p.setAllergies(allergies); p.setConditions(conditions);
        p.setReferringDoctor(referringDoctor); p.setLastVisit(lastVisit); p.setCreatedAt(createdAt);
        return p;
    }
    private Doctor doctor(String id,String name,String department,String qualification,
            String contact,String email,List<String> availableDays,String timeSlot,
            Double fee,String status,String createdAt) {
        Doctor d=new Doctor(); d.setId(id); d.setName(name); d.setDepartment(department);
        d.setQualification(qualification); d.setContact(contact); d.setEmail(email);
        d.setAvailableDays(availableDays); d.setTimeSlot(timeSlot); d.setFee(fee);
        d.setStatus(status); d.setCreatedAt(createdAt); return d;
    }
    private Appointment appt(String id,String patientId,String patientName,String doctorId,
            String doctorName,String department,String date,String timeSlot,String reason,
            String token,String status,String createdAt) {
        Appointment a=new Appointment(); a.setId(id); a.setPatientId(patientId);
        a.setPatientName(patientName); a.setDoctorId(doctorId); a.setDoctorName(doctorName);
        a.setDepartment(department); a.setDate(date); a.setTimeSlot(timeSlot);
        a.setReason(reason); a.setToken(token); a.setStatus(status); a.setCreatedAt(createdAt);
        return a;
    }
    private NurseQueue queue(String token,String patientId,String patientName,String gender,
            int age,String doctorName,String status,String bp,String pulse,String temp,
            String weight,String height,String bmi,String spo2,String rbs,
            String chiefComplaint,String nurseNotes,boolean sentToDoctor,String createdAt) {
        NurseQueue q=new NurseQueue(); q.setToken(token); q.setPatientId(patientId);
        q.setPatientName(patientName); q.setGender(gender); q.setAge(age);
        q.setDoctorName(doctorName); q.setStatus(status); q.setBp(bp); q.setPulse(pulse);
        q.setTemp(temp); q.setWeight(weight); q.setHeight(height); q.setBmi(bmi);
        q.setSpo2(spo2); q.setRbs(rbs); q.setChiefComplaint(chiefComplaint);
        q.setNurseNotes(nurseNotes); q.setSentToDoctor(sentToDoctor); q.setCreatedAt(createdAt);
        return q;
    }
    private Nurse nurse(String id,String name,String employeeId,String department,
            String qualification,String contact,String email,String shift,
            List<String> availableDays,String licenseNumber,String experience,
            String status,String joiningDate,String createdAt) {
        Nurse n=new Nurse(); n.setId(id); n.setName(name); n.setEmployeeId(employeeId);
        n.setDepartment(department); n.setQualification(qualification); n.setContact(contact);
        n.setEmail(email); n.setShift(shift); n.setAvailableDays(availableDays);
        n.setLicenseNumber(licenseNumber); n.setExperience(experience); n.setStatus(status);
        n.setJoiningDate(joiningDate); n.setCreatedAt(createdAt); return n;
    }
    private Staff staff(String id,String name,String role,String department,String contact,
            String email,String employeeId,String shift,String joiningDate,String status,
            Double salary,String createdAt) {
        Staff s=new Staff(); s.setId(id); s.setName(name); s.setRole(role);
        s.setDepartment(department); s.setContact(contact); s.setEmail(email);
        s.setEmployeeId(employeeId); s.setShift(shift); s.setJoiningDate(joiningDate);
        s.setStatus(status); s.setSalary(salary); s.setCreatedAt(createdAt); return s;
    }
    private Room room(String id,String roomNo,String bedNo,String type,String ward,
            String block,String floor,Double price,String status) {
        Room r=new Room(); r.setId(id); r.setRoomNo(roomNo); r.setBedNo(bedNo);
        r.setType(type); r.setWard(ward); r.setBlock(block); r.setFloor(floor);
        r.setPrice(price); r.setStatus(status); return r;
    }
    private Payroll payroll(String id,String employeeId,String employeeName,String role,
            String department,Double basicSalary,Double allowances,Double deductions,
            Double netSalary,String month,String year,String status,String paidDate,String createdAt) {
        Payroll p=new Payroll(); p.setId(id); p.setEmployeeId(employeeId);
        p.setEmployeeName(employeeName); p.setRole(role); p.setDepartment(department);
        p.setBasicSalary(basicSalary); p.setAllowances(allowances); p.setDeductions(deductions);
        p.setNetSalary(netSalary); p.setMonth(month); p.setYear(year);
        p.setStatus(status); p.setPaidDate(paidDate); p.setCreatedAt(createdAt); return p;
    }
    private Shift shift(String id,String employeeId,String employeeName,String role,
            String shiftType,String startTime,String endTime,String date,Double hoursWorked,
            String status,String notes,String createdAt) {
        Shift s=new Shift(); s.setId(id); s.setEmployeeId(employeeId);
        s.setEmployeeName(employeeName); s.setRole(role); s.setShiftType(shiftType);
        s.setStartTime(startTime); s.setEndTime(endTime); s.setDate(date);
        s.setHoursWorked(hoursWorked); s.setStatus(status); s.setNotes(notes);
        s.setCreatedAt(createdAt); return s;
    }
    private PharmacyInventory med(String id,String name,String generic,String category,
            String manufacturer,String batchNumber,String expiryDate,int stock,int minThreshold,
            String unit,Double costPrice,Double sellingPrice,String supplier,String location,String createdAt) {
        PharmacyInventory m=new PharmacyInventory(); m.setId(id); m.setName(name);
        m.setGeneric(generic); m.setCategory(category); m.setManufacturer(manufacturer);
        m.setBatchNumber(batchNumber); m.setExpiryDate(expiryDate); m.setStock(stock);
        m.setMinThreshold(minThreshold); m.setUnit(unit); m.setCostPrice(costPrice);
        m.setSellingPrice(sellingPrice); m.setSupplier(supplier); m.setLocation(location);
        m.setCreatedAt(createdAt); return m;
    }

    private void seedConsultationsIfEmpty() {
        if (consultationRepo.count() > 0) return;
        log.info("Seeding initial consultations...");
        String now = ts();

        Consultation c1 = new Consultation();
        c1.setId("CONS-991");
        c1.setPatientId("P-882019");
        c1.setPatientName("Priya Sharma");
        c1.setDoctorName("Dr. Arjun Mehta");
        c1.setDepartment("Cardiology");
        c1.setDiagnosis("Hypertension Stage 1 with Mild Angina");
        c1.setLabTests(List.of("Lipid Profile", "12-Lead ECG"));
        c1.setPrescriptions(List.of(
            Map.of("medicine", "Amlodipine 5mg", "dosage", "1 Tab", "frequency", "1-0-0", "duration", "30 Days"),
            Map.of("medicine", "Atorvastatin 10mg", "dosage", "1 Tab", "frequency", "0-0-1", "duration", "30 Days")
        ));
        c1.setStatus("Completed");
        c1.setCreatedAt(now);

        Consultation c2 = new Consultation();
        c2.setId("CONS-992");
        c2.setPatientId("P-112234");
        c2.setPatientName("Sunita Kumar");
        c2.setDoctorName("Dr. Kavitha Reddy");
        c2.setDepartment("General Medicine");
        c2.setDiagnosis("Acute Bronchial Asthma Exacerbation");
        c2.setLabTests(List.of("Chest X-Ray PA View", "Complete Blood Count (CBC)"));
        c2.setPrescriptions(List.of(
            Map.of("medicine", "Azithromycin 500mg", "dosage", "1 Tab", "frequency", "1-0-0", "duration", "5 Days"),
            Map.of("medicine", "Cetirizine 10mg", "dosage", "1 Tab", "frequency", "0-0-1", "duration", "7 Days")
        ));
        c2.setStatus("Completed");
        c2.setCreatedAt(now);

        Consultation c3 = new Consultation();
        c3.setId("CONS-993");
        c3.setPatientId("P-776655");
        c3.setPatientName("Mohan Lal Gupta");
        c3.setDoctorName("Dr. Sanjay Patel");
        c3.setDepartment("General Medicine");
        c3.setDiagnosis("Type 2 Diabetes Mellitus Uncontrolled");
        c3.setLabTests(List.of("HbA1c Glycated Hemoglobin", "Fasting Blood Sugar"));
        c3.setPrescriptions(List.of(
            Map.of("medicine", "Metformin 500mg", "dosage", "1 Tab", "frequency", "1-0-1", "duration", "30 Days")
        ));
        c3.setStatus("Active");
        c3.setCreatedAt(now);

        consultationRepo.saveAll(List.of(c1, c2, c3));
        log.info("Seeded 3 consultations successfully.");
    }

    private void seedIpPatientsIfEmpty() {
        if (ipPatientRepo.count() > 0) return;
        log.info("Seeding initial admitted IP patients...");
        String now = ts();
        String threeDaysAgo = java.time.LocalDate.now().minusDays(3).format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"));
        String twoDaysAgo = java.time.LocalDate.now().minusDays(2).format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"));
        String oneDayAgo = java.time.LocalDate.now().minusDays(1).format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"));

        IpPatient ip1 = new IpPatient();
        ip1.setId("IP-101");
        ip1.setPatientId("P-882019");
        ip1.setPatientName("Priya Sharma");
        ip1.setAge("39");
        ip1.setGender("Female");
        ip1.setDepartment("Cardiology");
        ip1.setDoctorName("Dr. Arjun Mehta");
        ip1.setAdmittingDoctor("Dr. Arjun Mehta");
        ip1.setAdmissionDate(threeDaysAgo + ", 10:30 AM");
        ip1.setStatus("Admitted");
        ip1.setAllocatedRoomId("RM-201");
        ip1.setAllocatedRoomNo("201-A");
        ip1.setAllocatedRoomType("Semi-Private");
        ip1.setAllocatedBlock("Block B");
        ip1.setAllocatedFloor("Floor 2");
        ip1.setAllocatedRoomPrice("₹ 2,500 / day");
        ip1.setAdmittingDiagnosis("Hypertensive Crisis with Tachycardia");
        ip1.setCareLevel("Stepdown Care");
        ip1.setWard("Cardiology Semi-Private");

        IpPatient ip2 = new IpPatient();
        ip2.setId("IP-102");
        ip2.setPatientId("P-112233");
        ip2.setPatientName("Rajesh Kumar");
        ip2.setAge("43");
        ip2.setGender("Male");
        ip2.setDepartment("Cardiology");
        ip2.setDoctorName("Dr. Arjun Mehta");
        ip2.setAdmittingDoctor("Dr. Arjun Mehta");
        ip2.setAdmissionDate(twoDaysAgo + ", 08:15 AM");
        ip2.setStatus("Admitted");
        ip2.setAllocatedRoomId("RM-ICU1");
        ip2.setAllocatedRoomNo("ICU-01-A");
        ip2.setAllocatedRoomType("ICU");
        ip2.setAllocatedBlock("Block D");
        ip2.setAllocatedFloor("Floor 1");
        ip2.setAllocatedRoomPrice("₹ 8,000 / day");
        ip2.setAdmittingDiagnosis("Acute Coronary Syndrome & Unstable Angina");
        ip2.setCareLevel("Intensive Care");
        ip2.setWard("Intensive Cardiac Care Unit (ICCU)");

        IpPatient ip3 = new IpPatient();
        ip3.setId("IP-103");
        ip3.setPatientId("P-776655");
        ip3.setPatientName("Mohan Lal Gupta");
        ip3.setAge("44");
        ip3.setGender("Male");
        ip3.setDepartment("General Medicine");
        ip3.setDoctorName("Dr. Kavitha Reddy");
        ip3.setAdmittingDoctor("Dr. Kavitha Reddy");
        ip3.setAdmissionDate(oneDayAgo + ", 11:00 AM");
        ip3.setStatus("Admitted");
        ip3.setAllocatedRoomId("RM-101");
        ip3.setAllocatedRoomNo("101-A");
        ip3.setAllocatedRoomType("General Ward");
        ip3.setAllocatedBlock("Block A");
        ip3.setAllocatedFloor("Floor 1");
        ip3.setAllocatedRoomPrice("₹ 1,200 / day");
        ip3.setAdmittingDiagnosis("Severe Dehydration & Glycemic Instability");
        ip3.setCareLevel("General");
        ip3.setWard("General Medical Ward");

        ipPatientRepo.saveAll(List.of(ip1, ip2, ip3));
        log.info("Seeded 3 admitted IP patients successfully.");
    }

    private void seedPharmacyBillsIfEmpty() {
        if (pharmacyBillRepo.count() > 0) return;
        log.info("Seeding initial inpatient & outpatient pharmacy bills...");
        String now = ts();
        String twoDaysAgo = java.time.LocalDate.now().minusDays(2).toString();
        String oneDayAgo = java.time.LocalDate.now().minusDays(1).toString();

        PharmacyBill b1 = new PharmacyBill();
        b1.setId("PH-IP-001");
        b1.setPatientId("P-882019");
        b1.setPatientName("Priya Sharma");
        b1.setDate(twoDaysAgo);
        b1.setItemsCount(3);
        b1.setSubtotal(1250.0);
        b1.setGst(62.5);
        b1.setDiscount(0.0);
        b1.setTotal(1312.5);
        b1.setStatus("Pending");
        b1.setItems(List.of(
            Map.of("name", "Normal Saline 500ml IV", "qty", 2, "price", 180.0),
            Map.of("name", "Pantoprazole 40mg IV", "qty", 3, "price", 95.0),
            Map.of("name", "Atorvastatin 10mg", "qty", 10, "price", 28.0)
        ));
        b1.setCreatedAt(now);

        PharmacyBill b2 = new PharmacyBill();
        b2.setId("PH-IP-002");
        b2.setPatientId("P-112233");
        b2.setPatientName("Rajesh Kumar");
        b2.setDate(oneDayAgo);
        b2.setItemsCount(3);
        b2.setSubtotal(2150.0);
        b2.setGst(107.5);
        b2.setDiscount(0.0);
        b2.setTotal(2257.5);
        b2.setStatus("Pending");
        b2.setItems(List.of(
            Map.of("name", "Dextrose 5% 500ml", "qty", 3, "price", 210.0),
            Map.of("name", "Azithromycin 500mg", "qty", 5, "price", 120.0),
            Map.of("name", "Amoxicillin 250mg", "qty", 10, "price", 80.0)
        ));
        b2.setCreatedAt(now);

        PharmacyBill b3 = new PharmacyBill();
        b3.setId("PH-OP-001");
        b3.setPatientId("P-112234");
        b3.setPatientName("Sunita Kumar");
        b3.setDate(java.time.LocalDate.now().toString());
        b3.setItemsCount(2);
        b3.setSubtotal(380.0);
        b3.setGst(19.0);
        b3.setDiscount(0.0);
        b3.setTotal(399.0);
        b3.setStatus("Pending");
        b3.setItems(List.of(
            Map.of("name", "Paracetamol 500mg", "qty", 2, "price", 15.0),
            Map.of("name", "Cetirizine 10mg", "qty", 1, "price", 18.0)
        ));
        b3.setCreatedAt(now);

        pharmacyBillRepo.saveAll(List.of(b1, b2, b3));
        log.info("Seeded 3 pharmacy bills successfully.");
    }
}