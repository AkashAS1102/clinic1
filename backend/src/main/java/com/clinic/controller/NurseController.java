package com.clinic.controller;

import com.clinic.model.Nurse;
import com.clinic.repository.NurseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/nurses")
public class NurseController {

    private final NurseRepository repo;

    public NurseController(NurseRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Nurse> getAll() { return repo.findAllByOrderByCreatedAtDesc(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Nurse create(@RequestBody Nurse nurse) {
        if (nurse.getId() == null || nurse.getId().isBlank())
            nurse.setId("NUR-" + System.currentTimeMillis());
        if (nurse.getCreatedAt() == null)
            nurse.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return repo.save(nurse);
    }

    @PutMapping("/{id}")
    public Nurse update(@PathVariable String id, @RequestBody Nurse nurse) {
        Nurse existing = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        nurse.setId(existing.getId());
        return repo.save(nurse);
    }

    @DeleteMapping("/{id}")
    public Map<String, Boolean> delete(@PathVariable String id) {
        repo.deleteById(id);
        return Map.of("success", true);
    }
}
