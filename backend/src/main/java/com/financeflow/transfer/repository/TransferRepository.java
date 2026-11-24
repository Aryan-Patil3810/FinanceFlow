package com.financeflow.transfer.repository;

import com.financeflow.transfer.entity.Transfer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TransferRepository extends JpaRepository<Transfer, UUID> {

    List<Transfer> findByUserId(UUID userId);

    List<Transfer> findBySourceAccount_IdAndTransferDateGreaterThanEqual(
            UUID accountId,
            LocalDate date
    );

    List<Transfer> findByDestinationAccount_IdAndTransferDateGreaterThanEqual(
            UUID accountId,
            LocalDate date
    );
}