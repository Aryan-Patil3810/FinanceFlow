package com.financeflow.notification.dto;

import java.time.Instant;
import java.util.UUID;

import com.financeflow.notification.enums.NotificationType;

public record NotificationResponse(
        UUID id,
        String title,
        String message,
        NotificationType notificationType,
        String referenceType,
        UUID referenceId,
        boolean isRead,
        Instant readAt,
        Instant createdAt
) {
}