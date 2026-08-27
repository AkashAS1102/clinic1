package com.clinic.controller;

import com.clinic.model.InpatientEncounter;
import com.clinic.service.InpatientWorkflowService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inpatient")
@CrossOrigin("*") // Or handle via existing cors config
public class InpatientWorkflowController {

    private final InpatientWorkflowService service;

    public InpatientWorkflowController(InpatientWorkflowService service) {
        this.service = service;
    }

    @PostMapping("/trigger")
    public InpatientEncounter triggerAdmission(@RequestBody Map<String, String> payload) {
        return service.triggerAdmission(payload);
    }

    @GetMapping("/pending")
    public List<InpatientEncounter> getPendingAdmissions() {
        return service.getPendingAdmissions();
    }
    
    @GetMapping("/admitted")
    public List<InpatientEncounter> getAdmittedPatients() {
        return service.getAdmittedPatients();
    }

    @GetMapping("/spatial-hierarchy")
    public Map<String, Object> getSpatialHierarchy() {
        return service.getSpatialHierarchy();
    }

    @PostMapping("/allocate")
    public InpatientEncounter allocateBed(@RequestBody Map<String, String> payload) {
        String encounterId = payload.get("encounterId");
        String bedId = payload.get("bedId");
        return service.allocateBed(encounterId, bedId);
    }
}
