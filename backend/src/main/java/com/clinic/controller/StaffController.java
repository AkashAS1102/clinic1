package com.clinic.controller;

import com.clinic.model.Staff;
import com.clinic.repository.StaffRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staffs")
public class StaffController {

    private final StaffRepository repo;

    public StaffController(StaffRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Staff> getAll() { return repo.findAllByOrderByCreatedAtDesc(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Staff create(@RequestBody Staff staff) {
        if (staff.getId() == null || staff.getId().isBlank())
            staff.setId("STF-" + System.currentTimeMillis());
        if (staff.getCreatedAt() == null)
            staff.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return repo.save(staff);
    }

    @PutMapping("/{id}")
    public Staff update(@PathVariable String id, @RequestBody Staff staff) {
        Staff existing = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        staff.setId(existing.getId());
        return repo.save(staff);
    }

    @DeleteMapping("/{id}")
    public Map<String, Boolean> delete(@PathVariable String id) {
        repo.deleteById(id);
        return Map.of("success", true);
    }
}
