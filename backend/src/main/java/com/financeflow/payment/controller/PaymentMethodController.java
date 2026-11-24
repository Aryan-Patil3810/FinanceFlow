package com.financeflow.payment.controller;

import com.financeflow.payment.dto.CreatePaymentMethodRequest;
import com.financeflow.payment.dto.PaymentMethodResponse;
import com.financeflow.payment.dto.UpdatePaymentMethodRequest;
import com.financeflow.payment.service.PaymentMethodService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payment-methods")
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

    public PaymentMethodController(
            PaymentMethodService paymentMethodService
    ) {
        this.paymentMethodService = paymentMethodService;
    }

    @PostMapping
    public ResponseEntity<PaymentMethodResponse> createPaymentMethod(
            @RequestParam UUID userId,
            @Valid @RequestBody CreatePaymentMethodRequest request
    ) {
        PaymentMethodResponse response =
                paymentMethodService.createPaymentMethod(userId, request);

        return ResponseEntity.status(201).body(response);
    }

    @GetMapping
    public ResponseEntity<List<PaymentMethodResponse>> getPaymentMethods(
            @RequestParam UUID userId
    ) {
        return ResponseEntity.ok(
                paymentMethodService.getPaymentMethods(userId)
        );
    }

    @PutMapping("/{paymentMethodId}")
    public ResponseEntity<PaymentMethodResponse> updatePaymentMethod(
            @PathVariable UUID paymentMethodId,
            @RequestParam UUID userId,
            @Valid @RequestBody UpdatePaymentMethodRequest request
    ) {
        PaymentMethodResponse response =
                paymentMethodService.updatePaymentMethod(
                        paymentMethodId,
                        userId,
                        request
                );

        return ResponseEntity.ok(response);
    }
}