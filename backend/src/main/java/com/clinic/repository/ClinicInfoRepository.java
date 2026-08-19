package com.clinic.repository;

import com.clinic.model.ClinicInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClinicInfoRepository extends JpaRepository<ClinicInfo, String> {
}
