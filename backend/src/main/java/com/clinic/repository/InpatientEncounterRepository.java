package com.clinic.repository;

import com.clinic.model.InpatientEncounter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InpatientEncounterRepository extends JpaRepository<InpatientEncounter, String> {
    List<InpatientEncounter> findByStatus(String status);
}
