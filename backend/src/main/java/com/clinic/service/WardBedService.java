package com.clinic.service;

import com.clinic.model.*;
import com.clinic.repository.*;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class WardBedService {

    private final WardRepository wardRepo;
    private final RoomRepository roomRepo;
    private final BedRepository bedRepo;
    private final BedAllocationRepository allocationRepo;

    public WardBedService(WardRepository wardRepo, RoomRepository roomRepo, BedRepository bedRepo, BedAllocationRepository allocationRepo) {
        this.wardRepo = wardRepo;
        this.roomRepo = roomRepo;
        this.bedRepo = bedRepo;
        this.allocationRepo = allocationRepo;
    }

    public void bulkGenerate(Map<String, Object> payload) {
        String wardId = (String) payload.get("wardId");
        String prefix = (String) payload.get("prefix");
        Integer startNumber = (Integer) payload.get("startNumber");
        Integer count = (Integer) payload.get("count");
        String roomType = (String) payload.get("roomType");
        Double baseTariff = Double.valueOf(payload.get("baseTariff").toString());

        for (int i = 0; i < count; i++) {
            Room room = new Room();
            room.setId("RM-" + System.currentTimeMillis() + "-" + i);
            room.setWardId(wardId);
            room.setRoomNumber(prefix + (startNumber + i));
            room.setRoomType(roomType);
            room.setBaseTariff(baseTariff);
            room.setHasOxygen(true);
            room.setIsNegativePressure(false);
            roomRepo.save(room);

            Bed bed = new Bed();
            bed.setId("BED-" + System.currentTimeMillis() + "-" + i);
            bed.setRoomId(room.getId());
            bed.setBedCode(room.getRoomNumber() + "-A");
            bed.setStatus("AVAILABLE");
            bed.setIsActive(true);
            bedRepo.save(bed);
        }
    }

    public Map<String, Object> getBedsMatrix() {
        Map<String, Object> matrix = new HashMap<>();
        matrix.put("wards", wardRepo.findAll());
        matrix.put("rooms", roomRepo.findAll());
        matrix.put("beds", bedRepo.findAll());
        return matrix;
    }

    public void transferBed(String bedId, Map<String, String> payload) {
        // Implement transfer logic: find current allocation, close it, create new.
    }
}
