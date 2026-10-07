package com.clinic.repository;

import com.clinic.model.stock.StockProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StockProductRepository extends JpaRepository<StockProduct, String> {
    List<StockProduct> findAllByOrderByCreatedAtDesc();
    Optional<StockProduct> findBySku(String sku);
    List<StockProduct> findByCategoryType(String categoryType);
    /** Return products whose current stock is below their minStockLevel (requires ledger join — done in service) */
    List<StockProduct> findByMinStockLevelGreaterThan(Integer zero);
}
