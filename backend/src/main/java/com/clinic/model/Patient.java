package com.clinic.model;

import com.clinic.converter.StringListConverter;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "patients")
public class Patient {

    @Id
    private String id;
    private String regNo;
    private String phone;
    private String fullName;
    private String dob;
    private String gender;
    private String address;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String bloodGroup;

    @Column(name = "allergies", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> allergies = new ArrayList<>();

    private String conditions;
    private String referringDoctor;
    private String photoUrl;
    private String lastVisit;
    private String createdAt;

    private String maritalStatus;
    private String govtId;
    private String occupation;
    private String guardianName;
    private String patientCategory;
    private String insuranceProvider;
    private String policyNumber;
    private String registeredBy;
    private String status;

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRegNo() { return regNo; }
    public void setRegNo(String regNo) { this.regNo = regNo; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String v) { this.emergencyContactName = v; }

    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String v) { this.emergencyContactPhone = v; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String v) { this.bloodGroup = v; }

    public List<String> getAllergies() { return allergies; }
    public void setAllergies(List<String> v) { this.allergies = v != null ? v : new ArrayList<>(); }

    public String getConditions() { return conditions; }
    public void setConditions(String v) { this.conditions = v; }

    public String getReferringDoctor() { return referringDoctor; }
    public void setReferringDoctor(String v) { this.referringDoctor = v; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String v) { this.photoUrl = v; }

    public String getLastVisit() { return lastVisit; }
    public void setLastVisit(String v) { this.lastVisit = v; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String v) { this.createdAt = v; }

    public String getMaritalStatus() { return maritalStatus; }
    public void setMaritalStatus(String v) { this.maritalStatus = v; }

    public String getGovtId() { return govtId; }
    public void setGovtId(String v) { this.govtId = v; }

    public String getOccupation() { return occupation; }
    public void setOccupation(String v) { this.occupation = v; }

    public String getGuardianName() { return guardianName; }
    public void setGuardianName(String v) { this.guardianName = v; }

    public String getPatientCategory() { return patientCategory; }
    public void setPatientCategory(String v) { this.patientCategory = v; }

    public String getInsuranceProvider() { return insuranceProvider; }
    public void setInsuranceProvider(String v) { this.insuranceProvider = v; }

    public String getPolicyNumber() { return policyNumber; }
    public void setPolicyNumber(String v) { this.policyNumber = v; }

    public String getRegisteredBy() { return registeredBy; }
    public void setRegisteredBy(String v) { this.registeredBy = v; }

    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
}
