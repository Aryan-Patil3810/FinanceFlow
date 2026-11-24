package com.financeflow.payment.dto;

import com.financeflow.payment.entity.PaymentMethodType;

import java.time.Instant;
import java.util.UUID;

public class PaymentMethodResponse {

    private UUID id;
    private String name;
    private PaymentMethodType methodType;
    private Instant createdAt;

    public PaymentMethodResponse(
            UUID id,
            String name,
            PaymentMethodType methodType,
            Instant createdAt
    ) {
        this.id = id;
        this.name = name;
        this.methodType = methodType;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public PaymentMethodType getMethodType() {
        return methodType;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}