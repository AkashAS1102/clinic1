package com.clinic.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "pharmacy_queue")
public class PharmacyPrescription {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    private String id;
    private String token;
    private String patientId;
    private String patientName;
    private Integer age;
    private String doctorName;
    private String status = "Pending";
    private String allergies;
    private String diagnosis;

    @JsonIgnore
    @Column(name = "items", columnDefinition = "TEXT")
    private String itemsJson = "[]";

    private Double totalAmount = 0.0;
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

    public String getToken() { return token; }
    public void setToken(String v) { this.token = v; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String v) { this.patientId = v; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String v) { this.patientName = v; }

    public Integer getAge() { return age; }
    public void setAge(Integer v) { this.age = v; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String v) { this.doctorName = v; }

    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String v) { this.allergies = v; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String v) { this.diagnosis = v; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double v) { this.totalAmount = v != null ? v : 0.0; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String v) { this.createdAt = v; }
}
