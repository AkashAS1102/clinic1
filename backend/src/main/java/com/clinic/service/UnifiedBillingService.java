package com.clinic.service;

import com.clinic.model.*;
import com.clinic.repository.*;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class UnifiedBillingService {

    private final UnifiedBillRepository unifiedBillRepo;
    private final AppointmentRepository appointmentRepo;
    private final DoctorRepository doctorRepo;
    private final PharmacyBillRepository pharmacyBillRepo;
    private final IpPatientRepository ipPatientRepo;
    private final PatientRepository patientRepo;
    private final ConsultationRepository consultationRepo;
    private final RoomRepository roomRepo;

    public UnifiedBillingService(
            UnifiedBillRepository unifiedBillRepo,
            AppointmentRepository appointmentRepo,
            DoctorRepository doctorRepo,
            PharmacyBillRepository pharmacyBillRepo,
            IpPatientRepository ipPatientRepo,
            PatientRepository patientRepo,
            ConsultationRepository consultationRepo,
            RoomRepository roomRepo) {
        this.unifiedBillRepo = unifiedBillRepo;
        this.appointmentRepo = appointmentRepo;
        this.doctorRepo = doctorRepo;
        this.pharmacyBillRepo = pharmacyBillRepo;
        this.ipPatientRepo = ipPatientRepo;
        this.patientRepo = patientRepo;
        this.consultationRepo = consultationRepo;
        this.roomRepo = roomRepo;
    }

    public static class UnifiedBillDTO {
        public String id;
        public String sourceType;
        public String sourceId;
        public String patientId;
        public String patientName;
        public String doctorName;
        public String department;
        public String date;
        public Double totalAmount = 0.0;
        public Double subtotal = 0.0;
        public Double gst = 0.0;
        public Double discount = 0.0;
        public String paymentMethod;
        public String status = "Pending";
        public String paidAt;
        public String notes;
        public String createdAt;

        public String timeSlot;
        public String reason;
        public String gender;
        public String dob;
        public String billNo;
        public String payStatus;
        public String phone;
        public List<Map<String, Object>> lineItems = new ArrayList<>();
    }

    public List<UnifiedBillDTO> getAllUnifiedBills() {
        List<UnifiedBillDTO> allBills = new ArrayList<>();
        Set<String> processedConsultationKeys = new HashSet<>();

        // Cache doctors for fast tariff lookup
        List<Doctor> allDoctors = doctorRepo.findAll();
        Map<String, Doctor> doctorByName = new HashMap<>();
        Map<String, Doctor> doctorById = new HashMap<>();
        for (Doctor d : allDoctors) {
            if (d.getId() != null) doctorById.put(d.getId(), d);
            if (d.getName() != null) doctorByName.put(d.getName().toLowerCase().replace("dr.", "").trim(), d);
        }

        // 1. EMR Consultations (Consultations completed or conducted by doctors)
        List<Consultation> consultations = consultationRepo.findAll();
        for (Consultation c : consultations) {
            if (c.getId() == null) continue;
            String billId = c.getId().startsWith("CONS-") ? c.getId() : ("CONS-" + c.getId());
            processedConsultationKeys.add(c.getId());
            if (c.getToken() != null) processedConsultationKeys.add(c.getToken());

            UnifiedBillDTO dto = new UnifiedBillDTO();
            dto.billNo = billId;
            dto.sourceId = billId;
            dto.sourceType = "consultation";
            dto.patientId = c.getPatientId();
            dto.patientName = c.getPatientName();
            dto.doctorName = c.getDoctorName() != null ? c.getDoctorName() : "Doctor";
            dto.department = c.getDepartment() != null ? c.getDepartment() : "General Medicine";
            dto.date = c.getCreatedAt() != null ? c.getCreatedAt().split(" ")[0].split("T")[0] : LocalDate.now().toString();
            dto.reason = (c.getDiagnosis() != null && !c.getDiagnosis().isBlank()) ? c.getDiagnosis() : "Clinical Consultation";

            Double docFee = 500.0;
            String cleanDocName = dto.doctorName.toLowerCase().replace("dr.", "").trim();
            if (doctorByName.containsKey(cleanDocName) && doctorByName.get(cleanDocName).getFee() != null) {
                docFee = doctorByName.get(cleanDocName).getFee();
            }

            if (c.getPatientId() != null) {
                Optional<Patient> pOpt = patientRepo.findById(c.getPatientId());
                if (pOpt.isPresent()) {
                    dto.gender = pOpt.get().getGender();
                    dto.dob = pOpt.get().getDob();
                    dto.phone = pOpt.get().getPhone();
                }
            }

            Double subtotal = docFee;
            Map<String, Object> consultItem = new HashMap<>();
            consultItem.put("label", "Doctor Consultation Fee - " + dto.doctorName);
            consultItem.put("qty", 1);
            consultItem.put("amount", docFee);
            dto.lineItems.add(consultItem);

            // Add any diagnostic lab orders from this consultation
            if (c.getLabTests() != null && !c.getLabTests().isEmpty()) {
                for (String lab : c.getLabTests()) {
                    if (lab != null && !lab.isBlank()) {
                        Double labRate = 350.0;
                        subtotal += labRate;
                        Map<String, Object> labItem = new HashMap<>();
                        labItem.put("label", "Laboratory Investigation: " + lab);
                        labItem.put("qty", 1);
                        labItem.put("amount", labRate);
                        dto.lineItems.add(labItem);
                    }
                }
            }

            dto.subtotal = subtotal;
            dto.totalAmount = subtotal;

            Optional<UnifiedBill> ubOpt = unifiedBillRepo.findBySourceId(dto.billNo);
            if (ubOpt.isPresent()) {
                dto.payStatus = ubOpt.get().getStatus();
                mapUnifiedBillToDTO(ubOpt.get(), dto);
            } else {
                dto.payStatus = "Pending";
            }

            allBills.add(dto);
        }

        // 2. Appointment-based Consultations
        List<Appointment> appointments = appointmentRepo.findAll();
        for (Appointment apt : appointments) {
            String apptKey = apt.getId();
            String tokenKey = apt.getToken();
            if (processedConsultationKeys.contains(apptKey) || (tokenKey != null && processedConsultationKeys.contains(tokenKey))) {
                continue; // Already included via EMR consultation
            }

            UnifiedBillDTO dto = new UnifiedBillDTO();
            dto.billNo = "CONS-" + apt.getId();
            dto.sourceId = dto.billNo;
            dto.sourceType = "consultation";
            dto.patientId = apt.getPatientId();
            dto.patientName = apt.getPatientName();
            dto.doctorName = apt.getDoctorName();
            dto.department = apt.getDepartment();
            dto.date = apt.getDate();
            dto.timeSlot = apt.getTimeSlot();
            dto.reason = apt.getReason() != null ? apt.getReason() : "Appointment Consultation";

            Double fee = 500.0;
            if (apt.getDoctorId() != null && doctorById.containsKey(apt.getDoctorId())) {
                Double docTariff = doctorById.get(apt.getDoctorId()).getFee();
                if (docTariff != null) fee = docTariff;
            } else if (apt.getDoctorName() != null) {
                String cleanDocName = apt.getDoctorName().toLowerCase().replace("dr.", "").trim();
                if (doctorByName.containsKey(cleanDocName) && doctorByName.get(cleanDocName).getFee() != null) {
                    fee = doctorByName.get(cleanDocName).getFee();
                }
            }

            dto.totalAmount = fee;
            dto.subtotal = fee;

            if (apt.getPatientId() != null) {
                Optional<Patient> pOpt = patientRepo.findById(apt.getPatientId());
                if (pOpt.isPresent()) {
                    dto.gender = pOpt.get().getGender();
                    dto.dob = pOpt.get().getDob();
                    dto.phone = pOpt.get().getPhone();
                }
            }

            Optional<UnifiedBill> ubOpt = unifiedBillRepo.findBySourceId(dto.billNo);
            if (ubOpt.isPresent()) {
                dto.payStatus = ubOpt.get().getStatus();
                mapUnifiedBillToDTO(ubOpt.get(), dto);
            } else {
                dto.payStatus = "Pending";
            }

            Map<String, Object> lineItem = new HashMap<>();
            lineItem.put("label", "Consultation Fee - " + dto.doctorName);
            lineItem.put("qty", 1);
            lineItem.put("amount", fee);
            dto.lineItems.add(lineItem);

            allBills.add(dto);
        }

        // 3. Pharmacy Outpatient Dispensations
        List<PharmacyBill> pharmacyBills = pharmacyBillRepo.findAll();
        for (PharmacyBill pb : pharmacyBills) {
            UnifiedBillDTO dto = new UnifiedBillDTO();
            dto.billNo = "PHARM-" + pb.getId();
            dto.sourceId = dto.billNo;
            dto.sourceType = "pharmacy";
            dto.patientId = pb.getPatientId();
            dto.patientName = pb.getPatientName();
            dto.date = pb.getDate();
            dto.totalAmount = pb.getTotal() != null ? pb.getTotal() : 0.0;
            dto.subtotal = pb.getSubtotal() != null ? pb.getSubtotal() : dto.totalAmount;
            dto.gst = pb.getGst() != null ? pb.getGst() : 0.0;
            dto.discount = pb.getDiscount() != null ? pb.getDiscount() : 0.0;

            if (pb.getPatientId() != null) {
                Optional<Patient> pOpt = patientRepo.findById(pb.getPatientId());
                if (pOpt.isPresent()) {
                    dto.gender = pOpt.get().getGender();
                    dto.dob = pOpt.get().getDob();
                    dto.phone = pOpt.get().getPhone();
                }
            }

            Optional<UnifiedBill> ubOpt = unifiedBillRepo.findBySourceId(dto.billNo);
            if (ubOpt.isPresent()) {
                dto.payStatus = ubOpt.get().getStatus();
                mapUnifiedBillToDTO(ubOpt.get(), dto);
            } else {
                dto.payStatus = pb.getStatus() != null ? pb.getStatus() : "Pending";
            }

            Map<String, Object> lineItem = new HashMap<>();
            lineItem.put("label", (pb.getItemsCount() != null && pb.getItemsCount() > 0 ? pb.getItemsCount() : 1) + " Dispensed Medication(s)");
            lineItem.put("qty", pb.getItemsCount() != null && pb.getItemsCount() > 0 ? pb.getItemsCount() : 1);
            lineItem.put("amount", pb.getTotal() != null ? pb.getTotal() : 0.0);
            dto.lineItems.add(lineItem);

            allBills.add(dto);
        }

        // 4. Inpatient / Admitted Patients (Room Charges + Nursing + Doctor Rounds + Inpatient Medicines)
        List<IpPatient> ipPatients = ipPatientRepo.findAll();
        for (IpPatient ip : ipPatients) {
            boolean isAdmitted = (ip.getAllocatedRoomId() != null && !ip.getAllocatedRoomId().isBlank())
                    || (ip.getAllocatedRoomNo() != null && !ip.getAllocatedRoomNo().isBlank())
                    || (ip.getStatus() != null && (ip.getStatus().equalsIgnoreCase("Admitted") || ip.getStatus().equalsIgnoreCase("Occupied") || ip.getStatus().equalsIgnoreCase("Active") || ip.getStatus().equalsIgnoreCase("Discharged")))
                    || (ip.getWard() != null && !ip.getWard().isBlank());
            if (!isAdmitted) continue;

            UnifiedBillDTO dto = new UnifiedBillDTO();
            dto.billNo = "IPRM-" + ip.getId();
            dto.sourceId = dto.billNo;
            dto.sourceType = "ip_room";
            dto.patientId = ip.getPatientId();
            dto.patientName = ip.getPatientName();
            dto.doctorName = (ip.getDoctorName() != null && !ip.getDoctorName().isBlank())
                    ? ip.getDoctorName()
                    : (ip.getAdmittingDoctor() != null ? ip.getAdmittingDoctor() : "Attending Physician");
            dto.department = ip.getDepartment() != null ? ip.getDepartment() : "Inpatient Care";
            dto.date = ip.getAdmissionDate() != null ? ip.getAdmissionDate().split(",")[0].trim() : LocalDate.now().toString();
            dto.reason = (ip.getAdmittingDiagnosis() != null && !ip.getAdmittingDiagnosis().isBlank())
                    ? ip.getAdmittingDiagnosis()
                    : (ip.getDiagnosis() != null ? ip.getDiagnosis() : "Inpatient Care & Stay");

            if (ip.getPatientId() != null) {
                Optional<Patient> pOpt = patientRepo.findById(ip.getPatientId());
                if (pOpt.isPresent()) {
                    dto.gender = pOpt.get().getGender();
                    dto.dob = pOpt.get().getDob();
                    dto.phone = pOpt.get().getPhone();
                } else {
                    dto.gender = ip.getGender();
                }
            } else {
                dto.gender = ip.getGender();
            }

            // A. Room Tariff calculation
            Double tariff = 0.0;
            if (ip.getAllocatedRoomPrice() != null) {
                Pattern p = Pattern.compile("(\\d+(?:,\\d+)*)");
                Matcher m = p.matcher(ip.getAllocatedRoomPrice());
                if (m.find()) {
                    tariff = Double.parseDouble(m.group(1).replace(",", ""));
                }
            }
            if (tariff <= 0 && ip.getAllocatedRoomId() != null) {
                Optional<Room> rmOpt = roomRepo.findById(ip.getAllocatedRoomId());
                if (rmOpt.isPresent() && rmOpt.get().getPrice() != null) {
                    tariff = rmOpt.get().getPrice();
                }
            }
            if (tariff <= 0) {
                String rType = (ip.getAllocatedRoomType() != null ? ip.getAllocatedRoomType() : (ip.getBedType() != null ? ip.getBedType() : "")).toLowerCase();
                if (rType.contains("icu")) tariff = 8000.0;
                else if (rType.contains("private") || rType.contains("suite")) tariff = 5000.0;
                else if (rType.contains("semi")) tariff = 2500.0;
                else tariff = 1200.0;
            }

            // B. Stay Duration
            long days = 1;
            if (ip.getAdmissionDate() != null) {
                String rawDate = ip.getAdmissionDate().split(",")[0].trim();
                LocalDate admissionDate = null;
                DateTimeFormatter[] formatters = {
                        DateTimeFormatter.ISO_LOCAL_DATE,
                        DateTimeFormatter.ofPattern("dd MMM yyyy"),
                        DateTimeFormatter.ofPattern("d MMM yyyy"),
                        DateTimeFormatter.ofPattern("yyyy-MM-dd")
                };
                for (DateTimeFormatter f : formatters) {
                    try {
                        admissionDate = LocalDate.parse(rawDate, f);
                        break;
                    } catch (DateTimeParseException ignored) {}
                }
                if (admissionDate != null) {
                    days = ChronoUnit.DAYS.between(admissionDate, LocalDate.now());
                    if (days <= 0) days = 1;
                }
            }

            Double roomTotal = tariff * days;
            String roomDesc = (ip.getAllocatedRoomNo() != null ? ip.getAllocatedRoomNo() : "Ward Bed")
                    + " (" + (ip.getAllocatedRoomType() != null ? ip.getAllocatedRoomType() : "Standard") + ")";
            Map<String, Object> roomItem = new HashMap<>();
            roomItem.put("label", "Room & Bed Rent: " + roomDesc + " (" + days + " days)");
            roomItem.put("qty", days);
            roomItem.put("amount", roomTotal);
            dto.lineItems.add(roomItem);

            // C. Inpatient Nursing & Clinical Care
            Double nursingRate = 500.0;
            Double nursingTotal = nursingRate * days;
            Map<String, Object> nursingItem = new HashMap<>();
            nursingItem.put("label", "Inpatient Nursing & Vital Monitoring (" + days + " days @ Rs. 500/day)");
            nursingItem.put("qty", days);
            nursingItem.put("amount", nursingTotal);
            dto.lineItems.add(nursingItem);

            // D. Doctor Inpatient Rounds & Care
            Double roundRate = 600.0;
            Double roundTotal = roundRate * days;
            Map<String, Object> doctorItem = new HashMap<>();
            doctorItem.put("label", "Attending Physician Daily Rounds - " + dto.doctorName + " (" + days + " visits @ Rs. 600/day)");
            doctorItem.put("qty", days);
            doctorItem.put("amount", roundTotal);
            dto.lineItems.add(doctorItem);

            // E. Inpatient Medicines Administered During Admission
            Double medicineTotal = 0.0;
            boolean hadSpecificMeds = false;

            // 1. Check pharmacy bills for this patient
            if (ip.getPatientId() != null) {
                List<PharmacyBill> patientPharmBills = pharmacyBillRepo.findAll().stream()
                        .filter(pb -> ip.getPatientId().equals(pb.getPatientId()))
                        .toList();
                for (PharmacyBill pb : patientPharmBills) {
                    Double bTot = pb.getTotal() != null ? pb.getTotal() : 0.0;
                    if (bTot > 0) {
                        medicineTotal += bTot;
                        hadSpecificMeds = true;
                        Map<String, Object> medItem = new HashMap<>();
                        medItem.put("label", "Inpatient Pharmacy Dispensation (#" + pb.getId() + ") - " + (pb.getItemsCount() > 0 ? pb.getItemsCount() : 1) + " Meds");
                        medItem.put("qty", pb.getItemsCount() > 0 ? pb.getItemsCount() : 1);
                        medItem.put("amount", bTot);
                        dto.lineItems.add(medItem);
                    }
                }
            }

            // 2. Check prescriptions from consultations for this patient
            if (ip.getPatientId() != null) {
                List<Consultation> patientConsults = consultationRepo.findAll().stream()
                        .filter(c -> ip.getPatientId().equals(c.getPatientId()))
                        .toList();
                for (Consultation c : patientConsults) {
                    List<Object> rxList = c.getPrescriptions();
                    if (rxList != null) {
                        for (Object rxObj : rxList) {
                            if (rxObj instanceof Map<?,?> rxMap) {
                                String medName = (String) rxMap.get("medicine");
                                if (medName != null && !medName.isBlank()) {
                                    Double medPrice = 140.0;
                                    medicineTotal += medPrice;
                                    hadSpecificMeds = true;
                                    Map<String, Object> rxItem = new HashMap<>();
                                    rxItem.put("label", "Administered Medicine: " + medName);
                                    rxItem.put("qty", 1);
                                    rxItem.put("amount", medPrice);
                                    dto.lineItems.add(rxItem);
                                }
                            }
                        }
                    }
                }
            }

            // 3. Fallback: Standard Inpatient Medication & IV Infusion Package
            if (!hadSpecificMeds) {
                Double routineMeds = 850.0 * days;
                medicineTotal += routineMeds;
                Map<String, Object> packageMeds = new HashMap<>();
                packageMeds.put("label", "Inpatient Medications & IV Infusions (" + days + " days @ Rs. 850/day)");
                packageMeds.put("qty", days);
                packageMeds.put("amount", routineMeds);
                dto.lineItems.add(packageMeds);
            }

            Double subtotal = roomTotal + nursingTotal + roundTotal + medicineTotal;
            Double gst = Math.round(medicineTotal * 0.05 * 100.0) / 100.0; // 5% GST on medicines
            Double totalAmount = subtotal + gst;

            dto.subtotal = subtotal;
            dto.gst = gst;
            dto.discount = 0.0;
            dto.totalAmount = totalAmount;

            Optional<UnifiedBill> ubOpt = unifiedBillRepo.findBySourceId(dto.billNo);
            if (ubOpt.isPresent()) {
                dto.payStatus = ubOpt.get().getStatus();
                mapUnifiedBillToDTO(ubOpt.get(), dto);
            } else {
                dto.payStatus = "Pending";
            }

            allBills.add(dto);
        }

        return allBills;
    }

    public UnifiedBillDTO getUnifiedBillBySourceId(String sourceId) {
        if (sourceId == null) return null;
        String cleanId = sourceId.startsWith("CONS-CONS-") ? sourceId.substring(5) : sourceId;
        return getAllUnifiedBills().stream()
                .filter(b -> cleanId.equalsIgnoreCase(b.sourceId) 
                          || cleanId.equalsIgnoreCase(b.billNo) 
                          || sourceId.equalsIgnoreCase(b.sourceId) 
                          || sourceId.equalsIgnoreCase(b.billNo)
                          || (b.sourceId != null && b.sourceId.endsWith(cleanId)))
                .findFirst()
                .orElse(null);
    }

    private void mapUnifiedBillToDTO(UnifiedBill ub, UnifiedBillDTO dto) {
        dto.id = ub.getId();
        dto.status = ub.getStatus();
        dto.paymentMethod = ub.getPaymentMethod();
        dto.paidAt = ub.getPaidAt();
        dto.notes = ub.getNotes();
        dto.createdAt = ub.getCreatedAt();
        if (ub.getTotalAmount() != null) dto.totalAmount = ub.getTotalAmount();
        if (ub.getSubtotal() != null) dto.subtotal = ub.getSubtotal();
        if (ub.getGst() != null) dto.gst = ub.getGst();
        if (ub.getDiscount() != null) dto.discount = ub.getDiscount();
    }

    public UnifiedBill collectPayment(String sourceId, String paymentMethod) {
        Optional<UnifiedBill> opt = unifiedBillRepo.findBySourceId(sourceId);
        if (!opt.isPresent() && sourceId.startsWith("CONS-CONS-")) {
            opt = unifiedBillRepo.findBySourceId(sourceId.substring(5));
        }

        UnifiedBill bill;
        if (opt.isPresent()) {
            bill = opt.get();
        } else {
            bill = new UnifiedBill();
            bill.setId("UB-" + System.currentTimeMillis());
            bill.setSourceId(sourceId);
            if (sourceId.startsWith("CONS-")) bill.setSourceType("consultation");
            else if (sourceId.startsWith("PHARM-")) bill.setSourceType("pharmacy");
            else if (sourceId.startsWith("IPRM-")) bill.setSourceType("ip_room");
            bill.setCreatedAt(LocalDateTime.now().toString());
        }

        // Always sync latest totals and patient details from aggregator
        UnifiedBillDTO dto = getUnifiedBillBySourceId(sourceId);
        if (dto != null) {
            bill.setSourceId(dto.sourceId);
            bill.setSourceType(dto.sourceType);
            bill.setPatientId(dto.patientId);
            bill.setPatientName(dto.patientName);
            bill.setDoctorName(dto.doctorName);
            bill.setDepartment(dto.department);
            bill.setDate(dto.date);
            bill.setSubtotal(dto.subtotal);
            bill.setGst(dto.gst);
            bill.setDiscount(dto.discount);
            bill.setTotalAmount(dto.totalAmount);
        }

        bill.setStatus("Paid");
        bill.setPaymentMethod(paymentMethod);
        bill.setPaidAt(LocalDateTime.now().toString());

        // Domain-specific side effects upon settlement
        if (sourceId.startsWith("PHARM-")) {
            String pbId = sourceId.substring(6);
            pharmacyBillRepo.findById(pbId).ifPresent(pb -> {
                pb.setStatus("Paid");
                pb.setPaymentMethod(paymentMethod);
                pharmacyBillRepo.save(pb);
            });
        } else if (sourceId.startsWith("IPRM-")) {
            String ipId = sourceId.substring(5);
            ipPatientRepo.findById(ipId).ifPresent(ip -> {
                // Settle admission
                ip.setStatus("Discharged");
                ipPatientRepo.save(ip);
                // Also mark any patient pharmacy bills as settled
                if (ip.getPatientId() != null) {
                    List<PharmacyBill> bills = pharmacyBillRepo.findAll().stream()
                            .filter(pb -> ip.getPatientId().equals(pb.getPatientId()))
                            .toList();
                    for (PharmacyBill pb : bills) {
                        pb.setStatus("Paid");
                        pb.setPaymentMethod(paymentMethod);
                        pharmacyBillRepo.save(pb);
                    }
                }
            });
        } else if (sourceId.startsWith("CONS-")) {
            String rawId = sourceId.substring(5);
            appointmentRepo.findById(rawId).ifPresent(apt -> {
                apt.setStatus("Completed");
                appointmentRepo.save(apt);
            });
            consultationRepo.findById(rawId).ifPresent(c -> {
                c.setStatus("Completed");
                consultationRepo.save(c);
            });
        }

        return unifiedBillRepo.save(bill);
    }
}

