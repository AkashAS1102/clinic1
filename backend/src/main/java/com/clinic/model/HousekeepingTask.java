package com.clinic.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "housekeeping_tasks")
public class HousekeepingTask {
    @Id
    private String id;
    private String bedId;
    private String assignedStaffId;
    private String status; // PENDING, IN_PROGRESS, COMPLETED
    private String qrScanStartAt;
    private String cleanedAt;
    private String inspectedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getBedId() { return bedId; }
    public void setBedId(String bedId) { this.bedId = bedId; }
    public String getAssignedStaffId() { return assignedStaffId; }
    public void setAssignedStaffId(String assignedStaffId) { this.assignedStaffId = assignedStaffId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getQrScanStartAt() { return qrScanStartAt; }
    public void setQrScanStartAt(String qrScanStartAt) { this.qrScanStartAt = qrScanStartAt; }
    public String getCleanedAt() { return cleanedAt; }
    public void setCleanedAt(String cleanedAt) { this.cleanedAt = cleanedAt; }
    public String getInspectedAt() { return inspectedAt; }
    public void setInspectedAt(String inspectedAt) { this.inspectedAt = inspectedAt; }
}
