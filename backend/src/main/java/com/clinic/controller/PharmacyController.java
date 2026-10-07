package com.clinic.controller;

import com.clinic.model.PharmacyBill;
import com.clinic.model.PharmacyInventory;
import com.clinic.model.PharmacyPrescription;
import com.clinic.repository.PharmacyBillRepository;
import com.clinic.repository.PharmacyInventoryRepository;
import com.clinic.repository.PharmacyPrescriptionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacy")
public class PharmacyController {

    private final PharmacyInventoryRepository inventoryRepo;
    private final PharmacyPrescriptionRepository rxRepo;
    private final PharmacyBillRepository billRepo;

    public PharmacyController(PharmacyInventoryRepository inventoryRepo,
                               PharmacyPrescriptionRepository rxRepo,
                               PharmacyBillRepository billRepo) {
        this.inventoryRepo = inventoryRepo;
        this.rxRepo = rxRepo;
        this.billRepo = billRepo;
    }

    // ── Inventory ──────────────────────────────────────────────────────────────

    @GetMapping("/inventory")
    public List<PharmacyInventory> getInventory() { return inventoryRepo.findAllByOrderByCreatedAtDesc(); }

    @PostMapping("/inventory")
    @ResponseStatus(HttpStatus.CREATED)
    public PharmacyInventory createMed(@RequestBody PharmacyInventory med) {
        if (med.getId() == null || med.getId().isBlank())
            med.setId("MED-" + System.currentTimeMillis());
        if (med.getCreatedAt() == null)
            med.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return inventoryRepo.save(med);
    }

    @PutMapping("/inventory/{id}")
    public PharmacyInventory updateMed(@PathVariable String id, @RequestBody PharmacyInventory med) {
        inventoryRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        med.setId(id);
        return inventoryRepo.save(med);
    }

    @DeleteMapping("/inventory/{id}")
    public Map<String, Boolean> deleteMed(@PathVariable String id) {
        inventoryRepo.deleteById(id);
        return Map.of("success", true);
    }

    // ── Prescriptions ──────────────────────────────────────────────────────────

    @GetMapping("/prescriptions")
    public List<PharmacyPrescription> getPrescriptions() { return rxRepo.findAllByOrderByCreatedAtDesc(); }

    @PostMapping("/prescriptions")
    @ResponseStatus(HttpStatus.CREATED)
    public PharmacyPrescription createRx(@RequestBody PharmacyPrescription rx) {
        if (rx.getId() == null || rx.getId().isBlank())
            rx.setId("RX-" + System.currentTimeMillis());
        if (rx.getCreatedAt() == null)
            rx.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return rxRepo.save(rx);
    }

    @PutMapping("/prescriptions/{id}/status")
    public PharmacyPrescription updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        PharmacyPrescription rx = rxRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        rx.setStatus(body.get("status"));
        return rxRepo.save(rx);
    }

    /**
     * Dispense a prescription: deduct stock, mark as Paid, create a bill.
     */
    @PutMapping("/prescriptions/{id}/dispense")
    public java.util.Map<String, Object> dispense(@PathVariable String id,
                                          @RequestBody Map<String, String> body) {
        PharmacyPrescription rx = rxRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        rx.setStatus("Dispensed");
        rxRepo.save(rx);

        // Create a bill record
        PharmacyBill bill = new PharmacyBill();
        bill.setId("BILL-" + System.currentTimeMillis());
        bill.setRxId(rx.getId());
        bill.setPatientId(rx.getPatientId());
        bill.setPatientName(rx.getPatientName());
        bill.setDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        bill.setPaymentMethod(body.getOrDefault("paymentMethod", "Cash"));
        bill.setTotal(rx.getTotalAmount());
        bill.setSubtotal(rx.getTotalAmount());
        bill.setStatus("Paid");
        bill.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        billRepo.save(bill);

        return java.util.Map.of("rx", rx, "bill", bill);
    }

    // ── Bills ──────────────────────────────────────────────────────────────────

    @GetMapping("/bills")
    public List<PharmacyBill> getBills() { return billRepo.findAllByOrderByCreatedAtDesc(); }

    @PutMapping("/bills/{id}/return")
    public PharmacyBill returnBill(@PathVariable String id,
                                    @RequestBody Map<String, String> body) {
        PharmacyBill bill = billRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        bill.setStatus("Returned");
        bill.setReturnReason(body.getOrDefault("returnReason", ""));
        return billRepo.save(bill);
    }
}
