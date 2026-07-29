package com.clinic.controller;

import com.clinic.model.Consultation;
import com.clinic.service.ConsultationService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {

    private final ConsultationService service;

    public ConsultationController(ConsultationService service) { this.service = service; }

    @GetMapping
    public List<Consultation> getAll() { return service.findAll(); }

    @GetMapping("/patient/{patientId}")
    public List<Consultation> getByPatient(@PathVariable String patientId) {
        return service.findByPatient(patientId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Consultation create(@RequestBody Consultation consultation) {
        return service.save(consultation);
    }

    @PutMapping("/{id}/complete")
    public Consultation complete(@PathVariable String id) {
        return service.complete(id);
    }
}
