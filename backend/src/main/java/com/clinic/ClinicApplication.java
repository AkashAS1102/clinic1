package com.clinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ClinicApplication {
    public static void main(String[] args) {
        System.out.println("\n\uD83C\uDFE5  Clinic Backend (Java / Spring Boot) starting...");
        SpringApplication.run(ClinicApplication.class, args);
        System.out.println("\u2705  Ready at http://localhost:8080/api/health\n");
    }
}
