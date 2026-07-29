package com.clinic.repository;

import com.clinic.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, String> {
    List<Appointment> findAllByOrderByCreatedAtDesc();
    /** Count appointments for a given doctor on a given date — used for token generation. */
    long countByDoctorIdAndDate(String doctorId, String date);
}
