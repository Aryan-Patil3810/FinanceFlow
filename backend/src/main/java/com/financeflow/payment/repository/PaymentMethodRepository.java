
package com.financeflow.payment.repository;

import com.financeflow.payment.entity.PaymentMethod;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaymentMethodRepository
        extends JpaRepository<PaymentMethod, UUID> {

    List<PaymentMethod> findByUserId(UUID userId);

    boolean existsByUserIdAndNameIgnoreCase(
            UUID userId,
            String name
    );
}
