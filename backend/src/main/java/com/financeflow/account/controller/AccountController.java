
package com.financeflow.account.controller;

import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.dto.CreateAccountRequest;
import com.financeflow.account.dto.UpdateAccountRequest;
import com.financeflow.account.service.AccountService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    private UUID getAuthenticatedUserId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateAccountRequest request
    ) {
        UUID userId = getAuthenticatedUserId(jwt);

        AccountResponse response =
                accountService.createAccount(userId, request);

        return ResponseEntity.status(201).body(response);
    }

    @GetMapping
    public ResponseEntity<List<AccountResponse>> getAccounts(
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID userId = getAuthenticatedUserId(jwt);

        List<AccountResponse> accounts =
                accountService.getAccounts(userId);

        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{accountId}")
    public ResponseEntity<AccountResponse> getAccount(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID accountId
    ) {
        UUID userId = getAuthenticatedUserId(jwt);

        AccountResponse response =
                accountService.getAccount(userId, accountId);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{accountId}")
    public ResponseEntity<AccountResponse> updateAccount(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID accountId,
            @Valid @RequestBody UpdateAccountRequest request
    ) {
        UUID userId = getAuthenticatedUserId(jwt);

        AccountResponse response =
                accountService.updateAccount(userId, accountId, request);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{accountId}/archive")
    public ResponseEntity<AccountResponse> archiveAccount(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID accountId
    ) {
        UUID userId = getAuthenticatedUserId(jwt);

        AccountResponse response =
                accountService.archiveAccount(userId, accountId);

        return ResponseEntity.ok(response);
    }
}
