package com.financeflow.recurring.repository;

import com.financeflow.recurring.entity.PaymentOccurrence;
import com.financeflow.recurring.entity.PaymentOccurrenceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PaymentOccurrenceRepository
        extends JpaRepository<PaymentOccurrence, UUID> {

    List<PaymentOccurrence> findByRecurringPaymentUserId(UUID userId);

    List<PaymentOccurrence> findByRecurringPaymentUserIdAndDueDateBetween(
            UUID userId,
            LocalDate startDate,
            LocalDate endDate
    );

    List<PaymentOccurrence>
    findByRecurringPaymentUserIdAndStatus(
            UUID userId,
            PaymentOccurrenceStatus status
    );
    // Find upcoming payments due on a specific date
    List<PaymentOccurrence> findByStatusAndDueDate(
            PaymentOccurrenceStatus status,
            LocalDate dueDate
    );

    // Find missed payments before a specific date
    List<PaymentOccurrence> findByStatusAndDueDateBefore(
            PaymentOccurrenceStatus status,
            LocalDate dueDate
    );

    boolean existsByRecurringPaymentIdAndDueDate(
            UUID recurringPaymentId,
            LocalDate dueDate
    );
}