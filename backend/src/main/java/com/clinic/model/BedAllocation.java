package com.clinic.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "bed_allocations")
public class BedAllocation {
    @Id
    private String id;
    private String admissionId;
    private String bedId;
    private String allocatedAt;
    private String releasedAt;
    private Double tariffPerDay;
    private String transferReason;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAdmissionId() { return admissionId; }
    public void setAdmissionId(String admissionId) { this.admissionId = admissionId; }
    public String getBedId() { return bedId; }
    public void setBedId(String bedId) { this.bedId = bedId; }
    public String getAllocatedAt() { return allocatedAt; }
    public void setAllocatedAt(String allocatedAt) { this.allocatedAt = allocatedAt; }
    public String getReleasedAt() { return releasedAt; }
    public void setReleasedAt(String releasedAt) { this.releasedAt = releasedAt; }
    public Double getTariffPerDay() { return tariffPerDay; }
    public void setTariffPerDay(Double tariffPerDay) { this.tariffPerDay = tariffPerDay; }
    public String getTransferReason() { return transferReason; }
    public void setTransferReason(String transferReason) { this.transferReason = transferReason; }
}
