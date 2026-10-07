package com.clinic.model.stock;

import jakarta.persistence.*;

/**
 * Active Inventory Ledger — single source of truth for on-hand stock.
 *
 * transactionType: INWARD | OUTWARD | RETURN | WASTAGE
 * Each row is immutable; net stock = SUM(quantity) grouped by productId.
 * Negative quantity = stock reduction (OUTWARD / RETURN / WASTAGE).
 */
@Entity
@Table(name = "stock_inventory_ledger")
public class StockInventoryLedger {

    @Id
    private String id;

    private String productId;
    private String productName;
    private String grnItemId;           // FK to StockGrnItem (nullable for OUTWARD)

    /** INWARD | OUTWARD | RETURN | WASTAGE */
    private String transactionType;

    /** Positive for INWARD, negative for OUTWARD / RETURN / WASTAGE */
    private Integer quantity;

    /** Batch linked to this transaction */
    private String batchNumber;
    private String expiryDate;

    /** Free-form reference: GRN ID, invoice ID, return ID, etc. */
    private String referenceId;

    private String transactionDate;

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getGrnItemId() { return grnItemId; }
    public void setGrnItemId(String grnItemId) { this.grnItemId = grnItemId; }

    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public String getExpiryDate() { return expiryDate; }
    public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getTransactionDate() { return transactionDate; }
    public void setTransactionDate(String transactionDate) { this.transactionDate = transactionDate; }
}
