package com.clinic.model.stock;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

/**
 * A single line item within a Purchase Order.
 */
@Entity
@Table(name = "stock_po_items")
public class StockPoItem {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poId", referencedColumnName = "id")
    @JsonIgnore
    private StockPurchaseOrder purchaseOrder;

    private String productId;
    private String productName;
    private String productSku;
    private String uom;                 // Unit of Measurement (Strips, Vials, etc.)
    private String packingType;         // Physical pack format
    private Integer quantityRequired;
    private Integer quantityReceived;   // updated when GRN is processed
    private Double unitCost;

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public StockPurchaseOrder getPurchaseOrder() { return purchaseOrder; }
    public void setPurchaseOrder(StockPurchaseOrder po) { this.purchaseOrder = po; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getProductSku() { return productSku; }
    public void setProductSku(String productSku) { this.productSku = productSku; }

    public Integer getQuantityRequired() { return quantityRequired; }
    public void setQuantityRequired(Integer quantityRequired) { this.quantityRequired = quantityRequired; }

    public Integer getQuantityReceived() { return quantityReceived; }
    public void setQuantityReceived(Integer quantityReceived) { this.quantityReceived = quantityReceived; }

    public Double getUnitCost() { return unitCost; }
    public void setUnitCost(Double unitCost) { this.unitCost = unitCost; }

    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }

    public String getPackingType() { return packingType; }
    public void setPackingType(String packingType) { this.packingType = packingType; }
}
