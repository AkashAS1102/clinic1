package com.clinic.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "pharmacy_bills")
public class PharmacyBill {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    private String id;
    private String rxId;
    private String patientName;
    private String patientId;
    private String date;
    private Integer itemsCount = 0;
    private Double subtotal = 0.0;
    private Double gst = 0.0;
    private Double discount = 0.0;
    private Double total = 0.0;
    private String paymentMethod;
    private String status = "Paid";

    @JsonIgnore
    @Column(name = "items", columnDefinition = "TEXT")
    private String itemsJson = "[]";

    private String returnReason;
    private String createdAt;

    @JsonProperty("items")
    public List<Object> getItems() {
        try {
            return MAPPER.readValue(itemsJson != null ? itemsJson : "[]", new TypeReference<List<Object>>(){});
        } catch (Exception e) { return Collections.emptyList(); }
    }

    @JsonProperty("items")
    public void setItems(List<Object> list) {
        try {
            this.itemsJson = MAPPER.writeValueAsString(list != null ? list : Collections.emptyList());
        } catch (Exception e) { this.itemsJson = "[]"; }
    }

    public String getItemsJson() { return itemsJson; }
    public void setItemsJson(String v) { this.itemsJson = v != null ? v : "[]"; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRxId() { return rxId; }
    public void setRxId(String v) { this.rxId = v; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String v) { this.patientName = v; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String v) { this.patientId = v; }

    public String getDate() { return date; }
    public void setDate(String v) { this.date = v; }

    public Integer getItemsCount() { return itemsCount; }
    public void setItemsCount(Integer v) { this.itemsCount = v != null ? v : 0; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double v) { this.subtotal = v != null ? v : 0.0; }

    public Double getGst() { return gst; }
    public void setGst(Double v) { this.gst = v != null ? v : 0.0; }

    public Double getDiscount() { return discount; }
    public void setDiscount(Double v) { this.discount = v != null ? v : 0.0; }

    public Double getTotal() { return total; }
    public void setTotal(Double v) { this.total = v != null ? v : 0.0; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String v) { this.paymentMethod = v; }

    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }

    public String getReturnReason() { return returnReason; }
    public void setReturnReason(String v) { this.returnReason = v; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String v) { this.createdAt = v; }
}
