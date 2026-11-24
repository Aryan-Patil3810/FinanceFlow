
package com.financeflow.recurring.scheduler;

import com.financeflow.notification.service.PaymentNotificationAutomationService;
import com.financeflow.recurring.service.PaymentOccurrenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PaymentOccurrenceScheduler {

    private static final Logger logger =
            LoggerFactory.getLogger(PaymentOccurrenceScheduler.class);

    private final PaymentOccurrenceService occurrenceService;
    private final PaymentNotificationAutomationService notificationAutomationService;

    public PaymentOccurrenceScheduler(
            PaymentOccurrenceService occurrenceService, PaymentNotificationAutomationService notificationAutomationService
    ) {
        this.occurrenceService = occurrenceService;
        this.notificationAutomationService = notificationAutomationService;
    }

    // Runs every day at 2:00 AM Indian Standard Time.
    @Scheduled(cron = "0 0 2 * * *", zone = "Asia/Kolkata")
    public void generateDailyOccurrences() {

        logger.info("Starting daily payment occurrence generation");

        try {
            int generated =
                    occurrenceService.generateUpcomingOccurrencesForAllUsers(30);

            int dueNotifications =
                    notificationAutomationService.generatePaymentDueNotifications();

            int overdueNotifications =
                    notificationAutomationService.generateOverdueNotifications();

            logger.info("Payment due notifications created: {}", dueNotifications);
            logger.info("Overdue notifications created: {}", overdueNotifications);

            logger.info(
                    "Daily payment occurrence generation completed. Generated: {}",
                    generated
            );

        } catch (Exception exception) {
            logger.error(
                    "Daily payment occurrence generation failed",
                    exception
            );
        }
    }
}
