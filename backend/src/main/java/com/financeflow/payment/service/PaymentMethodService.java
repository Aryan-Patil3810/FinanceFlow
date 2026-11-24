package com.financeflow.payment.service;

import com.financeflow.payment.dto.CreatePaymentMethodRequest;
import com.financeflow.payment.dto.PaymentMethodResponse;
import com.financeflow.payment.dto.UpdatePaymentMethodRequest;
import com.financeflow.payment.entity.PaymentMethod;
import com.financeflow.payment.repository.PaymentMethodRepository;
import com.financeflow.user.entity.User;
import com.financeflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PaymentMethodService {

    private final PaymentMethodRepository paymentMethodRepository;
    private final UserRepository userRepository;

    public PaymentMethodService(
            PaymentMethodRepository paymentMethodRepository,
            UserRepository userRepository
    ) {
        this.paymentMethodRepository = paymentMethodRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PaymentMethodResponse createPaymentMethod(
            UUID userId,
            CreatePaymentMethodRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (paymentMethodRepository.existsByUserIdAndNameIgnoreCase(
                userId, request.getName())) {

            throw new IllegalArgumentException(
                    "Payment method with this name already exists"
            );
        }

        PaymentMethod paymentMethod = new PaymentMethod();
        paymentMethod.setUser(user);
        paymentMethod.setName(request.getName().trim());
        paymentMethod.setMethodType(request.getMethodType());

        return toResponse(paymentMethodRepository.save(paymentMethod));
    }

    @Transactional(readOnly = true)
    public List<PaymentMethodResponse> getPaymentMethods(UUID userId) {

        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return paymentMethodRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PaymentMethodResponse updatePaymentMethod(
            UUID paymentMethodId,
            UUID userId,
            UpdatePaymentMethodRequest request
    ) {
        PaymentMethod paymentMethod = paymentMethodRepository.findById(paymentMethodId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Payment method not found"));

        if (!paymentMethod.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "Payment method does not belong to this user"
            );
        }

        if (!paymentMethod.getName().equalsIgnoreCase(request.getName())
                && paymentMethodRepository.existsByUserIdAndNameIgnoreCase(
                userId, request.getName())) {

            throw new IllegalArgumentException(
                    "Payment method with this name already exists"
            );
        }

        paymentMethod.setName(request.getName().trim());
        paymentMethod.setMethodType(request.getMethodType());

        return toResponse(paymentMethodRepository.save(paymentMethod));
    }

    private PaymentMethodResponse toResponse(PaymentMethod paymentMethod) {
        return new PaymentMethodResponse(
                paymentMethod.getId(),
                paymentMethod.getName(),
                paymentMethod.getMethodType(),
                paymentMethod.getCreatedAt()
        );
    }
}