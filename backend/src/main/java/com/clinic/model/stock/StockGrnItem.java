package com.clinic.model.stock;

import jakarta.persistence.*;

/**
 * Goods Receipt Note (GRN) – one row per product batch received against a PO.
 *
 * discrepancyStatus: Matched | Partial Fulfillment | Over-delivered
 * status:            Pending QC | Verified | Discrepancy
 */
@Entity
@Table(name = "stock_grn_items")
public class StockGrnItem {

    @Id
    private String id;

    /** FK to StockPurchaseOrder */
    private String poId;
    /** FK to StockPoItem */
    private String poItemId;
    /** FK to StockProduct */
    private String productId;
    private String productName;

    // Batch & Expiry Tracking (mandatory before QC verification)
    private String batchNumber;
    private String mfgDate;
    private String expiryDate;

    // Discrepancy Engine
    private Integer orderedQuantity;
    private Integer receivedQuantity;
    /** Matched | Partial Fulfillment | Over-delivered */
    private String discrepancyStatus;

    // QC
    private Boolean qcPassed;
    private String storageTemp;     // Cold chain temperature recorded on arrival
    private String qcNotes;         // Inspector notes
    /** Pending QC | Verified | Discrepancy */
    private String status;

    private String verifiedBy;
    private String receivedDate;
    private String createdAt;

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPoId() { return poId; }
    public void setPoId(String poId) { this.poId = poId; }

    public String getPoItemId() { return poItemId; }
    public void setPoItemId(String poItemId) { this.poItemId = poItemId; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public String getMfgDate() { return mfgDate; }
    public void setMfgDate(String mfgDate) { this.mfgDate = mfgDate; }

    public String getExpiryDate() { return expiryDate; }
    public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }

    public Integer getOrderedQuantity() { return orderedQuantity; }
    public void setOrderedQuantity(Integer orderedQuantity) { this.orderedQuantity = orderedQuantity; }

    public Integer getReceivedQuantity() { return receivedQuantity; }
    public void setReceivedQuantity(Integer receivedQuantity) { this.receivedQuantity = receivedQuantity; }

    public String getDiscrepancyStatus() { return discrepancyStatus; }
    public void setDiscrepancyStatus(String discrepancyStatus) { this.discrepancyStatus = discrepancyStatus; }

    public Boolean getQcPassed() { return qcPassed; }
    public void setQcPassed(Boolean qcPassed) { this.qcPassed = qcPassed; }

    public String getStorageTemp() { return storageTemp; }
    public void setStorageTemp(String storageTemp) { this.storageTemp = storageTemp; }

    public String getQcNotes() { return qcNotes; }
    public void setQcNotes(String qcNotes) { this.qcNotes = qcNotes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public String getReceivedDate() { return receivedDate; }
    public void setReceivedDate(String receivedDate) { this.receivedDate = receivedDate; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
