
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

    // CREATE ACCOUNT

    @Transactional
    public AccountResponse createAccount(
            UUID userId,
            CreateAccountRequest request
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Account name is required");
        }

        String accountName = request.getName().trim();

        if (accountRepository.existsByUserIdAndNameIgnoreCase(
                userId,
                accountName
        )) {
            throw new IllegalArgumentException(
                    "Account name is already registered for this user"
            );
        }

        Account account = new Account();

        account.setUser(user);
        account.setName(accountName);
        account.setAccountType(request.getAccountType());
        account.setCurrency(request.getCurrency());
        account.setOpeningBalance(request.getOpeningBalance());
        account.setOpeningBalanceDate(request.getOpeningBalanceDate());
        account.setStatus(AccountStatus.ACTIVE);

        Account savedAccount = accountRepository.save(account);

        return toResponse(savedAccount);
    }

    // GET ALL ACCOUNTS FOR AUTHENTICATED USER

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

    // GET SINGLE ACCOUNT WITH OWNERSHIP CHECK

    @Transactional(readOnly = true)
    public AccountResponse getAccount(
            UUID userId,
            UUID accountId
    ) {

        Account account = getOwnedAccount(userId, accountId);

        return toResponse(account);
    }

    // UPDATE ACCOUNT WITH OWNERSHIP CHECK

    @Transactional
    public AccountResponse updateAccount(
            UUID userId,
            UUID accountId,
            UpdateAccountRequest request
    ) {

        Account account = getOwnedAccount(userId, accountId);

        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Account name is required");
        }

        String accountName = request.getName().trim();

        if (!account.getName().equalsIgnoreCase(accountName)
                && accountRepository.existsByUserIdAndNameIgnoreCase(
                userId,
                accountName
        )) {

            throw new IllegalArgumentException(
                    "Account name is already registered for this user"
            );
        }

        account.setName(accountName);
        account.setAccountType(request.getAccountType());
        account.setCurrency(request.getCurrency());
        account.setOpeningBalance(request.getOpeningBalance());
        account.setOpeningBalanceDate(request.getOpeningBalanceDate());

        Account updatedAccount = accountRepository.save(account);

        return toResponse(updatedAccount);
    }

    // ARCHIVE ACCOUNT WITH OWNERSHIP CHECK

    @Transactional
    public AccountResponse archiveAccount(
            UUID userId,
            UUID accountId
    ) {

        Account account = getOwnedAccount(userId, accountId);

        if (account.getStatus() == AccountStatus.ARCHIVED) {
            throw new IllegalArgumentException(
                    "Account is already archived"
            );
        }

        account.setStatus(AccountStatus.ARCHIVED);

        Account archivedAccount = accountRepository.save(account);

        return toResponse(archivedAccount);
    }

    // CENTRALIZED OWNERSHIP CHECK

    private Account getOwnedAccount(
            UUID userId,
            UUID accountId
    ) {

        return accountRepository.findByIdAndUser_Id(accountId, userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Account not found"));
    }

    // ACCOUNT RESPONSE MAPPER

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

    // CURRENT BALANCE CALCULATION

    private BigDecimal calculateCurrentBalance(Account account) {

        BigDecimal balance = account.getOpeningBalance();

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
