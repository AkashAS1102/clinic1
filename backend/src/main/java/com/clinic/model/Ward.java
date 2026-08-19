package com.clinic.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "wards")
public class Ward {
    @Id
    private String id;
    private String name;
    private String block;
    private String floor;
    private String category; // ICU, NICU, GENERAL, DELUXE
    private String genderCompatibility;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBlock() { return block; }
    public void setBlock(String block) { this.block = block; }
    public String getFloor() { return floor; }
    public void setFloor(String floor) { this.floor = floor; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getGenderCompatibility() { return genderCompatibility; }
    public void setGenderCompatibility(String genderCompatibility) { this.genderCompatibility = genderCompatibility; }
}
