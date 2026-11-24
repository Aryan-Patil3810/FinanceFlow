package com.financeflow.recurring.dto;

import com.financeflow.recurring.entity.RecurringFrequency;
import com.financeflow.recurring.entity.RecurringPaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RecurringPaymentResponse(
        UUID id,
        String name,
        BigDecimal amount,
        String currency,
        UUID categoryId,
        UUID accountId,
        UUID paymentMethodId,
        RecurringFrequency frequency,
        LocalDate startDate,
        LocalDate endDate,
        RecurringPaymentStatus status,
        String notes,
        Instant createdAt
) {
}