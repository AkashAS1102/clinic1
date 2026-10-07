package com.clinic.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name="unified_bills")
public class UnifiedBill {
    @Id
    private String id;
    private String sourceType;
    private String sourceId;
    private String patientId;
    private String patientName;
    private String doctorName;
    private String department;
    private String date;
    
    private Double totalAmount = 0.0;
    private Double subtotal = 0.0;
    private Double gst = 0.0;
    private Double discount = 0.0;
    
    private String paymentMethod;
    private String status = "Pending";
    private String paidAt;
    
    @Column(columnDefinition="TEXT")
    private String notes;
    private String createdAt;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }
    public Double getGst() { return gst; }
    public void setGst(Double gst) { this.gst = gst; }
    public Double getDiscount() { return discount; }
    public void setDiscount(Double discount) { this.discount = discount; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPaidAt() { return paidAt; }
    public void setPaidAt(String paidAt) { this.paidAt = paidAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
