package com.onyx.drift.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String recipient; // কাকে পাঠানো হচ্ছে
    private String sender;    // কে পাঠাচ্ছে
    private String message;   // মেসেজ (যেমন: "user1 followed you")
    private String type;      // "FOLLOW", "LIKE", "MENTION"
    private boolean isRead = false;
    private LocalDateTime createdAt = LocalDateTime.now();
}