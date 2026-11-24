package com.financeflow.recurring.service;

import com.financeflow.account.entity.Account;
import com.financeflow.account.repository.AccountRepository;
import com.financeflow.category.entity.Category;
import com.financeflow.category.repository.CategoryRepository;
import com.financeflow.recurring.dto.CreateRecurringPaymentRequest;
import com.financeflow.recurring.dto.RecurringPaymentResponse;
import com.financeflow.recurring.dto.UpdateRecurringPaymentRequest;
import com.financeflow.recurring.entity.RecurringPayment;
import com.financeflow.recurring.entity.RecurringPaymentStatus;
import com.financeflow.recurring.repository.RecurringPaymentRepository;
import com.financeflow.user.entity.User;
import com.financeflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RecurringPaymentService {

    private final RecurringPaymentRepository recurringPaymentRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;

    public RecurringPaymentService(
            RecurringPaymentRepository recurringPaymentRepository,
            UserRepository userRepository,
            AccountRepository accountRepository,
            CategoryRepository categoryRepository
    ) {
        this.recurringPaymentRepository = recurringPaymentRepository;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public RecurringPaymentResponse createRecurringPayment(
            UUID userId,
            CreateRecurringPaymentRequest request
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        validateDates(request.getStartDate(), request.getEndDate());

        Account account = null;

        if (request.getAccountId() != null) {
            account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() ->
                            new IllegalArgumentException("Account not found"));

            if (!account.getUser().getId().equals(userId)) {
                throw new IllegalArgumentException(
                        "Account does not belong to user");
            }
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository
                    .findById(request.getCategoryId())
                    .orElseThrow(() ->
                            new IllegalArgumentException("Category not found"));

            // Category can either be system-owned or user-owned.
            if (category.getUser() != null
                    && !category.getUser().getId().equals(userId)) {
                throw new IllegalArgumentException(
                        "Category does not belong to user");
            }
        }

        RecurringPayment recurringPayment = new RecurringPayment();

        recurringPayment.setUser(user);
        recurringPayment.setName(request.getName().trim());
        recurringPayment.setAmount(request.getAmount());
        recurringPayment.setCurrency(request.getCurrency().toUpperCase());
        recurringPayment.setCategoryId(request.getCategoryId());
        recurringPayment.setAccount(account);
        recurringPayment.setPaymentMethodId(request.getPaymentMethodId());
        recurringPayment.setFrequency(request.getFrequency());
        recurringPayment.setStartDate(request.getStartDate());
        recurringPayment.setEndDate(request.getEndDate());
        recurringPayment.setStatus(RecurringPaymentStatus.ACTIVE);
        recurringPayment.setNotes(request.getNotes());

        RecurringPayment saved =
                recurringPaymentRepository.save(recurringPayment);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RecurringPaymentResponse> getRecurringPayments(UUID userId) {

        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found");
        }

        return recurringPaymentRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RecurringPaymentResponse getRecurringPayment(UUID recurringPaymentId) {

        RecurringPayment recurringPayment =
                recurringPaymentRepository.findById(recurringPaymentId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Recurring payment not found"));

        return mapToResponse(recurringPayment);
    }

    @Transactional
    public RecurringPaymentResponse updateRecurringPayment(
            UUID recurringPaymentId,
            UpdateRecurringPaymentRequest request
    ) {

        RecurringPayment recurringPayment =
                recurringPaymentRepository.findById(recurringPaymentId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Recurring payment not found"));

        validateDates(request.getStartDate(), request.getEndDate());

        UUID userId = recurringPayment.getUser().getId();

        Account account = null;

        if (request.getAccountId() != null) {

            account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() ->
                            new IllegalArgumentException("Account not found"));

            if (!account.getUser().getId().equals(userId)) {
                throw new IllegalArgumentException(
                        "Account does not belong to user");
            }
        }

        if (request.getCategoryId() != null) {

            Category category = categoryRepository
                    .findById(request.getCategoryId())
                    .orElseThrow(() ->
                            new IllegalArgumentException("Category not found"));

            if (category.getUser() != null
                    && !category.getUser().getId().equals(userId)) {
                throw new IllegalArgumentException(
                        "Category does not belong to user");
            }
        }

        recurringPayment.setName(request.getName().trim());
        recurringPayment.setAmount(request.getAmount());
        recurringPayment.setCurrency(request.getCurrency().toUpperCase());
        recurringPayment.setCategoryId(request.getCategoryId());
        recurringPayment.setAccount(account);
        recurringPayment.setPaymentMethodId(request.getPaymentMethodId());
        recurringPayment.setFrequency(request.getFrequency());
        recurringPayment.setStartDate(request.getStartDate());
        recurringPayment.setEndDate(request.getEndDate());
        recurringPayment.setNotes(request.getNotes());

        RecurringPayment updated =
                recurringPaymentRepository.save(recurringPayment);

        return mapToResponse(updated);
    }

    @Transactional
    public RecurringPaymentResponse updateStatus(
            UUID recurringPaymentId,
            RecurringPaymentStatus status
    ) {

        RecurringPayment recurringPayment =
                recurringPaymentRepository.findById(recurringPaymentId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Recurring payment not found"));

        recurringPayment.setStatus(status);

        return mapToResponse(
                recurringPaymentRepository.save(recurringPayment)
        );
    }

    private void validateDates(
            java.time.LocalDate startDate,
            java.time.LocalDate endDate
    ) {

        if (endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                    "End date cannot be before start date");
        }
    }

    private RecurringPaymentResponse mapToResponse(
            RecurringPayment payment
    ) {

        return new RecurringPaymentResponse(
                payment.getId(),
                payment.getName(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getCategoryId(),
                payment.getAccount() != null
                        ? payment.getAccount().getId()
                        : null,
                payment.getPaymentMethodId(),
                payment.getFrequency(),
                payment.getStartDate(),
                payment.getEndDate(),
                payment.getStatus(),
                payment.getNotes(),
                payment.getCreatedAt()
        );
    }
}