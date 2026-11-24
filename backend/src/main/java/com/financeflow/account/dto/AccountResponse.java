package com.financeflow.account.dto;

import com.financeflow.account.entity.AccountType;
import com.financeflow.account.entity.AccountStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class AccountResponse {

    private UUID id;
    private String name;
    private AccountType accountType;
    private String currency;
    private BigDecimal openingBalance;
    private BigDecimal currentBalance;
    private LocalDate openingBalanceDate;
    private AccountStatus status;
    private Instant createdAt;

    public AccountResponse(
            UUID id,
            String name,
            AccountType accountType,
            String currency,
            BigDecimal openingBalance,
            BigDecimal currentBalance,
            LocalDate openingBalanceDate,
            AccountStatus status,
            Instant createdAt
    ) {
        this.id = id;
        this.name = name;
        this.accountType = accountType;
        this.currency = currency;
        this.openingBalance = openingBalance;
        this.currentBalance = currentBalance;
        this.openingBalanceDate = openingBalanceDate;
        this.status = status;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public AccountType getAccountType() {
        return accountType;
    }

    public String getCurrency() {
        return currency;
    }

    public BigDecimal getOpeningBalance() {
        return openingBalance;
    }

    public BigDecimal getCurrentBalance() {
        return currentBalance;
    }

    public LocalDate getOpeningBalanceDate() {
        return openingBalanceDate;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}