
package com.financeflow.currency.controller;

import com.financeflow.currency.dto.CurrencyRateResponse;
import com.financeflow.currency.service.CurrencyRateService;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/currency")
public class CurrencyRateController {

    private final CurrencyRateService currencyRateService;

    public CurrencyRateController(
            CurrencyRateService currencyRateService) {
        this.currencyRateService = currencyRateService;
    }

    @GetMapping("/rate")
    public CurrencyRateResponse getExchangeRate(
            @RequestParam String to) {

        return currencyRateService.getRate(to);
    }
}
