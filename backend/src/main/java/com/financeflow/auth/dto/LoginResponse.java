package com.financeflow.auth.dto;

import java.util.UUID;

public record LoginResponse(
        String token,
        UUID userId,
        String email,
        String firstName
) {
}