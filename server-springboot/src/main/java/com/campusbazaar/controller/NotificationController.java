package com.campusbazaar.controller;

import com.campusbazaar.model.Notification;
import com.campusbazaar.security.CurrentUser;
import com.campusbazaar.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    @GetMapping
    public Map<String, Object> list(@AuthenticationPrincipal CurrentUser me) {
        return service.listForUser(me.getId());
    }

    @PutMapping("/read-all")
    public Map<String, String> markAllRead(@AuthenticationPrincipal CurrentUser me) {
        service.markAllRead(me.getId());
        return Map.of("message", "All marked as read");
    }

    @PutMapping("/{id}/read")
    public Notification markRead(@AuthenticationPrincipal CurrentUser me, @PathVariable String id) {
        return service.markRead(me.getId(), id);
    }
}
