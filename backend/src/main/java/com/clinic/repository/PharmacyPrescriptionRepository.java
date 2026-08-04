package com.clinic.repository;

import com.clinic.model.PharmacyPrescription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PharmacyPrescriptionRepository extends JpaRepository<PharmacyPrescription, String> {
    List<PharmacyPrescription> findAllByOrderByCreatedAtDesc();
}
