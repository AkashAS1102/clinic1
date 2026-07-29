package com.clinic.controller;

import com.clinic.model.Patient;
import com.clinic.service.PatientService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService service;

    public PatientController(PatientService service) { this.service = service; }

    @GetMapping
    public List<Patient> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public Patient getById(@PathVariable String id) { return service.findById(id); }

    @GetMapping("/phone/{phone}")
    public List<Patient> getByPhone(@PathVariable String phone) { return service.findByPhone(phone); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Patient create(@RequestBody Patient patient) { return service.create(patient); }

    @PutMapping("/{id}")
    public Patient update(@PathVariable String id, @RequestBody Patient patient) {
        return service.update(id, patient);
    }

    @DeleteMapping("/{id}")
    public Map<String, Boolean> delete(@PathVariable String id) {
        service.delete(id);
        return Map.of("success", true);
    }
}
