package com.clinic.repository;

import com.clinic.model.PharmacyBill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PharmacyBillRepository extends JpaRepository<PharmacyBill, String> {
    List<PharmacyBill> findAllByOrderByCreatedAtDesc();
}
