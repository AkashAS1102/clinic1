package com.clinic.controller;

import com.clinic.model.Payroll;
import com.clinic.model.Shift;
import com.clinic.repository.PayrollRepository;
import com.clinic.repository.ShiftRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/hr")
public class HrController {

    private final PayrollRepository payrollRepo;
    private final ShiftRepository shiftRepo;

    public HrController(PayrollRepository payrollRepo, ShiftRepository shiftRepo) {
        this.payrollRepo = payrollRepo;
        this.shiftRepo = shiftRepo;
    }

    // ── Payroll ────────────────────────────────────────────────────────────────

    @GetMapping("/payroll")
    public List<Payroll> getPayroll() { return payrollRepo.findAllByOrderByCreatedAtDesc(); }

    @PostMapping("/payroll")
    @ResponseStatus(HttpStatus.CREATED)
    public Payroll createPayroll(@RequestBody Payroll record) {
        if (record.getId() == null || record.getId().isBlank())
            record.setId("PAY-" + System.currentTimeMillis());
        if (record.getCreatedAt() == null)
            record.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return payrollRepo.save(record);
    }

    @PutMapping("/payroll/{id}")
    public Payroll updatePayroll(@PathVariable String id, @RequestBody Payroll record) {
        payrollRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        record.setId(id);
        return payrollRepo.save(record);
    }

    // ── Shifts ─────────────────────────────────────────────────────────────────

    @GetMapping("/shifts")
    public List<Shift> getShifts() { return shiftRepo.findAllByOrderByCreatedAtDesc(); }

    @PostMapping("/shifts")
    @ResponseStatus(HttpStatus.CREATED)
    public Shift createShift(@RequestBody Shift shift) {
        if (shift.getId() == null || shift.getId().isBlank())
            shift.setId("SHF-" + System.currentTimeMillis());
        if (shift.getCreatedAt() == null)
            shift.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return shiftRepo.save(shift);
    }

    @PutMapping("/shifts/{id}")
    public Shift updateShift(@PathVariable String id, @RequestBody Shift shift) {
        shiftRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        shift.setId(id);
        return shiftRepo.save(shift);
    }
}
