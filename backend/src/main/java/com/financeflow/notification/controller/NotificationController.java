package com.financeflow.notification.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.financeflow.notification.dto.NotificationResponse;
import com.financeflow.notification.service.NotificationService;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // Get notification history
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestParam UUID userId) {

        return ResponseEntity.ok(
                notificationService.getNotifications(userId)
        );
    }

    // Get unread notification count
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestParam UUID userId) {

        return ResponseEntity.ok(
                Map.of("unreadCount",
                        notificationService.getUnreadCount(userId))
        );
    }

    // Mark one notification as read
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable UUID notificationId,
            @RequestParam UUID userId) {

        return ResponseEntity.ok(
                notificationService.markAsRead(notificationId, userId)
        );
    }

    // Mark all notifications as read
    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllAsRead(
            @RequestParam UUID userId) {

        int updatedCount = notificationService.markAllAsRead(userId);

        return ResponseEntity.ok(
                Map.of("updatedCount", updatedCount)
        );
    }
}