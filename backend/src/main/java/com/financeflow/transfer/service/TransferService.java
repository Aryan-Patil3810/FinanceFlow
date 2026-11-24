
package com.financeflow.transfer.service;

import com.financeflow.account.entity.Account;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.transfer.dto.CreateTransferRequest;
import com.financeflow.transfer.dto.TransferResponse;
import com.financeflow.transfer.entity.Transfer;
import com.financeflow.transfer.repository.TransferRepository;
import com.financeflow.user.entity.User;
import com.financeflow.user.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class TransferService {

    private final TransferRepository transferRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    public TransferService(
            TransferRepository transferRepository,
            UserRepository userRepository,
            AccountRepository accountRepository
    ) {
        this.transferRepository = transferRepository;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public TransferResponse createTransfer(
            UUID userId,
            CreateTransferRequest request
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        if (request.getSourceAccountId()
                .equals(request.getDestinationAccountId())) {
            throw new IllegalArgumentException(
                    "Source and destination accounts must be different"
            );
        }

        Account sourceAccount = accountRepository
                .findById(request.getSourceAccountId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Source account not found"));

        Account destinationAccount = accountRepository
                .findById(request.getDestinationAccountId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Destination account not found"));

        if (!sourceAccount.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "Source account does not belong to this user"
            );
        }

        if (!destinationAccount.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "Destination account does not belong to this user"
            );
        }

        String sourceCurrency =
                normalizeCurrency(sourceAccount.getCurrency());

        String destinationCurrency =
                normalizeCurrency(destinationAccount.getCurrency());

        String requestedCurrency =
                normalizeCurrency(request.getCurrency());

        // Cross-currency transfers are not supported yet.
        if (!sourceCurrency.equals(destinationCurrency)) {
            throw new IllegalArgumentException(
                    "Transfers between accounts with different currencies "
                            + "are not supported yet."
            );
        }

        if (!sourceCurrency.equals(requestedCurrency)) {
            throw new IllegalArgumentException(
                    "Transfer currency must match the source and destination "
                            + "account currency: " + sourceCurrency
            );
        }

        Transfer transfer = new Transfer();

        transfer.setUser(user);
        transfer.setSourceAccount(sourceAccount);
        transfer.setDestinationAccount(destinationAccount);
        transfer.setAmount(request.getAmount());

        // Both accounts have the same currency.
        transfer.setCurrency(sourceCurrency);

        transfer.setTransferDate(request.getTransferDate());
        transfer.setNotes(request.getNotes());

        return toResponse(transferRepository.save(transfer));
    }

    @Transactional(readOnly = true)
    public List<TransferResponse> getTransfers(UUID userId) {

        userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        return transferRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
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

    private TransferResponse toResponse(Transfer transfer) {
        return new TransferResponse(
                transfer.getId(),
                transfer.getSourceAccount().getId(),
                transfer.getDestinationAccount().getId(),
                transfer.getAmount(),
                transfer.getCurrency().trim(),
                transfer.getTransferDate(),
                transfer.getNotes(),
                transfer.getCreatedAt()
        );
    }
}
