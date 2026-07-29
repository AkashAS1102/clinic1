package com.clinic.service;

import com.clinic.model.Appointment;
import com.clinic.model.NurseQueue;
import com.clinic.model.Patient;
import com.clinic.repository.AppointmentRepository;
import com.clinic.repository.NurseQueueRepository;
import com.clinic.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository apptRepo;
    private final NurseQueueRepository  queueRepo;
    private final PatientRepository     patientRepo;

    public AppointmentService(AppointmentRepository apptRepo,
                              NurseQueueRepository  queueRepo,
                              PatientRepository     patientRepo) {
        this.apptRepo    = apptRepo;
        this.queueRepo   = queueRepo;
        this.patientRepo = patientRepo;
    }

    public List<Appointment> findAll() {
        return apptRepo.findAllByOrderByCreatedAtDesc();
    }

    public Appointment create(Appointment req) {
        String id    = genAppointmentId();
        String token = genToken(req.getDoctorId(), req.getDate());

        req.setId(id);
        req.setToken(token);
        req.setCreatedAt(PatientService.now());
        if (req.getStatus() == null) req.setStatus("Scheduled");

        Appointment saved = apptRepo.save(req);

        // Auto-add to nurse queue if not already present
        if (!queueRepo.existsById(token)) {
            Patient patient = patientRepo.findById(req.getPatientId()).orElse(null);

            int    age    = 0;
            String gender = "O";
            if (patient != null) {
                if (patient.getDob() != null && !patient.getDob().isBlank()) {
                    try {
                        age = Period.between(LocalDate.parse(patient.getDob()), LocalDate.now()).getYears();
                    } catch (Exception ignored) { /* keep age=0 */ }
                }
                if ("Male".equalsIgnoreCase(patient.getGender()))        gender = "M";
                else if ("Female".equalsIgnoreCase(patient.getGender())) gender = "F";
            }

            NurseQueue entry = new NurseQueue();
            entry.setToken(token);
            entry.setPatientId(req.getPatientId());
            entry.setPatientName(req.getPatientName());
            entry.setGender(gender);
            entry.setAge(age);
            entry.setDoctorName(req.getDoctorName());
            entry.setStatus("Pending");
            entry.setSentToDoctor(false);
            entry.setCreatedAt(PatientService.now());
            queueRepo.save(entry);
        }

        return saved;
    }

    public Appointment update(String id, Appointment req) {
        Appointment e = apptRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));
        if (req.getStatus()   != null) e.setStatus(req.getStatus());
        if (req.getDate()     != null) e.setDate(req.getDate());
        if (req.getTimeSlot() != null) e.setTimeSlot(req.getTimeSlot());
        if (req.getReason()   != null) e.setReason(req.getReason());
        return apptRepo.save(e);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** APT-001, APT-002, … based on total count */
    private String genAppointmentId() {
        long count = apptRepo.count();
        return String.format("APT-%03d", count + 1);
    }

    /** Token = last char of doctorId (upper) + sequential number for that doctor+date */
    private String genToken(String doctorId, String date) {
        String prefix = (doctorId != null && !doctorId.isEmpty())
            ? String.valueOf(doctorId.charAt(doctorId.length() - 1)).toUpperCase()
            : "A";
        long count = apptRepo.countByDoctorIdAndDate(
            doctorId != null ? doctorId : "",
            date     != null ? date     : ""
        );
        return String.format("%s-%03d", prefix, count + 1);
    }
}
