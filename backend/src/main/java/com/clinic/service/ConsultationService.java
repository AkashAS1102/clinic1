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

    public ConsultationService(ConsultationRepository repo,
                               NurseQueueRepository   queueRepo,
                               PatientRepository      patientRepo) {
        this.repo        = repo;
        this.queueRepo   = queueRepo;
        this.patientRepo = patientRepo;
    }

    public List<Consultation> findAll() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    public List<Consultation> findByPatient(String patientId) {
        return repo.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    public Consultation save(Consultation req) {
        req.setId("CON-" + System.currentTimeMillis());
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
}
