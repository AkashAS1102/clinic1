package com.clinic.model;

import jakarta.persistence.*;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    private String id;
    private String patientId;
    private String patientName;
    private String doctorId;
    private String doctorName;
    private String department;
    private String date;
    private String timeSlot;
    private String reason;
    private String token;
    private String status = "Scheduled";
    private String createdAt;

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String v) { this.patientId = v; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String v) { this.patientName = v; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String v) { this.doctorId = v; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String v) { this.doctorName = v; }

    public String getDepartment() { return department; }
    public void setDepartment(String v) { this.department = v; }

    public String getDate() { return date; }
    public void setDate(String v) { this.date = v; }

    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String v) { this.timeSlot = v; }

    public String getReason() { return reason; }
    public void setReason(String v) { this.reason = v; }

    public String getToken() { return token; }
    public void setToken(String v) { this.token = v; }

    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String v) { this.createdAt = v; }
}
