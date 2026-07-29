package com.clinic.service;

import com.clinic.model.Doctor;
import com.clinic.repository.DoctorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Random;

@Service
public class DoctorService {

    private final DoctorRepository repo;
    private final Random random = new Random();

    public DoctorService(DoctorRepository repo) { this.repo = repo; }

    public List<Doctor> findAll() { return repo.findAllByOrderByName(); }

    public Doctor findById(String id) {
        return repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
    }

    public Doctor create(Doctor req) {
        req.setId(genDoctorId());
        if (req.getCreatedAt() == null) req.setCreatedAt(PatientService.now());
        if (req.getStatus() == null)    req.setStatus("Active");
        return repo.save(req);
    }

    public Doctor update(String id, Doctor req) {
        Doctor e = findById(id);
        if (req.getName()          != null) e.setName(req.getName());
        if (req.getDepartment()    != null) e.setDepartment(req.getDepartment());
        if (req.getQualification() != null) e.setQualification(req.getQualification());
        if (req.getContact()       != null) e.setContact(req.getContact());
        if (req.getEmail()         != null) e.setEmail(req.getEmail());
        if (req.getAvailableDays() != null) e.setAvailableDays(req.getAvailableDays());
        if (req.getTimeSlot()      != null) e.setTimeSlot(req.getTimeSlot());
        if (req.getFee()           != null) e.setFee(req.getFee());
        if (req.getStatus()        != null) e.setStatus(req.getStatus());
        if (req.getPhotoUrl()      != null) e.setPhotoUrl(req.getPhotoUrl());
        return repo.save(e);
    }

    public void delete(String id) { repo.deleteById(id); }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String genDoctorId() {
        String id;
        do {
            id = "DOC-" + (1000 + random.nextInt(8999));
        } while (repo.existsById(id));
        return id;
    }
}
