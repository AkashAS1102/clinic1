package com.clinic.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "central_bills")
public class CentralBill {
    @Id
    private String id;
    private String rxId;
    private String patientName;
    private String patientId;
    private String date;
    private String type;
    private Double totalAmount;
    private String status;
    private String paymentMethod;
    private String paidAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRxId() { return rxId; }
    public void setRxId(String rxId) { this.rxId = rxId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaidAt() { return paidAt; }
    public void setPaidAt(String paidAt) { this.paidAt = paidAt; }
}
