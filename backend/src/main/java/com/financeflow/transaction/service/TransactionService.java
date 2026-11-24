
package com.financeflow.transaction.service;

import com.financeflow.account.entity.Account;
import com.financeflow.account.entity.AccountStatus;
import com.financeflow.account.repository.AccountRepository;

import com.financeflow.category.entity.Category;
import com.financeflow.category.entity.CategoryStatus;
import com.financeflow.category.repository.CategoryRepository;

import com.financeflow.payment.entity.PaymentMethod;
import com.financeflow.payment.repository.PaymentMethodRepository;

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

@Service
public class TransactionService {

    private final FinancialTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final PaymentMethodRepository paymentMethodRepository;

    public TransactionService(
            FinancialTransactionRepository transactionRepository,
            UserRepository userRepository,
            AccountRepository accountRepository,
            CategoryRepository categoryRepository,
            PaymentMethodRepository paymentMethodRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.paymentMethodRepository = paymentMethodRepository;
    }

    // CREATE TRANSACTION

    @Transactional
    public TransactionResponse createTransaction(
            UUID userId,
            CreateTransactionRequest request
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        // Validate account ownership.

        if (request.getAccountId() == null) {
            throw new IllegalArgumentException("Account is required");
        }

        Account account = accountRepository
                .findByIdAndUser_Id(request.getAccountId(), userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Account not found"));

        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalArgumentException(
                    "Cannot create transactions for an archived account"
            );
        }

        // Validate category ownership.
        // Shared system categories (user == null) are allowed.

        if (request.getCategoryId() != null) {

            Category category = categoryRepository
                    .findById(request.getCategoryId())
                    .orElseThrow(() ->
                            new IllegalArgumentException("Category not found"));

            boolean systemCategory = category.getUser() == null;

            boolean ownedCategory = !systemCategory
                    && category.getUser().getId().equals(userId);

            if (!systemCategory && !ownedCategory) {
                throw new IllegalArgumentException(
                        "Category does not belong to this user"
                );
            }

            if (category.getStatus() != CategoryStatus.ACTIVE) {
                throw new IllegalArgumentException(
                        "Cannot use an archived category"
                );
            }
        }

        // Validate payment method ownership.

        if (request.getPaymentMethodId() != null) {

            PaymentMethod paymentMethod = paymentMethodRepository
                    .findById(request.getPaymentMethodId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Payment method not found"
                            ));

            if (paymentMethod.getUser() == null
                    || !paymentMethod.getUser().getId().equals(userId)) {

                throw new IllegalArgumentException(
                        "Payment method does not belong to this user"
                );
            }
        }

        // Validate currency.

        String accountCurrency =
                normalizeCurrency(account.getCurrency());

        String requestedCurrency =
                normalizeCurrency(request.getCurrency());

        if (!accountCurrency.equals(requestedCurrency)) {
            throw new IllegalArgumentException(
                    "Transaction currency must match the selected account currency: "
                            + accountCurrency
            );
        }

        // Validate transaction amount.

        if (request.getAmount() == null
                || request.getAmount().signum() <= 0) {

            throw new IllegalArgumentException(
                    "Transaction amount must be greater than zero"
            );
        }

        if (request.getType() == null) {
            throw new IllegalArgumentException(
                    "Transaction type is required"
            );
        }

        if (request.getTransactionDate() == null) {
            throw new IllegalArgumentException(
                    "Transaction date is required"
            );
        }

        // Create transaction.

        FinancialTransaction transaction = new FinancialTransaction();

        transaction.setUser(user);
        transaction.setAccount(account);

        transaction.setCategoryId(request.getCategoryId());
        transaction.setPaymentMethodId(request.getPaymentMethodId());

        transaction.setType(request.getType());
        transaction.setAmount(request.getAmount());

        // Use account's authoritative currency.
        transaction.setCurrency(accountCurrency);

        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setDescription(request.getDescription());
        transaction.setNotes(request.getNotes());

        FinancialTransaction savedTransaction =
                transactionRepository.save(transaction);

        return toResponse(savedTransaction);
    }

    // GET TRANSACTIONS FOR AUTHENTICATED USER

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactions(UUID userId) {

        userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        return transactionRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // CURRENCY NORMALIZATION

    private String normalizeCurrency(String currency) {

        if (currency == null || currency.isBlank()) {
            throw new IllegalArgumentException(
                    "Currency is required"
            );
        }

        String normalized =
                currency.trim().toUpperCase(Locale.ROOT);

        if (!normalized.matches("[A-Z]{3}")) {
            throw new IllegalArgumentException(
                    "Invalid currency code"
            );
        }

        return normalized;
    }

    // TRANSACTION RESPONSE MAPPER

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
