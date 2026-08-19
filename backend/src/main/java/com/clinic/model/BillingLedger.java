package com.clinic.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "billing_ledgers")
public class BillingLedger {
    @Id
    private String id;
    private String admissionId;
    private String chargeCategory; // ROOM_RENT, NURSING, DOCTOR_ROUND, PHARMACY, LAB_TEST, OT_SURGERY
    private String description;
    private Double unitPrice;
    private Integer quantity;
    private Double totalAmount;
    private Boolean isInsuranceCovered;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAdmissionId() { return admissionId; }
    public void setAdmissionId(String admissionId) { this.admissionId = admissionId; }
    public String getChargeCategory() { return chargeCategory; }
    public void setChargeCategory(String chargeCategory) { this.chargeCategory = chargeCategory; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public Boolean getIsInsuranceCovered() { return isInsuranceCovered; }
    public void setIsInsuranceCovered(Boolean isInsuranceCovered) { this.isInsuranceCovered = isInsuranceCovered; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
