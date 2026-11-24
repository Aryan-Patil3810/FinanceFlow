package com.financeflow.recurring.service;

import com.financeflow.recurring.dto.PaymentOccurrenceResponse;
import com.financeflow.recurring.entity.PaymentOccurrence;
import com.financeflow.recurring.entity.PaymentOccurrenceStatus;
import com.financeflow.recurring.entity.RecurringFrequency;
import com.financeflow.recurring.entity.RecurringPayment;
import com.financeflow.recurring.entity.RecurringPaymentStatus;
import com.financeflow.recurring.repository.PaymentOccurrenceRepository;
import com.financeflow.recurring.repository.RecurringPaymentRepository;
import com.financeflow.transaction.dto.CreateTransactionRequest;
import com.financeflow.transaction.dto.TransactionResponse;
import com.financeflow.transaction.entity.TransactionType;
import com.financeflow.transaction.service.TransactionService;
import com.financeflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.financeflow.notification.enums.NotificationType;
import com.financeflow.notification.service.NotificationService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentOccurrenceService {

    private final PaymentOccurrenceRepository occurrenceRepository;
    private final RecurringPaymentRepository recurringPaymentRepository;
    private final UserRepository userRepository;
    private final TransactionService transactionService;
    private final NotificationService notificationService;

    public PaymentOccurrenceService(
            PaymentOccurrenceRepository occurrenceRepository,
            RecurringPaymentRepository recurringPaymentRepository,
            UserRepository userRepository,
            TransactionService transactionService, NotificationService notificationService
    ) {
        this.occurrenceRepository = occurrenceRepository;
        this.recurringPaymentRepository = recurringPaymentRepository;
        this.userRepository = userRepository;
        this.transactionService = transactionService;
        this.notificationService = notificationService;
    }

    // =========================================================
    // CREATE OCCURRENCE
    // =========================================================

    @Transactional
    public PaymentOccurrenceResponse createOccurrence(
            UUID userId,
            UUID recurringPaymentId,
            LocalDate dueDate
    ) {

        userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        RecurringPayment recurringPayment =
                recurringPaymentRepository.findById(recurringPaymentId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Recurring payment not found"
                                ));

        if (!recurringPayment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "Recurring payment does not belong to this user"
            );
        }

        if (recurringPayment.getStatus()
                != RecurringPaymentStatus.ACTIVE) {

            throw new IllegalArgumentException(
                    "Occurrence can only be created for an active recurring payment"
            );
        }

        if (dueDate == null) {
            throw new IllegalArgumentException(
                    "Due date is required"
            );
        }

        if (dueDate.isBefore(recurringPayment.getStartDate())) {
            throw new IllegalArgumentException(
                    "Due date cannot be before recurring payment start date"
            );
        }

        if (recurringPayment.getEndDate() != null
                && dueDate.isAfter(recurringPayment.getEndDate())) {

            throw new IllegalArgumentException(
                    "Due date cannot be after recurring payment end date"
            );
        }

        /*
         * Prevent duplicate occurrence creation.
         */
        boolean exists =
                occurrenceRepository
                        .existsByRecurringPaymentIdAndDueDate(
                                recurringPaymentId,
                                dueDate
                        );

        if (exists) {
            throw new IllegalArgumentException(
                    "Payment occurrence already exists for this due date"
            );
        }

        PaymentOccurrence occurrence =
                new PaymentOccurrence();

        occurrence.setRecurringPayment(recurringPayment);
        occurrence.setDueDate(dueDate);
        occurrence.setExpectedAmount(
                recurringPayment.getAmount()
        );

        occurrence.setStatus(
                determineInitialStatus(dueDate)
        );

        PaymentOccurrence savedOccurrence =
                occurrenceRepository.save(occurrence);

