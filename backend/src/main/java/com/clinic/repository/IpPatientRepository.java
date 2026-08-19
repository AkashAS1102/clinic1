package com.clinic.repository;

import com.clinic.model.IpPatient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IpPatientRepository extends JpaRepository<IpPatient, String> {
    
    // Custom query to find patients by status (e.g., active ones)
    List<IpPatient> findByStatusNot(String status);
}
