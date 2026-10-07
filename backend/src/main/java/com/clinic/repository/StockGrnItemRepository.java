package com.clinic.repository;

import com.clinic.model.stock.StockGrnItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockGrnItemRepository extends JpaRepository<StockGrnItem, String> {
    List<StockGrnItem> findAllByOrderByCreatedAtDesc();
    List<StockGrnItem> findByPoId(String poId);
    List<StockGrnItem> findByStatus(String status);
    List<StockGrnItem> findByProductIdAndQcPassed(String productId, Boolean qcPassed);
}
