package com.clinic.model;

import com.clinic.converter.StringListConverter;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "nurses")
public class Nurse {

    @Id
    private String id;
    private String name;
    private String employeeId;
    private String department;
    private String qualification;
    private String contact;
    private String email;
    private String shift;

    @Column(name = "availableDays", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> availableDays = new ArrayList<>();

    private String licenseNumber;
    private String experience;
    private String status = "Active";
    private String joiningDate;
    private String photoUrl;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String v) { this.name = v; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String v) { this.employeeId = v; }

    public String getDepartment() { return department; }
    public void setDepartment(String v) { this.department = v; }

    public String getQualification() { return qualification; }
    public void setQualification(String v) { this.qualification = v; }

    public String getContact() { return contact; }
    public void setContact(String v) { this.contact = v; }

    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }

    public String getShift() { return shift; }
    public void setShift(String v) { this.shift = v; }

    public List<String> getAvailableDays() { return availableDays; }
    public void setAvailableDays(List<String> v) { this.availableDays = v != null ? v : new ArrayList<>(); }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String v) { this.licenseNumber = v; }

    public String getExperience() { return experience; }
    public void setExperience(String v) { this.experience = v; }

    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }

    public String getJoiningDate() { return joiningDate; }
    public void setJoiningDate(String v) { this.joiningDate = v; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String v) { this.photoUrl = v; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String v) { this.createdAt = v; }
}
