package com.clinic.controller;

import com.clinic.model.Appointment;
import com.clinic.service.AppointmentService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService service;

    public AppointmentController(AppointmentService service) { this.service = service; }

    @GetMapping
    public List<Appointment> getAll() { return service.findAll(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Appointment create(@RequestBody Appointment appointment) {
        return service.create(appointment);
    }

    @PutMapping("/{id}")
    public Appointment update(@PathVariable String id, @RequestBody Appointment appointment) {
        return service.update(id, appointment);
    }

    /**
     * Check if a doctor already has a scheduled appointment on the same date and time slot.
     * Returns { conflict: false } or responds 409 with { conflict: true, message: "..." }
     */
    @PostMapping("/check-conflict")
    public Map<String, Object> checkConflict(@RequestBody Map<String, String> body) {
        return service.checkConflict(
            body.get("doctorId"),
            body.get("date"),
            body.get("timeSlot")
        );
    }
}
