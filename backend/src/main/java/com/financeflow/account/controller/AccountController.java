package com.financeflow.account.controller;

import java.util.List;
import com.financeflow.account.dto.UpdateAccountRequest;
import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.dto.CreateAccountRequest;
import com.financeflow.account.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(
            @RequestParam UUID userId,
            @Valid @RequestBody CreateAccountRequest request
    ) {
        AccountResponse response =
                accountService.createAccount(userId, request);

        return ResponseEntity.status(201).body(response);
    }
    @GetMapping
    public ResponseEntity<List<AccountResponse>> getAccounts(
            @RequestParam UUID userId
    ) {
        List<AccountResponse> accounts = accountService.getAccounts(userId);
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{accountId}")
    public ResponseEntity<AccountResponse> getAccount(
            @PathVariable UUID accountId
    ) {
        AccountResponse response = accountService.getAccount(accountId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{accountId}")
    public ResponseEntity<AccountResponse> updateAccount(
            @PathVariable UUID accountId,
            @Valid @RequestBody UpdateAccountRequest request
    ) {
        AccountResponse response = accountService.updateAccount(accountId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{accountId}/archive")
    public ResponseEntity<AccountResponse> archiveAccount(
            @PathVariable UUID accountId
    ) {
        AccountResponse response = accountService.archiveAccount(accountId);
        return ResponseEntity.ok(response);
    }
}