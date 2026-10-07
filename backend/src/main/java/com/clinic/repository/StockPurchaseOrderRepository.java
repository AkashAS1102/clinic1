package com.clinic.repository;

import com.clinic.model.stock.StockPurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockPurchaseOrderRepository extends JpaRepository<StockPurchaseOrder, String> {
    List<StockPurchaseOrder> findAllByOrderByCreatedAtDesc();
    List<StockPurchaseOrder> findByStatus(String status);
    List<StockPurchaseOrder> findByVendorId(String vendorId);
}
