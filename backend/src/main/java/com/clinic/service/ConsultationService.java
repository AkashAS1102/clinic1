package com.clinic.service;

import com.clinic.model.Consultation;
import com.clinic.repository.ConsultationRepository;
import com.clinic.repository.NurseQueueRepository;
import com.clinic.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.List;

@Service
public class ConsultationService {

    private final ConsultationRepository repo;
    private final NurseQueueRepository   queueRepo;
    private final PatientRepository      patientRepo;
    private final com.clinic.repository.AdmissionRepository admissionRepo;

    public ConsultationService(ConsultationRepository repo,
                               NurseQueueRepository   queueRepo,
                               PatientRepository      patientRepo,
                               com.clinic.repository.AdmissionRepository admissionRepo) {
        this.repo        = repo;
        this.queueRepo   = queueRepo;
        this.patientRepo = patientRepo;
        this.admissionRepo = admissionRepo;
    }

    public List<Consultation> findAll() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    public List<Consultation> findByPatient(String patientId) {
        return repo.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    public Consultation save(Consultation req) {
        if (req.getId() == null || req.getId().isBlank()) {
            req.setId("CON-" + System.currentTimeMillis());
        }
        req.setStatus("Active");
        req.setCreatedAt(PatientService.now());

        Consultation saved = repo.save(req);

        // Update patient's lastVisit date
        if (req.getPatientId() != null && !req.getPatientId().isBlank()) {
            patientRepo.findById(req.getPatientId()).ifPresent(patient -> {
                patient.setLastVisit(LocalDate.now().toString());
                patientRepo.save(patient);
            });
        }

        return saved;
    }

    public Consultation complete(String id) {
        Consultation cons = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consultation not found"));

        cons.setStatus("Completed");
        Consultation updated = repo.save(cons);

        // Flip the nurse queue entry to Done
        if (cons.getToken() != null && !cons.getToken().isBlank()) {
            queueRepo.findById(cons.getToken()).ifPresent(entry -> {
                entry.setStatus("Done");
                queueRepo.save(entry);
            });
        }

        return updated;
    }

    public com.clinic.model.Admission admitToIp(String id, java.util.Map<String, String> payload) {
        Consultation cons = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consultation not found"));
        
        com.clinic.model.Admission admission = new com.clinic.model.Admission();
        admission.setId("ADM-" + System.currentTimeMillis());
        admission.setPatientId(cons.getPatientId());
        // Extract admitting doctor from token/queue if available, but for now we might leave it or use consultation doctor
        // In this system Consultation doesn't explicitly link doctorId, but we can assume token mapping or string
        admission.setAdmittingDoctorId(cons.getDoctorName()); // storing name as ID for demo or if ID is available
        admission.setAdmissionDate(PatientService.now());
        admission.setAcuityLevel(payload.getOrDefault("acuityLevel", "GENERAL"));
        admission.setPrimaryDiagnosisIcd10(payload.getOrDefault("icd10", cons.getDiagnosis()));
        admission.setAdmissionStatus("TRIAGE_PENDING");
        admission.setDepositAmount(0.0);
        
        return admissionRepo.save(admission);
    }
}
