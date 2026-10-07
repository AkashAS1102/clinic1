package com.clinic.model.stock;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a Purchase Order (PO) header.
 * Line items are stored in StockPoItem.
 *
 * Status lifecycle:
 *   Draft -> Pending Approval -> Sent -> Partially Received -> Completed | Cancelled
 */
@Entity
@Table(name = "stock_purchase_orders")
public class StockPurchaseOrder {

    @Id
    private String id;

    private String vendorId;
    private String vendorName;
    private String poDate;
    private String expectedDeliveryDate;

    /** Draft | Pending Approval | Sent | Partially Received | Completed | Cancelled */
    private String status;

    private Double totalCost;
    private String notes;
    private String priority;   // Normal | High | Critical / Emergency
    private String createdAt;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<StockPoItem> items = new ArrayList<>();

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getVendorId() { return vendorId; }
    public void setVendorId(String vendorId) { this.vendorId = vendorId; }

    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }

    public String getPoDate() { return poDate; }
    public void setPoDate(String poDate) { this.poDate = poDate; }

    public String getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(String v) { this.expectedDeliveryDate = v; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getTotalCost() { return totalCost; }
    public void setTotalCost(Double totalCost) { this.totalCost = totalCost; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public List<StockPoItem> getItems() { return items; }
    public void setItems(List<StockPoItem> items) { this.items = items; }
}
