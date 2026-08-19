package com.clinic.controller;

import com.clinic.model.*;
import com.clinic.service.IpAdmissionService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ip")
public class IpAdmissionController {

    private final IpAdmissionService service;

    public IpAdmissionController(IpAdmissionService service) {
        this.service = service;
    }

    @GetMapping("/triage-queue")
    public List<Admission> getTriageQueue() {
        return service.getTriageQueue();
    }

    @PostMapping("/admissions/{id}/allocate-bed")
    public BedAllocation allocateBed(@PathVariable String id, @RequestBody Map<String, String> payload) {
        return service.allocateBed(id, payload.get("bedId"));
    }

    @PostMapping("/admissions/{id}/vitals")
    public VitalLog recordVitals(@PathVariable String id, @RequestBody VitalLog log) {
        return service.recordVitals(id, log);
    }

    @PostMapping("/admissions/{id}/emar/administer")
    public void administerEmar(@PathVariable String id, @RequestBody Map<String, String> payload) {
        service.administerEmar(id, payload);
    }

    @GetMapping("/admissions/{id}/ledger-summary")
    public List<BillingLedger> getLedgerSummary(@PathVariable String id) {
        return service.getLedgerSummary(id);
    }

    @PostMapping("/admissions/{id}/initiate-discharge")
    public Admission initiateDischarge(@PathVariable String id) {
        return service.initiateDischarge(id);
    }

    @PostMapping("/admissions/{id}/finalize-discharge")
    public Admission finalizeDischarge(@PathVariable String id) {
        return service.finalizeDischarge(id);
    }
}
