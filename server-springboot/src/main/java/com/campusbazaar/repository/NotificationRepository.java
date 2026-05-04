package com.campusbazaar.repository;

import com.campusbazaar.model.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserOrderByCreatedAtDesc(String user, Pageable pageable);
    long countByUserAndReadFalse(String user);
    List<Notification> findByUserAndReadFalse(String user);
}
