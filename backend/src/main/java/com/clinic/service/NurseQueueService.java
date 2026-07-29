package com.clinic.service;

import com.clinic.model.NurseQueue;
import com.clinic.repository.NurseQueueRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class NurseQueueService {

    private final NurseQueueRepository repo;
    private final Random random = new Random();

    public NurseQueueService(NurseQueueRepository repo) { this.repo = repo; }

    public List<NurseQueue> findAll() {
        return repo.findAllByOrderByCreatedAtAsc();
    }

    public NurseQueue addToQueue(NurseQueue req) {
        if (req.getToken() == null || req.getToken().isBlank()) {
            req.setToken("REG-" + (100 + random.nextInt(899)));
        }
        if (req.getStatus()     == null) req.setStatus("Pending");
        if (req.getDoctorName() == null) req.setDoctorName("Not Assigned");
        req.setSentToDoctor(false);
        req.setCreatedAt(PatientService.now());
        return repo.save(req);
    }

    /** Partial update — only applies fields that are present in the map. */
    public NurseQueue update(String token, Map<String, Object> updates) {
        NurseQueue e = repo.findById(token)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Queue entry not found"));
        applyUpdates(e, updates);
        return repo.save(e);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void applyUpdates(NurseQueue e, Map<String, Object> u) {
        if (u.containsKey("status"))          e.setStatus(str(u.get("status")));
        if (u.containsKey("bp"))              e.setBp(str(u.get("bp")));
        if (u.containsKey("pulse"))           e.setPulse(str(u.get("pulse")));
        if (u.containsKey("temp"))            e.setTemp(str(u.get("temp")));
        if (u.containsKey("weight"))          e.setWeight(str(u.get("weight")));
        if (u.containsKey("height"))          e.setHeight(str(u.get("height")));
        if (u.containsKey("bmi"))             e.setBmi(str(u.get("bmi")));
        if (u.containsKey("spo2"))            e.setSpo2(str(u.get("spo2")));
        if (u.containsKey("rbs"))             e.setRbs(str(u.get("rbs")));
        if (u.containsKey("chiefComplaint"))  e.setChiefComplaint(str(u.get("chiefComplaint")));
        if (u.containsKey("nurseNotes"))      e.setNurseNotes(str(u.get("nurseNotes")));
        if (u.containsKey("doctorName"))      e.setDoctorName(str(u.get("doctorName")));
        if (u.containsKey("sentToDoctor")) {
            Object val = u.get("sentToDoctor");
            if (val instanceof Boolean b)   e.setSentToDoctor(b);
            else if (val instanceof Number n) e.setSentToDoctor(n.intValue() == 1);
        }
    }

    private static String str(Object o) { return o != null ? o.toString() : ""; }
}