// =====================================================
// CREATE PAYMENT COMPLETED NOTIFICATION
// =====================================================

        String title = "Payment Completed";

        String message = recurringPayment.getName()
                + " payment of "
                + recurringPayment.getCurrency()
                + " "
                + savedOccurrence.getActualAmount().toPlainString()
                + " has been successfully recorded.";

        notificationService.createNotification(
                userId,
                title,
                message,
                NotificationType.PAYMENT_COMPLETED,
                "PAYMENT_OCCURRENCE",
                savedOccurrence.getId(),
                "PAYMENT_COMPLETED:" + savedOccurrence.getId()
        );

        return toResponse(savedOccurrence);
    }

    // =========================================================
    // GENERATE UPCOMING OCCURRENCES
    // =========================================================

    @Transactional
    public int generateUpcomingOccurrences(
            UUID userId,
            int daysAhead
    ) {

        userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        if (daysAhead <= 0) {
            throw new IllegalArgumentException(
                    "Days ahead must be greater than zero"
            );
        }

        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(daysAhead);

        List<RecurringPayment> recurringPayments =
                recurringPaymentRepository
                        .findByUserIdAndStatus(
                                userId,
                                RecurringPaymentStatus.ACTIVE
                        );

        int generatedCount = 0;

        for (RecurringPayment payment : recurringPayments) {

            LocalDate dueDate =
                    calculateFirstDueDate(
                            payment,
                            today
                    );

            while (!dueDate.isAfter(endDate)) {

                if (!dueDate.isBefore(payment.getStartDate())
                        && isWithinEndDate(
                        payment,
                        dueDate
                )) {

                    boolean exists =
                            occurrenceRepository
                                    .existsByRecurringPaymentIdAndDueDate(
                                            payment.getId(),
                                            dueDate
                                    );

                    if (!exists) {

                        PaymentOccurrence occurrence =
                                new PaymentOccurrence();

                        occurrence.setRecurringPayment(
                                payment
                        );

                        occurrence.setDueDate(
                                dueDate
                        );

                        occurrence.setExpectedAmount(
                                payment.getAmount()
                        );

                        occurrence.setStatus(
                                determineInitialStatus(
                                        dueDate
                                )
                        );

                        occurrenceRepository.save(
                                occurrence
                        );

                        generatedCount++;
                    }
                }

                dueDate =
                        getNextDueDate(
                                dueDate,
                                payment.getFrequency()
                        );
            }
        }

        return generatedCount;
    }


    @Transactional
    public int generateUpcomingOccurrencesForAllUsers(int daysAhead) {

        List<UUID> userIds =
                recurringPaymentRepository.findDistinctUserIdsByStatus(
                        RecurringPaymentStatus.ACTIVE
                );

        int totalGenerated = 0;

        for (UUID userId : userIds) {
            try {
                totalGenerated += generateUpcomingOccurrences(
                        userId,
                        daysAhead
                );
            } catch (Exception exception) {
                // Log the failure and continue processing other users.
                System.err.println(
                        "Failed to generate payment occurrences for user "
                                + userId + ": "
                                + exception.getMessage()
                );
            }
        }

        return totalGenerated;
    }


    // =========================================================
    // CALCULATE FIRST UPCOMING DATE
    // =========================================================

    private LocalDate calculateFirstDueDate(
            RecurringPayment payment,
            LocalDate today
    ) {

        LocalDate dueDate =
                payment.getStartDate();

        /*
         * Move forward until we reach today
         * or the next future occurrence.
         */
        while (dueDate.isBefore(today)) {

            dueDate =
                    getNextDueDate(
                            dueDate,
                            payment.getFrequency()
                    );
        }

        return dueDate;
    }

    // =========================================================
    // CHECK END DATE
    // =========================================================

    private boolean isWithinEndDate(
            RecurringPayment payment,
            LocalDate dueDate
    ) {

        return payment.getEndDate() == null
                || !dueDate.isAfter(
                payment.getEndDate()
        );
    }

    // =========================================================
    // CALCULATE NEXT DUE DATE
    // =========================================================

    private LocalDate getNextDueDate(
            LocalDate currentDate,
            RecurringFrequency frequency
    ) {

        return switch (frequency) {

            case WEEKLY ->
                    currentDate.plusWeeks(1);

            case BIWEEKLY ->
                    currentDate.plusWeeks(2);

            case MONTHLY ->
                    currentDate.plusMonths(1);

            case QUARTERLY ->
                    currentDate.plusMonths(3);

            case YEARLY ->
                    currentDate.plusYears(1);
        };
    }

    // =========================================================
    // GET ALL OCCURRENCES
    // =========================================================

    @Transactional(readOnly = true)
    public List<PaymentOccurrenceResponse> getOccurrences(
            UUID userId
    ) {

        userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        return occurrenceRepository
                .findByRecurringPaymentUserId(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // =========================================================
    // GET SINGLE OCCURRENCE
    // =========================================================

    @Transactional(readOnly = true)
    public PaymentOccurrenceResponse getOccurrence(
            UUID userId,
            UUID occurrenceId
    ) {

        userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        PaymentOccurrence occurrence =
                occurrenceRepository.findById(occurrenceId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Payment occurrence not found"
                                ));

        validateOwnership(
                userId,
                occurrence
        );

        return toResponse(occurrence);
    }

    // =========================================================
    // GET UPCOMING OCCURRENCES
    // =========================================================

    @Transactional(readOnly = true)
    public List<PaymentOccurrenceResponse> getUpcomingOccurrences(
            UUID userId,
            LocalDate startDate,
            LocalDate endDate
    ) {

        userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException(
                    "Start date and end date are required"
            );
        }

        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException(
                    "Start date cannot be after end date"
            );
        }

        return occurrenceRepository
                .findByRecurringPaymentUserIdAndDueDateBetween(
                        userId,
                        startDate,
                        endDate
                )
                .stream()
                .filter(occurrence ->
                        occurrence.getStatus()
                                != PaymentOccurrenceStatus.PAID
                                && occurrence.getStatus()
                                != PaymentOccurrenceStatus.SKIPPED
                )
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // =========================================================
    // MARK OCCURRENCE AS PAID
    // =========================================================

    @Transactional
    public PaymentOccurrenceResponse markAsPaid(
            UUID userId,
            UUID occurrenceId,
            Double actualAmount
    ) {

        userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        PaymentOccurrence occurrence =
                occurrenceRepository.findById(occurrenceId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Payment occurrence not found"
                                ));

        validateOwnership(
                userId,
                occurrence
        );

        if (occurrence.getStatus()
                == PaymentOccurrenceStatus.PAID) {

            throw new IllegalArgumentException(
                    "Payment occurrence is already marked as paid"
            );
        }

        if (occurrence.getStatus()
                == PaymentOccurrenceStatus.SKIPPED) {

            throw new IllegalArgumentException(
                    "Skipped payment occurrence cannot be marked as paid"
            );
        }

        if (actualAmount == null || actualAmount <= 0) {
            throw new IllegalArgumentException(
                    "Actual amount must be greater than zero"
            );
        }

        BigDecimal actualAmountDecimal =
                BigDecimal.valueOf(actualAmount);

        RecurringPayment recurringPayment =
                occurrence.getRecurringPayment();

        if (recurringPayment == null) {
            throw new IllegalArgumentException(
                    "Recurring payment is required"
            );
        }

        /*
         * An account is optional when creating a recurring payment,
         * but mandatory when recording the actual transaction.
         */
        if (recurringPayment.getAccount() == null) {
            throw new IllegalArgumentException(
                    "An account must be assigned before marking the payment as paid"
            );
        }

        // =====================================================
        // CREATE FINANCIAL TRANSACTION
        // =====================================================

        CreateTransactionRequest transactionRequest =
                new CreateTransactionRequest();

        transactionRequest.setAccountId(
                recurringPayment.getAccount().getId()
        );

        transactionRequest.setCategoryId(
                recurringPayment.getCategoryId()
        );

        transactionRequest.setPaymentMethodId(
                recurringPayment.getPaymentMethodId()
        );

        transactionRequest.setType(
                TransactionType.EXPENSE
        );

        transactionRequest.setAmount(
                actualAmountDecimal
        );

        transactionRequest.setCurrency(
                recurringPayment.getCurrency()
        );

        transactionRequest.setTransactionDate(
                occurrence.getDueDate()
        );

        transactionRequest.setDescription(
                recurringPayment.getName()
        );

        transactionRequest.setNotes(
                "Recurring payment"
        );

        TransactionResponse transactionResponse =
                transactionService.createTransaction(
                        userId,
                        transactionRequest
                );

        // =====================================================
        // UPDATE OCCURRENCE
        // =====================================================

        occurrence.setActualAmount(
                actualAmountDecimal
        );

        occurrence.setPaidTransactionId(
                transactionResponse.getId()
        );

        occurrence.setStatus(
                PaymentOccurrenceStatus.PAID
        );

        PaymentOccurrence savedOccurrence =
                occurrenceRepository.save(
                        occurrence
                );

        return toResponse(savedOccurrence);
    }

    // =========================================================
    // SKIP OCCURRENCE
    // =========================================================

    @Transactional
    public PaymentOccurrenceResponse skipOccurrence(
            UUID userId,
            UUID occurrenceId
    ) {

        userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        PaymentOccurrence occurrence =
                occurrenceRepository.findById(occurrenceId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Payment occurrence not found"
                                ));

        validateOwnership(
                userId,
                occurrence
        );

        if (occurrence.getStatus()
                == PaymentOccurrenceStatus.PAID) {

            throw new IllegalArgumentException(
                    "Paid payment occurrence cannot be skipped"
            );
        }

        if (occurrence.getStatus()
                == PaymentOccurrenceStatus.SKIPPED) {

            throw new IllegalArgumentException(
                    "Payment occurrence is already skipped"
            );
        }

        occurrence.setStatus(
                PaymentOccurrenceStatus.SKIPPED
        );

        PaymentOccurrence savedOccurrence =
                occurrenceRepository.save(
                        occurrence
                );

        return toResponse(savedOccurrence);
    }

    // =========================================================
    // DETERMINE INITIAL STATUS
    // =========================================================

    private PaymentOccurrenceStatus determineInitialStatus(
            LocalDate dueDate
    ) {

        LocalDate today = LocalDate.now();

        if (dueDate.isBefore(today)) {
            return PaymentOccurrenceStatus.MISSED;
        }

        return PaymentOccurrenceStatus.UPCOMING;
    }

    // =========================================================
    // OWNERSHIP VALIDATION
    // =========================================================

    private void validateOwnership(
            UUID userId,
            PaymentOccurrence occurrence
    ) {

        if (occurrence.getRecurringPayment() == null) {
            throw new IllegalArgumentException(
                    "Recurring payment not found for occurrence"
            );
        }

        if (!occurrence
                .getRecurringPayment()
                .getUser()
                .getId()
                .equals(userId)) {

            throw new IllegalArgumentException(
                    "Payment occurrence does not belong to this user"
            );
        }
    }

    // =========================================================
    // ENTITY -> RESPONSE
    // =========================================================


    private PaymentOccurrenceResponse toResponse(
            PaymentOccurrence occurrence
    ) {

        RecurringPayment recurringPayment =
                occurrence.getRecurringPayment();

        return new PaymentOccurrenceResponse(
                occurrence.getId(),

                recurringPayment != null
                        ? recurringPayment.getId()
                        : null,

                recurringPayment != null
                        ? recurringPayment.getName()
                        : null,

                occurrence.getDueDate(),
                occurrence.getExpectedAmount(),
                occurrence.getActualAmount(),

                recurringPayment != null
                        ? recurringPayment.getCurrency()
                        : null,

                occurrence.getStatus(),
                occurrence.getPaidTransactionId(),
                occurrence.getCreatedAt()
        );
    }

}