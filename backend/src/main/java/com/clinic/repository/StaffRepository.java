package com.clinic.repository;

import com.clinic.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StaffRepository extends JpaRepository<Staff, String> {
    List<Staff> findAllByOrderByCreatedAtDesc();
}
