
package com.financeflow.settings.dto.response;

import java.time.Instant;
import java.util.UUID;

public record UserPreferencesResponse(
        UUID id,
        String countryCode,
        String displayCurrency,
        String timeZone,
        String locale,
        String dateFormat,
        String timeFormat,
        Instant createdAt,
        Instant updatedAt
) {}
