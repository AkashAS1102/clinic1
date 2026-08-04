package com.clinic.model;

import jakarta.persistence.*;

@Entity
@Table(name = "payroll")
public class Payroll {

    @Id
    private String id;
    private String employeeId;
    private String employeeName;
    private String role;
    private String department;
    private Double basicSalary = 0.0;
    private Double allowances = 0.0;
    private Double deductions = 0.0;
    private Double netSalary = 0.0;
    private String month;
    private String year;
    private String status = "Pending";
    private String paidDate;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String v) { this.employeeId = v; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String v) { this.employeeName = v; }

    public String getRole() { return role; }
    public void setRole(String v) { this.role = v; }

    public String getDepartment() { return department; }
    public void setDepartment(String v) { this.department = v; }

    public Double getBasicSalary() { return basicSalary; }
    public void setBasicSalary(Double v) { this.basicSalary = v != null ? v : 0.0; }

    public Double getAllowances() { return allowances; }
    public void setAllowances(Double v) { this.allowances = v != null ? v : 0.0; }

    public Double getDeductions() { return deductions; }
    public void setDeductions(Double v) { this.deductions = v != null ? v : 0.0; }

    public Double getNetSalary() { return netSalary; }
    public void setNetSalary(Double v) { this.netSalary = v != null ? v : 0.0; }

    public String getMonth() { return month; }
    public void setMonth(String v) { this.month = v; }

    public String getYear() { return year; }
    public void setYear(String v) { this.year = v; }

    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }

    public String getPaidDate() { return paidDate; }
    public void setPaidDate(String v) { this.paidDate = v; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String v) { this.createdAt = v; }
}
