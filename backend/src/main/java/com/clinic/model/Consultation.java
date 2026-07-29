package com.clinic.model;

import com.clinic.converter.CsvListConverter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "consultations")
public class Consultation {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    private String id;
    private String patientId;
    private String patientName;
    private String token;
    private String diagnosis;
    private String scanType;
    private String scanNotes;

    /** Stored as comma-separated text, exposed as List<String> in JSON */
    @Column(name = "labTests", columnDefinition = "TEXT")
    @Convert(converter = CsvListConverter.class)
    private List<String> labTests = new ArrayList<>();

    private String nextVisitDate;
    private String nextVisitNotes;

    /** Raw JSON string in DB (e.g. '[{"medicine":"..."}]').
     *  Exposed via getPrescriptions() / setPrescriptions() for Jackson. */
    @JsonIgnore
    @Column(name = "prescriptions", columnDefinition = "TEXT")
    private String prescriptionsJson = "[]";

    private String status = "Active";
    private String createdAt;

    // ── Prescriptions bridge (List <-> JSON string) ───────────────────────────

    @JsonProperty("prescriptions")
    public List<Object> getPrescriptions() {
        try {
            String src = (prescriptionsJson != null) ? prescriptionsJson : "[]";
            return MAPPER.readValue(src, new TypeReference<List<Object>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @JsonProperty("prescriptions")
    public void setPrescriptions(List<Object> list) {
        try {
            this.prescriptionsJson = MAPPER.writeValueAsString(
                list != null ? list : Collections.emptyList()
            );
        } catch (Exception e) {
            this.prescriptionsJson = "[]";
        }
    }

    // Internal accessor for DataInitializer / tests
    public String getPrescriptionsJson() { return prescriptionsJson; }
    public void setPrescriptionsJson(String v) { this.prescriptionsJson = v != null ? v : "[]"; }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String v) { this.patientId = v; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String v) { this.patientName = v; }

    public String getToken() { return token; }
    public void setToken(String v) { this.token = v; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String v) { this.diagnosis = v; }

    public String getScanType() { return scanType; }
    public void setScanType(String v) { this.scanType = v; }

    public String getScanNotes() { return scanNotes; }
    public void setScanNotes(String v) { this.scanNotes = v; }

    public List<String> getLabTests() { return labTests; }
    public void setLabTests(List<String> v) { this.labTests = v != null ? v : new ArrayList<>(); }

    public String getNextVisitDate() { return nextVisitDate; }
    public void setNextVisitDate(String v) { this.nextVisitDate = v; }

    public String getNextVisitNotes() { return nextVisitNotes; }
    public void setNextVisitNotes(String v) { this.nextVisitNotes = v; }

    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String v) { this.createdAt = v; }
}
