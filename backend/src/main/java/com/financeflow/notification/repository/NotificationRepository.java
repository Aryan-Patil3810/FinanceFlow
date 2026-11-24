package com.financeflow.notification.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;

import com.financeflow.notification.entity.Notification;

public interface NotificationRepository
        extends JpaRepository<Notification, UUID> {

    // Fetch all notifications for a user, newest first
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

    // Fetch unread notifications
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(
            UUID userId
    );

    // Count unread notifications
    long countByUserIdAndIsReadFalse(UUID userId);

    // Find a notification belonging to a specific user
    Optional<Notification> findByIdAndUserId(
            UUID notificationId,
            UUID userId
    );

    // Check whether a notification already exists
    boolean existsByUserIdAndDeduplicationKey(
            UUID userId,
            String deduplicationKey
    );

    // Mark all unread notifications as read

    @Modifying(
            clearAutomatically = true,
            flushAutomatically = true
    )
    @Query("""
        UPDATE Notification n
        SET n.isRead = true,
            n.readAt = CURRENT_TIMESTAMP
        WHERE n.user.id = :userId
          AND n.isRead = false
    """)
    int markAllAsRead(@Param("userId") UUID userId);
}