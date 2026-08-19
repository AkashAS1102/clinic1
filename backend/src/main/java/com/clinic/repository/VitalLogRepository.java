package com.clinic.repository;

import com.clinic.model.VitalLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VitalLogRepository extends JpaRepository<VitalLog, String> {
    List<VitalLog> findByAdmissionId(String admissionId);
}
