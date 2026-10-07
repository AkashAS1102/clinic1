package com.clinic.repository;

import com.clinic.model.CentralBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CentralBillRepository extends JpaRepository<CentralBill, String> {
    List<CentralBill> findAllByOrderByDateDesc();
}
