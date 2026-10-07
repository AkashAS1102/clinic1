package com.clinic.model.stock;

import jakarta.persistence.*;

/**
 * Purchase Return / RTV (Return To Vendor).
 *
 * reasonCode: Damaged in transit | Expired | Destroyed/Wastage | Wrong Item
 * On save a negative RETURN ledger entry is automatically created by the service.
 */
@Entity
@Table(name = "stock_purchase_returns")
public class StockPurchaseReturn {

    @Id
    private String id;

    /** FK to StockGrnItem — the specific batch being returned */
    private String grnItemId;
    private String productId;
    private String productName;
    private String batchNumber;
    private Integer returnedQuantity;

    /** Damaged in transit | Expired | Destroyed/Wastage | Wrong Item */
    private String reasonCode;

    /** Whether a formal debit note has been generated */
    private Boolean debitNoteGenerated;

    private String createdAt;

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getGrnItemId() { return grnItemId; }
    public void setGrnItemId(String grnItemId) { this.grnItemId = grnItemId; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public Integer getReturnedQuantity() { return returnedQuantity; }
    public void setReturnedQuantity(Integer returnedQuantity) { this.returnedQuantity = returnedQuantity; }

    public String getReasonCode() { return reasonCode; }
    public void setReasonCode(String reasonCode) { this.reasonCode = reasonCode; }

    public Boolean getDebitNoteGenerated() { return debitNoteGenerated; }
    public void setDebitNoteGenerated(Boolean debitNoteGenerated) { this.debitNoteGenerated = debitNoteGenerated; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
