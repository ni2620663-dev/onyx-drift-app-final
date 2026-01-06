package com.onyx.drift.controller;

import com.onyx.drift.model.Notification;
import com.onyx.drift.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/{username}")
    public List<Notification> getNotifications(@PathVariable String username) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(username);
    }
}