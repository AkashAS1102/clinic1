package com.clinic.model.stock;

import jakarta.persistence.*;

@Entity
@Table(name = "stock_products")
public class StockProduct {

    @Id
    private String id;

    private String name;
    private String genericName;
    private String categoryType;        // e.g. "All Medicine"
    private String sku;
    private String barcode;
    private String hsnCode;
    private Double taxRate;
    private Double unitPrice;
    private Integer minStockLevel;
    private String uom;                 // Unit of Measurement e.g. "Strips", "Vials"
    private String packingType;         // e.g. "Strip of 10 Tablets"
    private String createdAt;
    
    @Transient
    private Integer initialStock;

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }

    public String getCategoryType() { return categoryType; }
    public void setCategoryType(String categoryType) { this.categoryType = categoryType; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }

    public Double getTaxRate() { return taxRate; }
    public void setTaxRate(Double taxRate) { this.taxRate = taxRate; }

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

    public Integer getMinStockLevel() { return minStockLevel; }
    public void setMinStockLevel(Integer minStockLevel) { this.minStockLevel = minStockLevel; }

    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }

    public String getPackingType() { return packingType; }
    public void setPackingType(String packingType) { this.packingType = packingType; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public Integer getInitialStock() { return initialStock; }
    public void setInitialStock(Integer initialStock) { this.initialStock = initialStock; }
}
