
package com.financeflow.payment.controller;

import com.financeflow.payment.dto.CreatePaymentMethodRequest;
import com.financeflow.payment.dto.PaymentMethodResponse;
import com.financeflow.payment.dto.UpdatePaymentMethodRequest;
import com.financeflow.payment.service.PaymentMethodService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreatePaymentMethodRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());

        PaymentMethodResponse response =
                paymentMethodService.createPaymentMethod(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<PaymentMethodResponse>> getPaymentMethods(
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());

        return ResponseEntity.ok(
                paymentMethodService.getPaymentMethods(userId)
        );
    }

    @PutMapping("/{paymentMethodId}")
    public ResponseEntity<PaymentMethodResponse> updatePaymentMethod(
            @PathVariable UUID paymentMethodId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdatePaymentMethodRequest request
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());

        PaymentMethodResponse response =
                paymentMethodService.updatePaymentMethod(
                        paymentMethodId,
                        userId,
                        request
                );

        return ResponseEntity.ok(response);
    }
}
