package com.financeflow.recurring.dto;

import com.financeflow.recurring.entity.PaymentOccurrenceStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PaymentOccurrenceResponse(

        UUID id,

        UUID recurringPaymentId,

        String recurringPaymentName,


        LocalDate dueDate,

        BigDecimal expectedAmount,

        BigDecimal actualAmount,
        String currency,

        PaymentOccurrenceStatus status,


        UUID paidTransactionId,

        Instant createdAt

) {
}