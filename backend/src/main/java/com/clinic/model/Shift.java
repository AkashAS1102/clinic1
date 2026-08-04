package com.clinic.model;

import jakarta.persistence.*;

@Entity
@Table(name = "shifts")
public class Shift {

    @Id
    private String id;
    private String employeeId;
    private String employeeName;
    private String role;
    private String shiftType;
    private String startTime;
    private String endTime;
    private String date;
    private Double hoursWorked = 0.0;
    private String status = "Scheduled";
    private String notes;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String v) { this.employeeId = v; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String v) { this.employeeName = v; }

    public String getRole() { return role; }
    public void setRole(String v) { this.role = v; }

    public String getShiftType() { return shiftType; }
    public void setShiftType(String v) { this.shiftType = v; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String v) { this.startTime = v; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String v) { this.endTime = v; }

    public String getDate() { return date; }
    public void setDate(String v) { this.date = v; }

    public Double getHoursWorked() { return hoursWorked; }
    public void setHoursWorked(Double v) { this.hoursWorked = v != null ? v : 0.0; }

    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }

    public String getNotes() { return notes; }
    public void setNotes(String v) { this.notes = v; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String v) { this.createdAt = v; }
}
