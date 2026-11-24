package com.financeflow.transaction.dto;

import com.financeflow.transaction.entity.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class TransactionResponse {

    private UUID id;
    private UUID accountId;
    private UUID categoryId;
    private UUID paymentMethodId;
    private TransactionType type;
    private BigDecimal amount;
    private String currency;
    private LocalDate transactionDate;
    private String description;
    private String notes;
    private Instant createdAt;

    public TransactionResponse(
            UUID id,
            UUID accountId,
            UUID categoryId,
            UUID paymentMethodId,
            TransactionType type,
            BigDecimal amount,
            String currency,
            LocalDate transactionDate,
            String description,
            String notes,
            Instant createdAt
    ) {
        this.id = id;
        this.accountId = accountId;
        this.categoryId = categoryId;
        this.paymentMethodId = paymentMethodId;
        this.type = type;
        this.amount = amount;
        this.currency = currency;
        this.transactionDate = transactionDate;
        this.description = description;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getAccountId() {
        return accountId;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public UUID getPaymentMethodId() {
        return paymentMethodId;
    }

    public TransactionType getType() {
        return type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public String getDescription() {
        return description;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}