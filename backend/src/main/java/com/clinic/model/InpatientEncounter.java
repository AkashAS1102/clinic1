package com.clinic.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "inpatient_encounters")
public class InpatientEncounter {

    @Id
    private String encounterId;
    private String patientId;
    private String admittingDocId;
    private String bedId;
    private LocalDateTime admissionTime;
    private LocalDateTime dischargeTime;
    private String status; // Pending_Admit, Admitted, Pending_Discharge, Discharged
    private String priority;
    private String requiredSpecialty;
    private String requiredBedTags;
    private String admittingDiagnosis;
    private LocalDateTime expectedDischargeDate;

    // Getters and Setters
    public String getEncounterId() { return encounterId; }
    public void setEncounterId(String encounterId) { this.encounterId = encounterId; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getAdmittingDocId() { return admittingDocId; }
    public void setAdmittingDocId(String admittingDocId) { this.admittingDocId = admittingDocId; }

    public String getBedId() { return bedId; }
    public void setBedId(String bedId) { this.bedId = bedId; }

    public LocalDateTime getAdmissionTime() { return admissionTime; }
    public void setAdmissionTime(LocalDateTime admissionTime) { this.admissionTime = admissionTime; }

    public LocalDateTime getDischargeTime() { return dischargeTime; }
    public void setDischargeTime(LocalDateTime dischargeTime) { this.dischargeTime = dischargeTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getRequiredSpecialty() { return requiredSpecialty; }
    public void setRequiredSpecialty(String requiredSpecialty) { this.requiredSpecialty = requiredSpecialty; }

    public String getRequiredBedTags() { return requiredBedTags; }
    public void setRequiredBedTags(String requiredBedTags) { this.requiredBedTags = requiredBedTags; }

    public String getAdmittingDiagnosis() { return admittingDiagnosis; }
    public void setAdmittingDiagnosis(String admittingDiagnosis) { this.admittingDiagnosis = admittingDiagnosis; }

    public LocalDateTime getExpectedDischargeDate() { return expectedDischargeDate; }
    public void setExpectedDischargeDate(LocalDateTime expectedDischargeDate) { this.expectedDischargeDate = expectedDischargeDate; }
}
