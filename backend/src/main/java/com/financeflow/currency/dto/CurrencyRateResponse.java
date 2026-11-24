
package com.financeflow.currency.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record CurrencyRateResponse(
        String baseCurrency,
        String targetCurrency,
        BigDecimal exchangeRate,
        LocalDate rateDate,
        String source,
        Instant fetchedAt
) {}
