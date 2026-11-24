
package com.financeflow.transaction.controller;

import com.financeflow.transaction.dto.CreateTransactionRequest;
import com.financeflow.transaction.dto.TransactionResponse;
import com.financeflow.transaction.service.TransactionService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    private UUID getAuthenticatedUserId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateTransactionRequest request
    ) {
        UUID userId = getAuthenticatedUserId(jwt);

        TransactionResponse response =
                transactionService.createTransaction(userId, request);

        return ResponseEntity.status(201).body(response);
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getTransactions(
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = getAuthenticatedUserId(jwt);

        List<TransactionResponse> transactions =
                transactionService.getTransactions(userId);

        return ResponseEntity.ok(transactions);
    }
}
