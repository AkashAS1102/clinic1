package com.clinic.model;

import com.clinic.converter.StringListConverter;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    private String id;
    private String name;
    private String department;
    private String qualification;
    private String contact;
    private String email;

    @Column(name = "availableDays", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> availableDays = new ArrayList<>();

    private String timeSlot;
    private Double fee = 0.0;
    private String status = "Active";
    private String photoUrl;
    private String createdAt;

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDepartment() { return department; }
    public void setDepartment(String v) { this.department = v; }

    public String getQualification() { return qualification; }
    public void setQualification(String v) { this.qualification = v; }

    public String getContact() { return contact; }
    public void setContact(String v) { this.contact = v; }

    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }

    public List<String> getAvailableDays() { return availableDays; }
    public void setAvailableDays(List<String> v) { this.availableDays = v != null ? v : new ArrayList<>(); }

    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String v) { this.timeSlot = v; }

    public Double getFee() { return fee; }
    public void setFee(Double v) { this.fee = v != null ? v : 0.0; }

    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String v) { this.photoUrl = v; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String v) { this.createdAt = v; }
}
