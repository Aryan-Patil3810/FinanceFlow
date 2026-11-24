package com.financeflow.recurring.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "payment_occurrences")
public class PaymentOccurrence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recurring_payment_id")
    private RecurringPayment recurringPayment;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(
            name = "expected_amount",
            nullable = false,
            precision = 19,
            scale = 4
    )
    private BigDecimal expectedAmount;

    @Column(
            name = "actual_amount",
            precision = 19,
            scale = 4
    )
    private BigDecimal actualAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentOccurrenceStatus status;

    @Column(name = "paid_transaction_id")
    private UUID paidTransactionId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public PaymentOccurrence() {
    }

    public UUID getId() {
        return id;
    }

    public RecurringPayment getRecurringPayment() {
        return recurringPayment;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public BigDecimal getExpectedAmount() {
        return expectedAmount;
    }

    public BigDecimal getActualAmount() {
        return actualAmount;
    }

    public PaymentOccurrenceStatus getStatus() {
        return status;
    }

    public UUID getPaidTransactionId() {
        return paidTransactionId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setRecurringPayment(RecurringPayment recurringPayment) {
        this.recurringPayment = recurringPayment;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public void setExpectedAmount(BigDecimal expectedAmount) {
        this.expectedAmount = expectedAmount;
    }

    public void setActualAmount(BigDecimal actualAmount) {
        this.actualAmount = actualAmount;
    }

    public void setStatus(PaymentOccurrenceStatus status) {
        this.status = status;
    }

    public void setPaidTransactionId(UUID paidTransactionId) {
        this.paidTransactionId = paidTransactionId;
    }
}