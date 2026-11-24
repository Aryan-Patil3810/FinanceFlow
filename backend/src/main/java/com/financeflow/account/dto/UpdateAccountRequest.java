package com.financeflow.account.dto;

import com.financeflow.account.entity.AccountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class UpdateAccountRequest {

    @NotBlank
    @Size(max = 150)
    private String name;

    @NotNull
    private AccountType accountType;

    @NotBlank
    @Size(min = 3, max = 3)
    private String currency;

    @NotNull
    @DecimalMin(value = "0.0")
    private BigDecimal openingBalance;

    @NotNull
    private LocalDate openingBalanceDate;

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

    public LocalDate getOpeningBalanceDate() {
        return openingBalanceDate;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setAccountType(AccountType accountType) {
        this.accountType = accountType;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public void setOpeningBalance(BigDecimal openingBalance) {
        this.openingBalance = openingBalance;
    }

    public void setOpeningBalanceDate(LocalDate openingBalanceDate) {
        this.openingBalanceDate = openingBalanceDate;
    }
}