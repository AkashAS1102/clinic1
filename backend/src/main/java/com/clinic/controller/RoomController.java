package com.clinic.controller;

import com.clinic.model.Room;
import com.clinic.repository.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomRepository repo;

    public RoomController(RoomRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Room> getAll() { return repo.findAll(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Room create(@RequestBody Room room) {
        if (room.getId() == null || room.getId().isBlank())
            room.setId("RM-" + System.currentTimeMillis());
        return repo.save(room);
    }

    @PutMapping("/{id}")
    public Room update(@PathVariable String id, @RequestBody Room room) {
        Room existing = repo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        room.setId(existing.getId());
        return repo.save(room);
    }

    @DeleteMapping("/{id}")
    public Map<String, Boolean> delete(@PathVariable String id) {
        repo.deleteById(id);
        return Map.of("success", true);
    }
}
