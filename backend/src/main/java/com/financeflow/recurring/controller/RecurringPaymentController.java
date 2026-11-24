package com.financeflow.recurring.controller;

import com.financeflow.recurring.dto.CreateRecurringPaymentRequest;
import com.financeflow.recurring.dto.RecurringPaymentResponse;
import com.financeflow.recurring.dto.UpdateRecurringPaymentRequest;
import com.financeflow.recurring.entity.RecurringPaymentStatus;
import com.financeflow.recurring.service.RecurringPaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/recurring-payments")
public class RecurringPaymentController {

    private final RecurringPaymentService recurringPaymentService;

    public RecurringPaymentController(
            RecurringPaymentService recurringPaymentService
    ) {
        this.recurringPaymentService = recurringPaymentService;
    }

    @PostMapping
    public ResponseEntity<RecurringPaymentResponse> createRecurringPayment(
            @RequestParam UUID userId,
            @Valid @RequestBody CreateRecurringPaymentRequest request
    ) {

        RecurringPaymentResponse response =
                recurringPaymentService.createRecurringPayment(
                        userId,
                        request
                );

        return ResponseEntity.status(201).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RecurringPaymentResponse>> getRecurringPayments(
            @RequestParam UUID userId
    ) {

        return ResponseEntity.ok(
                recurringPaymentService.getRecurringPayments(userId)
        );
    }

    @GetMapping("/{recurringPaymentId}")
    public ResponseEntity<RecurringPaymentResponse> getRecurringPayment(
            @PathVariable UUID recurringPaymentId
    ) {

        return ResponseEntity.ok(
                recurringPaymentService.getRecurringPayment(
                        recurringPaymentId
                )
        );
    }

    @PutMapping("/{recurringPaymentId}")
    public ResponseEntity<RecurringPaymentResponse> updateRecurringPayment(
            @PathVariable UUID recurringPaymentId,
            @Valid @RequestBody UpdateRecurringPaymentRequest request
    ) {

        return ResponseEntity.ok(
                recurringPaymentService.updateRecurringPayment(
                        recurringPaymentId,
                        request
                )
        );
    }

    @PatchMapping("/{recurringPaymentId}/status")
    public ResponseEntity<RecurringPaymentResponse> updateStatus(
            @PathVariable UUID recurringPaymentId,
            @RequestParam RecurringPaymentStatus status
    ) {

        return ResponseEntity.ok(
                recurringPaymentService.updateStatus(
                        recurringPaymentId,
                        status
                )
        );
    }
}