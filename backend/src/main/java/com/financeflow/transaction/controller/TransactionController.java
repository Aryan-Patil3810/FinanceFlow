package com.financeflow.transaction.controller;

import java.util.List;
import com.financeflow.transaction.dto.CreateTransactionRequest;
import com.financeflow.transaction.dto.TransactionResponse;
import com.financeflow.transaction.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
            @RequestParam UUID userId,
            @Valid @RequestBody CreateTransactionRequest request
    ) {
        TransactionResponse response =
                transactionService.createTransaction(userId, request);

        return ResponseEntity.status(201).body(response);
    }
    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getTransactions(
            @RequestParam UUID userId
    ) {
        List<TransactionResponse> transactions =
                transactionService.getTransactions(userId);

        return ResponseEntity.ok(transactions);
    }
}