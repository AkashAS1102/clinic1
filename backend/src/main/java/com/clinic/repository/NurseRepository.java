package com.clinic.repository;

import com.clinic.model.Nurse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NurseRepository extends JpaRepository<Nurse, String> {
    List<Nurse> findAllByOrderByCreatedAtDesc();
}
