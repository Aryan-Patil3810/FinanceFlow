
package com.financeflow.transaction.service;

import com.financeflow.account.entity.Account;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.transaction.dto.CreateTransactionRequest;
import com.financeflow.transaction.dto.TransactionResponse;
import com.financeflow.transaction.entity.FinancialTransaction;
import com.financeflow.transaction.repository.FinancialTransactionRepository;
import com.financeflow.user.entity.User;
import com.financeflow.user.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final FinancialTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    public TransactionService(
            FinancialTransactionRepository transactionRepository,
            UserRepository userRepository,
            AccountRepository accountRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public TransactionResponse createTransaction(
            UUID userId,
            CreateTransactionRequest request
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Account not found"));

        if (!account.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "Account does not belong to this user"
            );
        }

        String accountCurrency = normalizeCurrency(account.getCurrency());
        String requestedCurrency = normalizeCurrency(request.getCurrency());

        if (!accountCurrency.equals(requestedCurrency)) {
            throw new IllegalArgumentException(
                    "Transaction currency must match the selected account currency: "
                            + accountCurrency
            );
        }

        FinancialTransaction transaction = new FinancialTransaction();

        transaction.setUser(user);
        transaction.setAccount(account);
        transaction.setCategoryId(request.getCategoryId());
        transaction.setPaymentMethodId(request.getPaymentMethodId());
        transaction.setType(request.getType());
        transaction.setAmount(request.getAmount());

        // Always use the account's authoritative currency.
        transaction.setCurrency(accountCurrency);

        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setDescription(request.getDescription());
        transaction.setNotes(request.getNotes());

        FinancialTransaction savedTransaction =
                transactionRepository.save(transaction);

        return toResponse(savedTransaction);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactions(UUID userId) {

        userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        return transactionRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private String normalizeCurrency(String currency) {

        if (currency == null || currency.isBlank()) {
            throw new IllegalArgumentException(
                    "Currency is required"
            );
        }

        String normalized = currency.trim().toUpperCase(Locale.ROOT);

        if (!normalized.matches("[A-Z]{3}")) {
            throw new IllegalArgumentException(
                    "Invalid currency code"
            );
        }

        return normalized;
    }

    private TransactionResponse toResponse(
            FinancialTransaction transaction
    ) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getAccount().getId(),
                transaction.getCategoryId(),
                transaction.getPaymentMethodId(),
                transaction.getType(),
                transaction.getAmount(),
                transaction.getCurrency().trim(),
                transaction.getTransactionDate(),
                transaction.getDescription(),
                transaction.getNotes(),
                transaction.getCreatedAt()
        );
    }
}
