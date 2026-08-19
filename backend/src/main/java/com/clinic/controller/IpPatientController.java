package com.clinic.controller;

import com.clinic.model.IpPatient;
import com.clinic.repository.IpPatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ip-patients")
public class IpPatientController {

    private final IpPatientRepository repo;

    public IpPatientController(IpPatientRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<IpPatient> getAll() {
        // You could sort by admissionDate if desired, but findAll is fine for now
        return repo.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IpPatient create(@RequestBody IpPatient patient) {
        if (patient.getId() == null || patient.getId().isBlank()) {
            patient.setId("IP-" + System.currentTimeMillis());
        }
        return repo.save(patient);
    }

    @PutMapping("/{id}")
    public IpPatient update(@PathVariable String id, @RequestBody IpPatient updated) {
        IpPatient existing = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        
        // Preserve original ID
        updated.setId(existing.getId());
        return repo.save(updated);
    }

    @DeleteMapping("/{id}")
    public Map<String, Boolean> delete(@PathVariable String id) {
        repo.deleteById(id);
        return Map.of("success", true);
    }
}
