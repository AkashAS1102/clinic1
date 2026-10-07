package com.clinic.controller;

import com.clinic.model.CentralBill;
import com.clinic.repository.CentralBillRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing/central")
public class CentralBillingController {

    private final CentralBillRepository billRepo;

    public CentralBillingController(CentralBillRepository billRepo) {
        this.billRepo = billRepo;
    }

    @GetMapping
    public List<CentralBill> getBills() {
        return billRepo.findAllByOrderByDateDesc();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CentralBill createBill(@RequestBody CentralBill bill) {
        if (bill.getId() == null || bill.getId().isBlank())
            bill.setId("CBILL-" + System.currentTimeMillis());
        if (bill.getDate() == null)
            bill.setDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return billRepo.save(bill);
    }

    @PutMapping("/{id}/pay")
    public CentralBill payBill(@PathVariable String id, @RequestBody Map<String, String> body) {
        CentralBill bill = billRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        
        bill.setStatus("Paid");
        bill.setPaymentMethod(body.getOrDefault("paymentMethod", "Cash"));
        bill.setPaidAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        return billRepo.save(bill);
    }
}
