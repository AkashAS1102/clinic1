package com.clinic.repository;

import com.clinic.model.BillingLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillingLedgerRepository extends JpaRepository<BillingLedger, String> {
    List<BillingLedger> findByAdmissionId(String admissionId);
}
