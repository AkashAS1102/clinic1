package com.clinic.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;

@Entity
@Table(name = "ip_patients")
public class IpPatient {

    @Id
    private String id;
    
    private String patientId;
    private String patientName;
    private String age;
    private String gender;
    private String department;
    private String doctorName;
    private String admissionDate;
    private String status;
    private String dischargeDate;
    private String allocatedRoomId;
    private String allocatedRoomNo;
    
    private String allocatedRoomType;
    private String allocatedBlock;
    private String allocatedFloor;
    private String allocatedRoomPrice;
    private String admissionDateTime;
    private String expectedDischarge;
    private String allocatedBy;
    @Column(columnDefinition="TEXT")
    private String allocationNotes;
    private String admittingDoctor;
    private String careLevel;
    
    private Boolean isUrgent;
    private String admittingDiagnosis;
    @Column(columnDefinition="TEXT")
    private String diagnosis;
    private String ward;
    private String bedType;
    private String priority;
    private String estimatedDischargeDate;
    private String estimatedStay;
    @Column(columnDefinition="TEXT")
    private String admissionReason;
    
    private String bedTags;
    
    // I am skipping bedTags to avoid list serialization for now, frontend can ignore or we can save as String later if needed

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getAge() { return age; }
    public void setAge(String age) { this.age = age; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public String getAdmissionDate() { return admissionDate; }
    public void setAdmissionDate(String admissionDate) { this.admissionDate = admissionDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDischargeDate() { return dischargeDate; }
    public void setDischargeDate(String dischargeDate) { this.dischargeDate = dischargeDate; }
    public String getAllocatedRoomId() { return allocatedRoomId; }
    public void setAllocatedRoomId(String allocatedRoomId) { this.allocatedRoomId = allocatedRoomId; }
    public String getAllocatedRoomNo() { return allocatedRoomNo; }
    public void setAllocatedRoomNo(String allocatedRoomNo) { this.allocatedRoomNo = allocatedRoomNo; }
    public String getAllocatedRoomType() { return allocatedRoomType; }
    public void setAllocatedRoomType(String allocatedRoomType) { this.allocatedRoomType = allocatedRoomType; }
    public String getAllocatedBlock() { return allocatedBlock; }
    public void setAllocatedBlock(String allocatedBlock) { this.allocatedBlock = allocatedBlock; }
    public String getAllocatedFloor() { return allocatedFloor; }
    public void setAllocatedFloor(String allocatedFloor) { this.allocatedFloor = allocatedFloor; }
    public String getAllocatedRoomPrice() { return allocatedRoomPrice; }
    public void setAllocatedRoomPrice(String allocatedRoomPrice) { this.allocatedRoomPrice = allocatedRoomPrice; }
    public String getAdmissionDateTime() { return admissionDateTime; }
    public void setAdmissionDateTime(String admissionDateTime) { this.admissionDateTime = admissionDateTime; }
    public String getExpectedDischarge() { return expectedDischarge; }
    public void setExpectedDischarge(String expectedDischarge) { this.expectedDischarge = expectedDischarge; }
    public String getAllocatedBy() { return allocatedBy; }
    public void setAllocatedBy(String allocatedBy) { this.allocatedBy = allocatedBy; }
    public String getAllocationNotes() { return allocationNotes; }
    public void setAllocationNotes(String allocationNotes) { this.allocationNotes = allocationNotes; }
    public String getAdmittingDoctor() { return admittingDoctor; }
    public void setAdmittingDoctor(String admittingDoctor) { this.admittingDoctor = admittingDoctor; }
    public String getCareLevel() { return careLevel; }
    public void setCareLevel(String careLevel) { this.careLevel = careLevel; }
    public Boolean getIsUrgent() { return isUrgent; }
    public void setIsUrgent(Boolean isUrgent) { this.isUrgent = isUrgent; }
    public String getAdmittingDiagnosis() { return admittingDiagnosis; }
    public void setAdmittingDiagnosis(String admittingDiagnosis) { this.admittingDiagnosis = admittingDiagnosis; }
    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
    public String getWard() { return ward; }
    public void setWard(String ward) { this.ward = ward; }
    public String getBedType() { return bedType; }
    public void setBedType(String bedType) { this.bedType = bedType; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getEstimatedDischargeDate() { return estimatedDischargeDate; }
    public void setEstimatedDischargeDate(String estimatedDischargeDate) { this.estimatedDischargeDate = estimatedDischargeDate; }
    public String getEstimatedStay() { return estimatedStay; }
    public void setEstimatedStay(String estimatedStay) { this.estimatedStay = estimatedStay; }
    public String getAdmissionReason() { return admissionReason; }
    public void setAdmissionReason(String admissionReason) { this.admissionReason = admissionReason; }
    public String getBedTags() { return bedTags; }
    public void setBedTags(String bedTags) { this.bedTags = bedTags; }
}
