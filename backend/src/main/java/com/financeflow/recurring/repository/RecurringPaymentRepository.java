package com.financeflow.recurring.repository;

import com.financeflow.recurring.entity.RecurringPayment;
import com.financeflow.recurring.entity.RecurringPaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RecurringPaymentRepository
        extends JpaRepository<RecurringPayment, UUID> {

    List<RecurringPayment> findByUserId(UUID userId);

    List<RecurringPayment> findByUserIdAndStatus(
            UUID userId,
            com.financeflow.recurring.entity.RecurringPaymentStatus status
    );

    @Query("""
        SELECT DISTINCT rp.user.id
        FROM RecurringPayment rp
        WHERE rp.status = :status
    """)
    List<UUID> findDistinctUserIdsByStatus(
            @Param("status") RecurringPaymentStatus status
    );
}