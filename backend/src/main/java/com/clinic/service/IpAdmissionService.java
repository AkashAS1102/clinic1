package com.clinic.service;

import com.clinic.model.*;
import com.clinic.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class IpAdmissionService {

    private final AdmissionRepository admissionRepo;
    private final BedRepository bedRepo;
    private final BedAllocationRepository allocationRepo;
    private final VitalLogRepository vitalLogRepo;
    private final BillingLedgerRepository ledgerRepo;
    private final HousekeepingTaskRepository housekeepingRepo;

    public IpAdmissionService(AdmissionRepository admissionRepo, BedRepository bedRepo, BedAllocationRepository allocationRepo, VitalLogRepository vitalLogRepo, BillingLedgerRepository ledgerRepo, HousekeepingTaskRepository housekeepingRepo) {
        this.admissionRepo = admissionRepo;
        this.bedRepo = bedRepo;
        this.allocationRepo = allocationRepo;
        this.vitalLogRepo = vitalLogRepo;
        this.ledgerRepo = ledgerRepo;
        this.housekeepingRepo = housekeepingRepo;
    }

    public List<Admission> getTriageQueue() {
        return admissionRepo.findAll().stream()
                .filter(a -> "TRIAGE_PENDING".equals(a.getAdmissionStatus()))
                .collect(Collectors.toList());
    }

    public BedAllocation allocateBed(String admissionId, String bedId) {
        Admission admission = admissionRepo.findById(admissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admission not found"));
        Bed bed = bedRepo.findById(bedId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bed not found"));

        if (!"AVAILABLE".equals(bed.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bed is not available");
        }

        bed.setStatus("OCCUPIED");
        bedRepo.save(bed);

        admission.setAdmissionStatus("ADMITTED");
        admissionRepo.save(admission);

        BedAllocation allocation = new BedAllocation();
        allocation.setId("ALLOC-" + System.currentTimeMillis());
        allocation.setAdmissionId(admissionId);
        allocation.setBedId(bedId);
        allocation.setAllocatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return allocationRepo.save(allocation);
    }

    public VitalLog recordVitals(String admissionId, VitalLog log) {
        log.setId("VITAL-" + System.currentTimeMillis());
        log.setAdmissionId(admissionId);
        log.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        // Simple MEWS calculation
        int score = 0;
        if (log.getHeartRate() != null && (log.getHeartRate() < 40 || log.getHeartRate() > 130)) score += 3;
        else if (log.getHeartRate() != null && (log.getHeartRate() > 110)) score += 2;
        log.setMewsScore(score);
        
        return vitalLogRepo.save(log);
    }

    public void administerEmar(String admissionId, java.util.Map<String, String> payload) {
        // Mock implementation for recording eMAR
    }

    public List<BillingLedger> getLedgerSummary(String admissionId) {
        return ledgerRepo.findByAdmissionId(admissionId);
    }

    public Admission initiateDischarge(String admissionId) {
        Admission admission = admissionRepo.findById(admissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        admission.setAdmissionStatus("DISCHARGE_IN_PROGRESS");
        return admissionRepo.save(admission);
    }

    public Admission finalizeDischarge(String admissionId) {
        Admission admission = admissionRepo.findById(admissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        admission.setAdmissionStatus("DISCHARGED");
        admission.setDischargeDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        // Find active bed allocation to release
        List<BedAllocation> allocations = allocationRepo.findByAdmissionId(admissionId);
        for (BedAllocation alloc : allocations) {
            if (alloc.getReleasedAt() == null) {
                alloc.setReleasedAt(admission.getDischargeDate());
                allocationRepo.save(alloc);

                // Set bed status to HOUSEKEEPING_REQUIRED
                bedRepo.findById(alloc.getBedId()).ifPresent(bed -> {
                    bed.setStatus("HOUSEKEEPING_REQUIRED");
                    bedRepo.save(bed);

                    HousekeepingTask task = new HousekeepingTask();
                    task.setId("HK-" + System.currentTimeMillis());
                    task.setBedId(bed.getId());
                    task.setStatus("PENDING");
                    housekeepingRepo.save(task);
                });
            }
        }

        return admissionRepo.save(admission);
    }
}
