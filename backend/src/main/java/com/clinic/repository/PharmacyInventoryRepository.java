package com.clinic.repository;

import com.clinic.model.PharmacyInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PharmacyInventoryRepository extends JpaRepository<PharmacyInventory, String> {
    List<PharmacyInventory> findAllByOrderByCreatedAtDesc();
}
