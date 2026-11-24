
package com.financeflow.currency.service;

import com.financeflow.currency.dto.CurrencyRateResponse;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class CurrencyRateService {

    private static final String BASE_CURRENCY = "USD";
    private static final String SOURCE = "Frankfurter reference rates";
    private static final Duration CACHE_DURATION = Duration.ofHours(6);

    private final RestClient restClient;

    private final ConcurrentMap<String, CachedRate> rateCache =
            new ConcurrentHashMap<>();

    public CurrencyRateService() {
        this.restClient = RestClient.create(
                "https://api.frankfurter.dev/v2"
        );
    }

    public CurrencyRateResponse getRate(String targetCurrency) {

        String currency = targetCurrency.toUpperCase(Locale.ROOT);

        if (!currency.matches("[A-Z]{3}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid currency code"
            );
        }

        if (BASE_CURRENCY.equals(currency)) {
            return new CurrencyRateResponse(
                    BASE_CURRENCY,
                    currency,
                    BigDecimal.ONE,
                    null,
                    SOURCE,
                    Instant.now()
            );
        }

        Instant now = Instant.now();

        CachedRate cached = rateCache.get(currency);

        if (cached != null && cached.expiresAt().isAfter(now)) {
            return cached.response();
        }

        try {
            FrankfurterRate result = restClient.get()
                    .uri("/rate/{base}/{quote}",
                            BASE_CURRENCY, currency)
                    .retrieve()
                    .body(FrankfurterRate.class);

            if (result == null || result.rate() == null
                    || result.rate().signum() <= 0) {
                throw new IllegalStateException(
                        "Invalid exchange rate response"
                );
            }

            CurrencyRateResponse response =
                    new CurrencyRateResponse(
                            result.base(),
                            result.quote(),
                            result.rate(),
                            result.date(),
                            SOURCE,
                            Instant.now()
                    );

            rateCache.put(
                    currency,
                    new CachedRate(
                            response,
                            Instant.now().plus(CACHE_DURATION)
                    )
            );

            return response;

        } catch (RestClientException | IllegalStateException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to retrieve exchange rate. Please try again later.",
                    exception
            );
        }
    }

    private record FrankfurterRate(
            LocalDate date,
            String base,
            String quote,
            BigDecimal rate
    ) {}

    private record CachedRate(
            CurrencyRateResponse response,
            Instant expiresAt
    ) {}
}
