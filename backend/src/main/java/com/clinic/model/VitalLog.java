package com.clinic.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "vital_logs")
public class VitalLog {
    @Id
    private String id;
    private String admissionId;
    private String recordedByNurseId;
    private String timestamp;
    private Integer systolicBp;
    private Integer diastolicBp;
    private Integer heartRate;
    private Integer respiratoryRate;
    private Integer spo2;
    private Double temperature;
    private Double bloodSugar;
    private Integer mewsScore;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAdmissionId() { return admissionId; }
    public void setAdmissionId(String admissionId) { this.admissionId = admissionId; }
    public String getRecordedByNurseId() { return recordedByNurseId; }
    public void setRecordedByNurseId(String recordedByNurseId) { this.recordedByNurseId = recordedByNurseId; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public Integer getSystolicBp() { return systolicBp; }
    public void setSystolicBp(Integer systolicBp) { this.systolicBp = systolicBp; }
    public Integer getDiastolicBp() { return diastolicBp; }
    public void setDiastolicBp(Integer diastolicBp) { this.diastolicBp = diastolicBp; }
    public Integer getHeartRate() { return heartRate; }
    public void setHeartRate(Integer heartRate) { this.heartRate = heartRate; }
    public Integer getRespiratoryRate() { return respiratoryRate; }
    public void setRespiratoryRate(Integer respiratoryRate) { this.respiratoryRate = respiratoryRate; }
    public Integer getSpo2() { return spo2; }
    public void setSpo2(Integer spo2) { this.spo2 = spo2; }
    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }
    public Double getBloodSugar() { return bloodSugar; }
    public void setBloodSugar(Double bloodSugar) { this.bloodSugar = bloodSugar; }
    public Integer getMewsScore() { return mewsScore; }
    public void setMewsScore(Integer mewsScore) { this.mewsScore = mewsScore; }
}
