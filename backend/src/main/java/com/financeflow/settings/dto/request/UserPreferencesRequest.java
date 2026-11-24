
package com.financeflow.settings.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UserPreferencesRequest(

        @NotBlank
        @Pattern(regexp = "^[A-Z]{2}$", message = "Invalid country code")
        String countryCode,

        @NotBlank
        @Pattern(regexp = "^[A-Z]{3}$", message = "Invalid currency code")
        String displayCurrency,

        @NotBlank
        String timeZone,

        @NotBlank
        String locale,

        @NotBlank
        @Pattern(
                regexp = "^(DD/MM/YYYY|MM/DD/YYYY|YYYY-MM-DD)$",
                message = "Invalid date format"
        )
        String dateFormat,

        @NotBlank
        @Pattern(regexp = "^(12H|24H)$", message = "Invalid time format")
        String timeFormat

) {}
