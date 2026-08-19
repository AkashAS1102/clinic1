package com.clinic.repository;

import com.clinic.model.BedAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedAllocationRepository extends JpaRepository<BedAllocation, String> {
    List<BedAllocation> findByAdmissionId(String admissionId);
    List<BedAllocation> findByBedId(String bedId);
}
