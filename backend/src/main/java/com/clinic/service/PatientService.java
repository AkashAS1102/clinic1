package com.clinic.service;

import com.clinic.model.Patient;
import com.clinic.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Service
public class PatientService {

    private final PatientRepository repo;
    private final Random random = new Random();

    public PatientService(PatientRepository repo) { this.repo = repo; }

    public List<Patient> findAll() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    public Patient findById(String id) {
        return repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));
    }

    public List<Patient> findByPhone(String rawPhone) {
        String clean = cleanPhone(rawPhone);
        return repo.findAll().stream()
            .filter(p -> cleanPhone(p.getPhone() != null ? p.getPhone() : "").equals(clean))
            .toList();
    }

    public Patient create(Patient req) {
        req.setId(genPatientId());
        req.setPhone(cleanPhone(req.getPhone() != null ? req.getPhone() : ""));
        if (req.getCreatedAt() == null) req.setCreatedAt(now());
        return repo.save(req);
    }

    public Patient update(String id, Patient req) {
        Patient e = findById(id);
        if (req.getPhone()                != null) e.setPhone(cleanPhone(req.getPhone()));
        if (req.getFullName()             != null) e.setFullName(req.getFullName());
        if (req.getDob()                  != null) e.setDob(req.getDob());
        if (req.getGender()               != null) e.setGender(req.getGender());
        if (req.getAddress()              != null) e.setAddress(req.getAddress());
        if (req.getEmergencyContactName() != null) e.setEmergencyContactName(req.getEmergencyContactName());
        if (req.getEmergencyContactPhone()!= null) e.setEmergencyContactPhone(req.getEmergencyContactPhone());
        if (req.getBloodGroup()           != null) e.setBloodGroup(req.getBloodGroup());
        if (req.getAllergies()             != null) e.setAllergies(req.getAllergies());
        if (req.getConditions()           != null) e.setConditions(req.getConditions());
        if (req.getReferringDoctor()      != null) e.setReferringDoctor(req.getReferringDoctor());
        if (req.getPhotoUrl()             != null) e.setPhotoUrl(req.getPhotoUrl());
        if (req.getLastVisit()            != null) e.setLastVisit(req.getLastVisit());
        return repo.save(e);
    }

    public void delete(String id) { repo.deleteById(id); }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String cleanPhone(String phone) {
        String clean = phone.replaceAll("\\D", "");
        if (clean.startsWith("91") && clean.length() > 10) clean = clean.substring(2);
        return clean;
    }

    private String genPatientId() {
        String id;
        do {
            id = "P-" + (100000 + random.nextInt(899999));
        } while (repo.existsById(id));
        return id;
    }

    public static String now() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
