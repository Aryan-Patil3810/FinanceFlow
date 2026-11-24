package com.financeflow.account.service;

import com.financeflow.account.dto.AccountResponse;
import com.financeflow.account.dto.CreateAccountRequest;
import com.financeflow.account.dto.UpdateAccountRequest;
import com.financeflow.account.entity.Account;
import com.financeflow.account.entity.AccountStatus;
import com.financeflow.account.repository.AccountRepository;

import com.financeflow.transaction.entity.FinancialTransaction;
import com.financeflow.transaction.entity.TransactionType;
import com.financeflow.transaction.repository.FinancialTransactionRepository;

import com.financeflow.transfer.entity.Transfer;
import com.financeflow.transfer.repository.TransferRepository;

import com.financeflow.user.entity.User;
import com.financeflow.user.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final FinancialTransactionRepository transactionRepository;
    private final TransferRepository transferRepository;

    public AccountService(
            AccountRepository accountRepository,
            UserRepository userRepository,
            FinancialTransactionRepository transactionRepository,
            TransferRepository transferRepository
    ) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.transferRepository = transferRepository;
    }

    // =========================
    // CREATE ACCOUNT
    // =========================

    @Transactional
    public AccountResponse createAccount(
            UUID userId,
            CreateAccountRequest request
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        if (accountRepository.existsByUserIdAndNameIgnoreCase(
                userId,
                request.getName()
        )) {
            throw new IllegalArgumentException(
                    "Account name is already registered for this user"
            );
        }

        Account account = new Account();

        account.setUser(user);
        account.setName(request.getName());
        account.setAccountType(request.getAccountType());
        account.setCurrency(request.getCurrency());
        account.setOpeningBalance(request.getOpeningBalance());
        account.setOpeningBalanceDate(request.getOpeningBalanceDate());
        account.setStatus(AccountStatus.ACTIVE);

        Account savedAccount = accountRepository.save(account);

        return toResponse(savedAccount);
    }

    // =========================
    // GET ALL ACCOUNTS
    // =========================

    @Transactional(readOnly = true)
    public List<AccountResponse> getAccounts(UUID userId) {

        userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        return accountRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================
    // GET SINGLE ACCOUNT
    // =========================

    @Transactional(readOnly = true)
    public AccountResponse getAccount(UUID accountId) {

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Account not found"));

        return toResponse(account);
    }

    // =========================
    // UPDATE ACCOUNT
    // =========================

    @Transactional
    public AccountResponse updateAccount(
            UUID accountId,
            UpdateAccountRequest request
    ) {

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Account not found"));

        if (!account.getName().equalsIgnoreCase(request.getName())
                && accountRepository.existsByUserIdAndNameIgnoreCase(
                account.getUser().getId(),
                request.getName()
        )) {

            throw new IllegalArgumentException(
                    "Account name is already registered for this user"
            );
        }

        account.setName(request.getName());
        account.setAccountType(request.getAccountType());
        account.setCurrency(request.getCurrency());
        account.setOpeningBalance(request.getOpeningBalance());
        account.setOpeningBalanceDate(request.getOpeningBalanceDate());

        Account updatedAccount = accountRepository.save(account);

        return toResponse(updatedAccount);
    }

    // =========================
    // ARCHIVE ACCOUNT
    // =========================

    @Transactional
    public AccountResponse archiveAccount(UUID accountId) {

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Account not found"));

        if (account.getStatus() == AccountStatus.ARCHIVED) {
            throw new IllegalArgumentException(
                    "Account is already archived"
            );
        }

        account.setStatus(AccountStatus.ARCHIVED);

        Account archivedAccount = accountRepository.save(account);

        return toResponse(archivedAccount);
    }

    // =========================
    // ACCOUNT RESPONSE MAPPER
    // =========================

    private AccountResponse toResponse(Account account) {

        BigDecimal currentBalance = calculateCurrentBalance(account);

        return new AccountResponse(
                account.getId(),
                account.getName(),
                account.getAccountType(),
                account.getCurrency(),
                account.getOpeningBalance(),
                currentBalance,
                account.getOpeningBalanceDate(),
                account.getStatus(),
                account.getCreatedAt()
        );
    }

    // =========================
    // CURRENT BALANCE CALCULATION
    // =========================

    private BigDecimal calculateCurrentBalance(Account account) {

        BigDecimal balance = account.getOpeningBalance();

        // Transactions occurring on or after the opening balance date
        List<FinancialTransaction> transactions =
                transactionRepository
                        .findByAccount_IdAndTransactionDateGreaterThanEqual(
                                account.getId(),
                                account.getOpeningBalanceDate()
                        );

        for (FinancialTransaction transaction : transactions) {

            BigDecimal amount = transaction.getAmount();

            if (transaction.getType() == TransactionType.INCOME) {

                balance = balance.add(amount);

            } else if (
                    transaction.getType() == TransactionType.EXPENSE
                            || transaction.getType() == TransactionType.INVESTMENT
            ) {

                balance = balance.subtract(amount);
            }
        }

        // Transfers received
        List<Transfer> incomingTransfers =
                transferRepository
                        .findByDestinationAccount_IdAndTransferDateGreaterThanEqual(
                                account.getId(),
                                account.getOpeningBalanceDate()
                        );

        for (Transfer transfer : incomingTransfers) {

            balance = balance.add(transfer.getAmount());
        }

        // Transfers sent
        List<Transfer> outgoingTransfers =
                transferRepository
                        .findBySourceAccount_IdAndTransferDateGreaterThanEqual(
                                account.getId(),
                                account.getOpeningBalanceDate()
                        );

        for (Transfer transfer : outgoingTransfers) {

            balance = balance.subtract(transfer.getAmount());
        }

        return balance;
    }
}