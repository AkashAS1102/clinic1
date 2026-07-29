package com.clinic.model;

import com.clinic.converter.BooleanToIntConverter;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.LinkedHashMap;
import java.util.Map;

@Entity
@Table(name = "nurse_queue")
public class NurseQueue {

    @Id
    private String token;
    private String patientId;
    private String patientName;
    private String gender;
    private Integer age;
    private String doctorName;
    private String status = "Pending";

    // Vitals — stored as flat columns, also exposed as nested "vitals" object in JSON
    private String bp          = "";
    private String pulse       = "";
    private String temp        = "";
    private String weight      = "";
    private String height      = "";
    private String bmi         = "";
    private String spo2        = "";
    private String rbs         = "";
    private String chiefComplaint = "";
    private String nurseNotes  = "";

    @Column(name = "sentToDoctor")
    @Convert(converter = BooleanToIntConverter.class)
    private Boolean sentToDoctor = false;

    private String createdAt;

    // ── Computed vitals map (JSON only — not a DB column) ─────────────────────
    @JsonProperty("vitals")
    public Map<String, String> getVitals() {
        Map<String, String> v = new LinkedHashMap<>();
        v.put("bp",    s(bp));
        v.put("pulse", s(pulse));
        v.put("temp",  s(temp));
        v.put("weight",s(weight));
        v.put("height",s(height));
        v.put("bmi",   s(bmi));
        v.put("spo2",  s(spo2));
        v.put("rbs",   s(rbs));
        return v;
    }

    private static String s(String val) { return val != null ? val : ""; }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getToken() { return token; }
    public void setToken(String v) { this.token = v; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String v) { this.patientId = v; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String v) { this.patientName = v; }

    public String getGender() { return gender; }
    public void setGender(String v) { this.gender = v; }

    public Integer getAge() { return age; }
    public void setAge(Integer v) { this.age = v; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String v) { this.doctorName = v; }

    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }

    public String getBp() { return s(bp); }
    public void setBp(String v) { this.bp = v; }

    public String getPulse() { return s(pulse); }
    public void setPulse(String v) { this.pulse = v; }

    public String getTemp() { return s(temp); }
    public void setTemp(String v) { this.temp = v; }

    public String getWeight() { return s(weight); }
    public void setWeight(String v) { this.weight = v; }

    public String getHeight() { return s(height); }
    public void setHeight(String v) { this.height = v; }

    public String getBmi() { return s(bmi); }
    public void setBmi(String v) { this.bmi = v; }

    public String getSpo2() { return s(spo2); }
    public void setSpo2(String v) { this.spo2 = v; }

    public String getRbs() { return s(rbs); }
    public void setRbs(String v) { this.rbs = v; }

    public String getChiefComplaint() { return s(chiefComplaint); }
    public void setChiefComplaint(String v) { this.chiefComplaint = v; }

    public String getNurseNotes() { return s(nurseNotes); }
    public void setNurseNotes(String v) { this.nurseNotes = v; }

    public Boolean getSentToDoctor() { return sentToDoctor != null && sentToDoctor; }
    public void setSentToDoctor(Boolean v) { this.sentToDoctor = v != null && v; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String v) { this.createdAt = v; }
}
