package com.clinic.service;

import com.clinic.model.Bed;
import com.clinic.model.BedAllocation;
import com.clinic.model.BillingLedger;
import com.clinic.repository.BedAllocationRepository;
import com.clinic.repository.BedRepository;
import com.clinic.repository.BillingLedgerRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class BillingJobService {

    private final BedRepository bedRepo;
    private final BedAllocationRepository allocationRepo;
    private final BillingLedgerRepository ledgerRepo;

    public BillingJobService(BedRepository bedRepo, BedAllocationRepository allocationRepo, BillingLedgerRepository ledgerRepo) {
        this.bedRepo = bedRepo;
        this.allocationRepo = allocationRepo;
        this.ledgerRepo = ledgerRepo;
    }

    @Scheduled(cron = "0 0 0 * * ?") // Daily Midnight
    public void generateDailyCharges() {
        List<Bed> occupiedBeds = bedRepo.findAll().stream()
                .filter(b -> "OCCUPIED".equals(b.getStatus()))
                .toList();

        for (Bed bed : occupiedBeds) {
            List<BedAllocation> allocations = allocationRepo.findByBedId(bed.getId()).stream()
                    .filter(a -> a.getReleasedAt() == null)
                    .toList();

            for (BedAllocation alloc : allocations) {
                BillingLedger rent = new BillingLedger();
                rent.setId("BL-" + System.currentTimeMillis() + "-R");
                rent.setAdmissionId(alloc.getAdmissionId());
                rent.setChargeCategory("ROOM_RENT");
                rent.setDescription("Daily Room Rent");
                rent.setUnitPrice(alloc.getTariffPerDay() != null ? alloc.getTariffPerDay() : 1000.0);
                rent.setQuantity(1);
                rent.setTotalAmount(rent.getUnitPrice());
                rent.setIsInsuranceCovered(false);
                rent.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                ledgerRepo.save(rent);
                
                BillingLedger nursing = new BillingLedger();
                nursing.setId("BL-" + System.currentTimeMillis() + "-N");
                nursing.setAdmissionId(alloc.getAdmissionId());
                nursing.setChargeCategory("NURSING");
                nursing.setDescription("Daily Nursing Charges");
                nursing.setUnitPrice(300.0); // mock
                nursing.setQuantity(1);
                nursing.setTotalAmount(300.0);
                nursing.setIsInsuranceCovered(false);
                nursing.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                ledgerRepo.save(nursing);
            }
        }
    }
}
