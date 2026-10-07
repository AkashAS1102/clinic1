package com.clinic.repository;

import com.clinic.model.UnifiedBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UnifiedBillRepository extends JpaRepository<UnifiedBill, String> {
    List<UnifiedBill> findAllByOrderByCreatedAtDesc();
    Optional<UnifiedBill> findBySourceId(String sourceId);
    List<UnifiedBill> findByPatientId(String patientId);
}
