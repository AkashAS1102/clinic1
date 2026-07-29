package com.clinic.repository;

import com.clinic.model.NurseQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NurseQueueRepository extends JpaRepository<NurseQueue, String> {
    List<NurseQueue> findAllByOrderByCreatedAtAsc();
}
