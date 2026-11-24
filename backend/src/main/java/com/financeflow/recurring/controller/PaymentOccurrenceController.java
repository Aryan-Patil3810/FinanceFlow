package com.financeflow.recurring.controller;

import com.financeflow.recurring.dto.PaymentOccurrenceResponse;
import com.financeflow.recurring.service.PaymentOccurrenceService;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payment-occurrences")
public class PaymentOccurrenceController {

    private final PaymentOccurrenceService occurrenceService;

    public PaymentOccurrenceController(
            PaymentOccurrenceService occurrenceService
    ) {
        this.occurrenceService = occurrenceService;
    }

    @PostMapping
    public ResponseEntity<PaymentOccurrenceResponse> createOccurrence(
            @RequestParam UUID userId,
            @RequestParam UUID recurringPaymentId,
            @RequestParam
            @NotNull
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dueDate
    ) {

        return ResponseEntity.status(201).body(
                occurrenceService.createOccurrence(
                        userId,
                        recurringPaymentId,
                        dueDate
                )
        );
    }

    @GetMapping
    public ResponseEntity<List<PaymentOccurrenceResponse>> getOccurrences(
            @RequestParam UUID userId
    ) {

        return ResponseEntity.ok(
                occurrenceService.getOccurrences(userId)
        );
    }

    @GetMapping("/{occurrenceId}")
    public ResponseEntity<PaymentOccurrenceResponse> getOccurrence(
            @PathVariable UUID occurrenceId,
            @RequestParam UUID userId
    ) {

        return ResponseEntity.ok(
                occurrenceService.getOccurrence(
                        userId,
                        occurrenceId
                )
        );
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<PaymentOccurrenceResponse>>
    getUpcomingOccurrences(

            @RequestParam UUID userId,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {

        return ResponseEntity.ok(
                occurrenceService.getUpcomingOccurrences(
                        userId,
                        startDate,
                        endDate
                )
        );
    }

    @PatchMapping("/{occurrenceId}/paid")
    public ResponseEntity<PaymentOccurrenceResponse> markAsPaid(

            @PathVariable UUID occurrenceId,

            @RequestParam UUID userId,

            @RequestParam
            @DecimalMin("0.01")
            Double actualAmount
    ) {

        return ResponseEntity.ok(
                occurrenceService.markAsPaid(
                        userId,
                        occurrenceId,
                        actualAmount
                )
        );
    }

    @PatchMapping("/{occurrenceId}/skip")
    public ResponseEntity<PaymentOccurrenceResponse> skipOccurrence(

            @PathVariable UUID occurrenceId,

            @RequestParam UUID userId
    ) {

        return ResponseEntity.ok(
                occurrenceService.skipOccurrence(
                        userId,
                        occurrenceId
                )
        );
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateUpcomingOccurrences(
            @RequestParam UUID userId,
            @RequestParam(defaultValue = "30") int daysAhead
    ) {
        int generated =
                occurrenceService.generateUpcomingOccurrences(
                        userId,
                        daysAhead
                );

        return ResponseEntity.ok(
                Map.of(
                        "generated", generated,
                        "daysAhead", daysAhead
                )
        );
    }
}