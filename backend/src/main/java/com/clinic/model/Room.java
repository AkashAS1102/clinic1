package com.clinic.model;

import jakarta.persistence.*;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    private String id;
    private String roomNumber;
    private String ward;
    private String type;
    private String status = "Available";
    private String patientId;
    private String patientName;
    private String assignedDoctor;
    private String assignedNurse;
    private String admissionDate;
    private String bed;
    private String floor;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String v) { this.roomNumber = v; }

    public String getWard() { return ward; }
    public void setWard(String v) { this.ward = v; }

    public String getType() { return type; }
    public void setType(String v) { this.type = v; }

    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String v) { this.patientId = v; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String v) { this.patientName = v; }

    public String getAssignedDoctor() { return assignedDoctor; }
    public void setAssignedDoctor(String v) { this.assignedDoctor = v; }

    public String getAssignedNurse() { return assignedNurse; }
    public void setAssignedNurse(String v) { this.assignedNurse = v; }

    public String getAdmissionDate() { return admissionDate; }
    public void setAdmissionDate(String v) { this.admissionDate = v; }

    public String getBed() { return bed; }
    public void setBed(String v) { this.bed = v; }

    public String getFloor() { return floor; }
    public void setFloor(String v) { this.floor = v; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String v) { this.createdAt = v; }
}
