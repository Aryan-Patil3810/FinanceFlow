
package com.financeflow.account.repository;

import com.financeflow.account.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {

    boolean existsByUserIdAndNameIgnoreCase(UUID userId, String name);

    List<Account> findByUserId(UUID userId);

    Optional<Account> findByIdAndUser_Id(UUID accountId, UUID userId);
}
