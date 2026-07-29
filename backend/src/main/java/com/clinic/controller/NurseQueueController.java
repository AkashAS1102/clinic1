package com.clinic.controller;

import com.clinic.model.NurseQueue;
import com.clinic.service.NurseQueueService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/nurse-queue")
public class NurseQueueController {

    private final NurseQueueService service;

    public NurseQueueController(NurseQueueService service) { this.service = service; }

    @GetMapping
    public List<NurseQueue> getAll() { return service.findAll(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NurseQueue add(@RequestBody NurseQueue entry) { return service.addToQueue(entry); }

    /** Accepts partial updates as a plain JSON object (only touched fields sent). */
    @PutMapping("/{token}")
    public NurseQueue update(@PathVariable String token,
                             @RequestBody  Map<String, Object> updates) {
        return service.update(token, updates);
    }
}
