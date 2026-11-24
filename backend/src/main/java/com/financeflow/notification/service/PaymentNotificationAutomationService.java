
package com.financeflow.notification.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.financeflow.notification.enums.NotificationType;
import com.financeflow.recurring.entity.PaymentOccurrence;
import com.financeflow.recurring.entity.PaymentOccurrenceStatus;
import com.financeflow.recurring.repository.PaymentOccurrenceRepository;

@Service
public class PaymentNotificationAutomationService {

    private static final ZoneId INDIA_ZONE =
            ZoneId.of("Asia/Kolkata");

    private final PaymentOccurrenceRepository occurrenceRepository;
    private final NotificationService notificationService;

    public PaymentNotificationAutomationService(
            PaymentOccurrenceRepository occurrenceRepository,
            NotificationService notificationService) {

        this.occurrenceRepository = occurrenceRepository;
        this.notificationService = notificationService;
    }

    // Notify users one day before payment is due
    @Transactional
    public int generatePaymentDueNotifications() {

        LocalDate tomorrow = LocalDate.now(INDIA_ZONE).plusDays(1);

        List<PaymentOccurrence> occurrences =
                occurrenceRepository.findByStatusAndDueDate(
                        PaymentOccurrenceStatus.UPCOMING,
                        tomorrow
                );

        int created = 0;

        for (PaymentOccurrence occurrence : occurrences) {

            var recurringPayment = occurrence.getRecurringPayment();

            UUID userId = recurringPayment.getUser().getId();

            String paymentName = recurringPayment.getName();

            String title = "Payment Due Tomorrow";

            String message = paymentName
                    + " payment of "
                    + occurrence.getExpectedAmount().toPlainString()
                    + " is due tomorrow ("
                    + occurrence.getDueDate()
                    + ").";

            var result = notificationService.createNotification(
                    userId,
                    title,
                    message,
                    NotificationType.PAYMENT_DUE,
                    "PAYMENT_OCCURRENCE",
                    occurrence.getId(),
                    "PAYMENT_DUE:" + occurrence.getId()
            );

            if (result != null) {
                created++;
            }
        }

        return created;
    }

    // Notify users about missed payments
    @Transactional
    public int generateOverdueNotifications() {

        LocalDate today = LocalDate.now(INDIA_ZONE);

        List<PaymentOccurrence> occurrences =
                occurrenceRepository.findByStatusAndDueDateBefore(
                        PaymentOccurrenceStatus.MISSED,
                        today
                );

        int created = 0;

        for (PaymentOccurrence occurrence : occurrences) {

            var recurringPayment = occurrence.getRecurringPayment();

            UUID userId = recurringPayment.getUser().getId();

            String paymentName = recurringPayment.getName();

            String title = "Payment Overdue";

            String message = paymentName
                    + " payment of "
                    + occurrence.getExpectedAmount().toPlainString()
                    + " was due on "
                    + occurrence.getDueDate()
                    + " and is still unpaid.";

            var result = notificationService.createNotification(
                    userId,
                    title,
                    message,
                    NotificationType.PAYMENT_OVERDUE,
                    "PAYMENT_OCCURRENCE",
                    occurrence.getId(),
                    "PAYMENT_OVERDUE:" + occurrence.getId()
            );

            if (result != null) {
                created++;
            }
        }

        return created;
    }
}
