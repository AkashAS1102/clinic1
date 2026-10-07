package com.clinic.repository;

import com.clinic.model.stock.StockPurchaseReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockPurchaseReturnRepository extends JpaRepository<StockPurchaseReturn, String> {
    List<StockPurchaseReturn> findAllByOrderByCreatedAtDesc();
    List<StockPurchaseReturn> findByGrnItemId(String grnItemId);
    List<StockPurchaseReturn> findByProductId(String productId);
    List<StockPurchaseReturn> findByDebitNoteGenerated(Boolean debitNoteGenerated);
}
