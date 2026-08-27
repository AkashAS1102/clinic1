package com.clinic.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "beds")
public class Bed {
    @Id
    private String id;
    private String roomId;
    private String bedCode;
    private String status; // AVAILABLE, RESERVED, OCCUPIED, DISCHARGE_PENDING, HOUSEKEEPING_REQUIRED, MAINTENANCE
    private Boolean isActive;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }
    public String getBedCode() { return bedCode; }
    public void setBedCode(String bedCode) { this.bedCode = bedCode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    private String capabilityTags; // JSON string
    
    public String getCapabilityTags() { return capabilityTags; }
    public void setCapabilityTags(String capabilityTags) { this.capabilityTags = capabilityTags; }
}
