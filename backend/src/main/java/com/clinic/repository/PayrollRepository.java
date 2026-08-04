package com.clinic.repository;

import com.clinic.model.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PayrollRepository extends JpaRepository<Payroll, String> {
    List<Payroll> findAllByOrderByCreatedAtDesc();
}
