package com.clinic.repository;

import com.clinic.model.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShiftRepository extends JpaRepository<Shift, String> {
    List<Shift> findAllByOrderByCreatedAtDesc();
}
