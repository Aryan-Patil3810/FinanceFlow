package com.financeflow.user.dto;

import java.time.Instant;
import java.util.UUID;

public class UserResponse {

    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String baseCurrency;
    private Instant createdAt;

    public UserResponse(
            UUID id,
            String email,
            String firstName,
            String lastName,
            String baseCurrency,
            Instant createdAt
    ) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.baseCurrency = baseCurrency;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getBaseCurrency() {
        return baseCurrency;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}