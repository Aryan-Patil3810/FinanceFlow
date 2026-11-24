package com.financeflow.transaction.repository;

import com.financeflow.transaction.entity.FinancialTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface FinancialTransactionRepository
        extends JpaRepository<FinancialTransaction, UUID> {

    List<FinancialTransaction> findByUserId(UUID userId);

    List<FinancialTransaction>
    findByAccount_IdAndTransactionDateGreaterThanEqual(
            UUID accountId,
            LocalDate date
    );
}