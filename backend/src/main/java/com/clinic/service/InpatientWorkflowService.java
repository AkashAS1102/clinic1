package com.clinic.service;

import com.clinic.model.Bed;
import com.clinic.model.InpatientEncounter;
import com.clinic.model.Room;
import com.clinic.model.Ward;
import com.clinic.repository.BedRepository;
import com.clinic.repository.InpatientEncounterRepository;
import com.clinic.repository.RoomRepository;
import com.clinic.repository.WardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class InpatientWorkflowService {

    private final InpatientEncounterRepository encounterRepo;
    private final BedRepository bedRepo;
    private final RoomRepository roomRepo;
    private final WardRepository wardRepo;

    public InpatientWorkflowService(InpatientEncounterRepository encounterRepo,
                                    BedRepository bedRepo,
                                    RoomRepository roomRepo,
                                    WardRepository wardRepo) {
        this.encounterRepo = encounterRepo;
        this.bedRepo = bedRepo;
        this.roomRepo = roomRepo;
        this.wardRepo = wardRepo;
    }

    @Transactional
    public InpatientEncounter triggerAdmission(Map<String, String> payload) {
        InpatientEncounter encounter = new InpatientEncounter();
        encounter.setEncounterId("ENC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        encounter.setPatientId(payload.get("patientId"));
        encounter.setAdmittingDocId(payload.get("doctorId"));
        encounter.setStatus("Pending_Admit"); // Waiting for bed assignment
        encounter.setPriority(payload.get("priority"));
        encounter.setRequiredSpecialty(payload.get("specialty"));
        encounter.setRequiredBedTags(payload.get("bedTags"));
        encounter.setAdmittingDiagnosis(payload.get("diagnosis"));
        encounter.setBedId(null);
        
        System.out.println("HL7 ADT Payload Generated for Pending Admit: " + encounter.getEncounterId());
        
        return encounterRepo.save(encounter);
    }

    public List<InpatientEncounter> getPendingAdmissions() {
        return encounterRepo.findByStatus("Pending_Admit");
    }
    
    public List<InpatientEncounter> getAdmittedPatients() {
        return encounterRepo.findByStatus("Admitted");
    }

    @Transactional
    public InpatientEncounter allocateBed(String encounterId, String bedId) {
        InpatientEncounter encounter = encounterRepo.findById(encounterId)
                .orElseThrow(() -> new RuntimeException("Encounter not found"));
        Bed bed = bedRepo.findById(bedId)
                .orElseThrow(() -> new RuntimeException("Bed not found"));

        if (!"AVAILABLE".equalsIgnoreCase(bed.getStatus())) {
            throw new RuntimeException("Bed is not available!");
        }

        // Atomic Transaction updates
        bed.setStatus("OCCUPIED");
        bedRepo.save(bed);

        encounter.setBedId(bedId);
        encounter.setStatus("Admitted");
        encounter.setAdmissionTime(LocalDateTime.now());
        
        System.out.println("HL7 ADT^A01 (Admit) Message Generated: Patient " + encounter.getPatientId() + " -> Bed " + bedId);

        return encounterRepo.save(encounter);
    }

    public Map<String, Object> getSpatialHierarchy() {
        Map<String, Object> response = new HashMap<>();
        response.put("wards", wardRepo.findAll());
        response.put("rooms", roomRepo.findAll());
        response.put("beds", bedRepo.findAll());
        return response;
    }
}
