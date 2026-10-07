package com.clinic.controller;

import com.clinic.model.UnifiedBill;
import com.clinic.service.UnifiedBillingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing/unified")
@CrossOrigin
public class UnifiedBillingController {

    private final UnifiedBillingService service;

    public UnifiedBillingController(UnifiedBillingService service) {
        this.service = service;
    }

    @GetMapping({"", "/"})
    public ResponseEntity<List<UnifiedBillingService.UnifiedBillDTO>> getAllUnifiedBills() {
        return ResponseEntity.ok(service.getAllUnifiedBills());
    }

    @GetMapping("/source/{sourceId}")
    public ResponseEntity<UnifiedBillingService.UnifiedBillDTO> getUnifiedBillBySourceId(@PathVariable String sourceId) {
        UnifiedBillingService.UnifiedBillDTO dto = service.getUnifiedBillBySourceId(sourceId);
        if (dto != null) {
            return ResponseEntity.ok(dto);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/pay")
    public ResponseEntity<UnifiedBill> collectPayment(@RequestBody Map<String, String> body) {
        String sourceId = body.get("sourceId");
        String paymentMethod = body.get("paymentMethod");
        if (sourceId == null || paymentMethod == null) {
            return ResponseEntity.badRequest().build();
        }
        UnifiedBill paidBill = service.collectPayment(sourceId, paymentMethod);
        return ResponseEntity.ok(paidBill);
    }
}
