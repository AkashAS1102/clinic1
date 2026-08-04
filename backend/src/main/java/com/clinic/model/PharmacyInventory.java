package com.clinic.model;

import jakarta.persistence.*;

@Entity
@Table(name = "pharmacy_inventory")
public class PharmacyInventory {

    @Id
    private String id;
    private String name;
    private String generic;
    private String category;
    private String manufacturer;
    private String batchNumber;
    private String expiryDate;
    private Integer stock = 0;
    private Integer minThreshold = 0;
    private String unit;
    private Double costPrice = 0.0;
    private Double sellingPrice = 0.0;
    private String supplier;
    private String location;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String v) { this.name = v; }

    public String getGeneric() { return generic; }
    public void setGeneric(String v) { this.generic = v; }

    public String getCategory() { return category; }
    public void setCategory(String v) { this.category = v; }

    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String v) { this.manufacturer = v; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String v) { this.batchNumber = v; }

    public String getExpiryDate() { return expiryDate; }
    public void setExpiryDate(String v) { this.expiryDate = v; }

    public Integer getStock() { return stock; }
    public void setStock(Integer v) { this.stock = v != null ? v : 0; }

    public Integer getMinThreshold() { return minThreshold; }
    public void setMinThreshold(Integer v) { this.minThreshold = v != null ? v : 0; }

    public String getUnit() { return unit; }
    public void setUnit(String v) { this.unit = v; }

    public Double getCostPrice() { return costPrice; }
    public void setCostPrice(Double v) { this.costPrice = v != null ? v : 0.0; }

    public Double getSellingPrice() { return sellingPrice; }
    public void setSellingPrice(Double v) { this.sellingPrice = v != null ? v : 0.0; }

    public String getSupplier() { return supplier; }
    public void setSupplier(String v) { this.supplier = v; }

    public String getLocation() { return location; }
    public void setLocation(String v) { this.location = v; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String v) { this.createdAt = v; }
}
