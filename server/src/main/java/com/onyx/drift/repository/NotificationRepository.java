package com.onyx.drift.repository;

import com.onyx.drift.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // এই মেথডটি মিসিং ছিল, যা নোটিফিকেশনগুলো সময় অনুযায়ী সাজিয়ে নিয়ে আসবে
    List<Notification> findByRecipientOrderByCreatedAtDesc(String recipient);
}