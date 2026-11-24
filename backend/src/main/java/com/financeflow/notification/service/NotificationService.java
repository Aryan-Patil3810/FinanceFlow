package com.financeflow.notification.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.financeflow.notification.dto.NotificationResponse;
import com.financeflow.notification.entity.Notification;
import com.financeflow.notification.enums.NotificationType;
import com.financeflow.notification.repository.NotificationRepository;
import com.financeflow.user.entity.User;
import com.financeflow.user.repository.UserRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    // Create a notification
    @Transactional
    public NotificationResponse createNotification(
            UUID userId,
            String title,
            String message,
            NotificationType type,
            String referenceType,
            UUID referenceId,
            String deduplicationKey) {

        if (deduplicationKey != null &&
                notificationRepository.existsByUserIdAndDeduplicationKey(
                        userId, deduplicationKey)) {
            return null;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Notification notification = new Notification();

        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setNotificationType(type);
        notification.setReferenceType(referenceType);
        notification.setReferenceId(referenceId);
        notification.setDeduplicationKey(deduplicationKey);
        notification.setRead(false);

        return mapToResponse(notificationRepository.save(notification));
    }

    // Get notification history
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(UUID userId) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // Get unread notification count
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository
                .countByUserIdAndIsReadFalse(userId);
    }

    // Mark one notification as read
    @Transactional
    public NotificationResponse markAsRead(
            UUID notificationId, UUID userId) {

        Notification notification = notificationRepository
                .findByIdAndUserId(notificationId, userId)
                .orElseThrow(() ->
                        new RuntimeException("Notification not found"));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
        }

        return mapToResponse(notificationRepository.save(notification));
    }

    // Mark all notifications as read
    @Transactional
    public int markAllAsRead(UUID userId) {
        return notificationRepository.markAllAsRead(userId);
    }

    private NotificationResponse mapToResponse(
            Notification notification) {

        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getNotificationType(),
                notification.getReferenceType(),
                notification.getReferenceId(),
                notification.isRead(),
                notification.getReadAt(),
                notification.getCreatedAt()
        );
    }
}