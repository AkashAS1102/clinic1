package com.clinic.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "rooms")
public class Room {
    @Id
    private String id;
    private String wardId;
    private String roomNumber;
    private String roomType;
    private Double baseTariff;
    private Boolean hasOxygen;
    private Boolean isNegativePressure;

    // Added to map with frontend Room management UI correctly
    private String roomNo;
    private String bedNo;
    private String type;
    private String block;
    private String floor;
    private String ward;
    private Double price;
    private String status;
    private String patientId;
    private String patientName;
    private String assignedDoctor;
    private String assignedNurse;
    private String admissionDate;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getWardId() { return wardId; }
    public void setWardId(String wardId) { this.wardId = wardId; }
    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    public String getRoomType() { return roomType; }
    public void setRoomType(String roomType) { this.roomType = roomType; }
    public Double getBaseTariff() { return baseTariff; }
    public void setBaseTariff(Double baseTariff) { this.baseTariff = baseTariff; }
    public Boolean getHasOxygen() { return hasOxygen; }
    public void setHasOxygen(Boolean hasOxygen) { this.hasOxygen = hasOxygen; }
    public Boolean getIsNegativePressure() { return isNegativePressure; }
    public void setIsNegativePressure(Boolean isNegativePressure) { this.isNegativePressure = isNegativePressure; }

    public String getRoomNo() { return roomNo; }
    public void setRoomNo(String roomNo) { this.roomNo = roomNo; }
    public String getBedNo() { return bedNo; }
    public void setBedNo(String bedNo) { this.bedNo = bedNo; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getBlock() { return block; }
    public void setBlock(String block) { this.block = block; }
    public String getFloor() { return floor; }
    public void setFloor(String floor) { this.floor = floor; }
    public String getWard() { return ward; }
    public void setWard(String ward) { this.ward = ward; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getAssignedDoctor() { return assignedDoctor; }
    public void setAssignedDoctor(String assignedDoctor) { this.assignedDoctor = assignedDoctor; }
    public String getAssignedNurse() { return assignedNurse; }
    public void setAssignedNurse(String assignedNurse) { this.assignedNurse = assignedNurse; }
    public String getAdmissionDate() { return admissionDate; }
    public void setAdmissionDate(String admissionDate) { this.admissionDate = admissionDate; }
}
