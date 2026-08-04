package com.clinic.repository;

import com.clinic.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, String> {
    List<Room> findAllByOrderByCreatedAtDesc();
}
