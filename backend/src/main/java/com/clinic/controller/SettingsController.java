package com.clinic.controller;

import com.clinic.model.AppSetting;
import com.clinic.model.ClinicInfo;
import com.clinic.repository.AppSettingRepository;
import com.clinic.repository.ClinicInfoRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final ClinicInfoRepository clinicRepo;
    private final AppSettingRepository appSettingRepo;

    public SettingsController(ClinicInfoRepository clinicRepo, AppSettingRepository appSettingRepo) {
        this.clinicRepo = clinicRepo;
        this.appSettingRepo = appSettingRepo;
    }

    // --- Clinic Info Endpoints ---

    @GetMapping("/clinic-info")
    public ClinicInfo getClinicInfo() {
        return clinicRepo.findById("1").orElseGet(() -> {
            ClinicInfo defaultInfo = new ClinicInfo();
            defaultInfo.setName("Aarogya Hospital");
            defaultInfo.setRegNo("MH/2024/8829");
            defaultInfo.setAddress("12, Healthcare Lane, Bengaluru - 560001");
            defaultInfo.setPhone("+91 80 1234 5678");
            defaultInfo.setGstin("29AAACA1234A1Z8");
            defaultInfo.setEmail("info@aarogya.in");
            return defaultInfo;
        });
    }

    @PutMapping("/clinic-info")
    public ClinicInfo updateClinicInfo(@RequestBody ClinicInfo info) {
        info.setId("1");
        return clinicRepo.save(info);
    }

    // --- Generic App Settings Endpoints ---

    @GetMapping("/{key}")
    public AppSetting getSetting(@PathVariable String key) {
        return appSettingRepo.findById(key).orElse(null);
    }

    @PutMapping("/{key}")
    public AppSetting updateSetting(@PathVariable String key, @RequestBody AppSetting setting) {
        setting.setSettingKey(key);
        return appSettingRepo.save(setting);
    }
}
