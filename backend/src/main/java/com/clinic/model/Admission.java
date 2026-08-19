package com.clinic.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "admissions")
public class Admission {
    @Id
    private String id;
    private String patientId;
    private String admittingDoctorId;
    private String uhid;
    private String ipNumber;
    private String admissionDate;
    private String dischargeDate;
    private String acuityLevel; // CRITICAL, HIGH_DEPENDENCY, GENERAL, ISOLATION
    private String primaryDiagnosisIcd10;
    private String admissionStatus; // TRIAGE_PENDING, ADMITTED, DISCHARGE_IN_PROGRESS, DISCHARGED
    private Double depositAmount;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getAdmittingDoctorId() { return admittingDoctorId; }
    public void setAdmittingDoctorId(String admittingDoctorId) { this.admittingDoctorId = admittingDoctorId; }
    public String getUhid() { return uhid; }
    public void setUhid(String uhid) { this.uhid = uhid; }
    public String getIpNumber() { return ipNumber; }
    public void setIpNumber(String ipNumber) { this.ipNumber = ipNumber; }
    public String getAdmissionDate() { return admissionDate; }
    public void setAdmissionDate(String admissionDate) { this.admissionDate = admissionDate; }
    public String getDischargeDate() { return dischargeDate; }
    public void setDischargeDate(String dischargeDate) { this.dischargeDate = dischargeDate; }
    public String getAcuityLevel() { return acuityLevel; }
    public void setAcuityLevel(String acuityLevel) { this.acuityLevel = acuityLevel; }
    public String getPrimaryDiagnosisIcd10() { return primaryDiagnosisIcd10; }
    public void setPrimaryDiagnosisIcd10(String primaryDiagnosisIcd10) { this.primaryDiagnosisIcd10 = primaryDiagnosisIcd10; }
    public String getAdmissionStatus() { return admissionStatus; }
    public void setAdmissionStatus(String admissionStatus) { this.admissionStatus = admissionStatus; }
    public Double getDepositAmount() { return depositAmount; }
    public void setDepositAmount(Double depositAmount) { this.depositAmount = depositAmount; }
}
