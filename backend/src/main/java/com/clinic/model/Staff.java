package com.clinic.model;

import jakarta.persistence.*;

@Entity
@Table(name = "staffs")
public class Staff {

    @Id
    private String id;
    private String name;
    private String role;
    private String department;
    private String contact;
    private String email;
    private String employeeId;
    private String shift;
    private String joiningDate;
    private String status = "Active";
    private Double salary = 0.0;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String v) { this.name = v; }

    public String getRole() { return role; }
    public void setRole(String v) { this.role = v; }

    public String getDepartment() { return department; }
    public void setDepartment(String v) { this.department = v; }

    public String getContact() { return contact; }
    public void setContact(String v) { this.contact = v; }

    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String v) { this.employeeId = v; }

    public String getShift() { return shift; }
    public void setShift(String v) { this.shift = v; }

    public String getJoiningDate() { return joiningDate; }
    public void setJoiningDate(String v) { this.joiningDate = v; }

    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }

    public Double getSalary() { return salary; }
    public void setSalary(Double v) { this.salary = v != null ? v : 0.0; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String v) { this.createdAt = v; }
}
