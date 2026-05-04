package com.campusbazaar.service;

import com.campusbazaar.exception.ApiException;
import com.campusbazaar.model.Notification;
import com.campusbazaar.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repo;

    public Notification create(String userId, Notification.Type type, String title, String body, String link) {
        return repo.save(Notification.builder()
                .user(userId).type(type).title(title).body(body).link(link).read(false).build());
    }

    public Map<String, Object> listForUser(String userId) {
        List<Notification> items = repo.findByUserOrderByCreatedAtDesc(userId, PageRequest.of(0, 50));
        long unread = repo.countByUserAndReadFalse(userId);
        Map<String, Object> out = new HashMap<>();
        out.put("items", items);
        out.put("unread", unread);
        return out;
    }

    public Notification markRead(String userId, String id) {
        Notification n = repo.findById(id).orElseThrow(() -> ApiException.notFound("Notification not found"));
        if (!n.getUser().equals(userId)) throw ApiException.forbidden("Not yours");
        n.setRead(true);
        return repo.save(n);
    }

    public void markAllRead(String userId) {
        List<Notification> unread = repo.findByUserAndReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        repo.saveAll(unread);
    }
}
