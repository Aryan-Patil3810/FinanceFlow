package com.financeflow.payment.dto;

import com.financeflow.payment.entity.PaymentMethodType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreatePaymentMethodRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotNull
    private PaymentMethodType methodType;

    public String getName() {
        return name;
    }

    public PaymentMethodType getMethodType() {
        return methodType;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setMethodType(PaymentMethodType methodType) {
        this.methodType = methodType;
    }
}