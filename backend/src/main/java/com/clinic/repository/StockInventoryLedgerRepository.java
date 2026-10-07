package com.clinic.repository;

import com.clinic.model.stock.StockInventoryLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface StockInventoryLedgerRepository extends JpaRepository<StockInventoryLedger, String> {
    List<StockInventoryLedger> findByProductIdOrderByTransactionDateDesc(String productId);
    List<StockInventoryLedger> findAllByOrderByTransactionDateDesc();

    /** Current on-hand quantity for a product = SUM of all ledger entries */
    @Query("SELECT COALESCE(SUM(l.quantity), 0) FROM StockInventoryLedger l WHERE l.productId = :productId")
    Integer getCurrentStock(@Param("productId") String productId);
}
