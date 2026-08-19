package com.clinic.controller;

import com.clinic.service.WardBedService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class WardBedController {

    private final WardBedService service;

    public WardBedController(WardBedService service) {
        this.service = service;
    }

    @PostMapping("/wards/bulk-generate")
    public void bulkGenerate(@RequestBody Map<String, Object> payload) {
        service.bulkGenerate(payload);
    }

    @GetMapping("/beds/matrix")
    public Map<String, Object> getBedsMatrix() {
        return service.getBedsMatrix();
    }

    @PostMapping("/beds/{id}/transfer")
    public void transferBed(@PathVariable String id, @RequestBody Map<String, String> payload) {
        service.transferBed(id, payload);
    }
}
