package com.clinic.repository;

import com.clinic.model.HousekeepingTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HousekeepingTaskRepository extends JpaRepository<HousekeepingTask, String> {
}
