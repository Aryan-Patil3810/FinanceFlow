
package com.financeflow.settings.service;

import com.financeflow.settings.entity.UserPreferences;
import com.financeflow.settings.repository.UserPreferencesRepository;
import com.financeflow.user.entity.User;
import com.financeflow.user.repository.UserRepository;
import com.financeflow.settings.dto.request.UserPreferencesRequest;
import com.financeflow.settings.dto.response.UserPreferencesResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserPreferencesService {

    private final UserPreferencesRepository preferencesRepository;
    private final UserRepository userRepository;

    public UserPreferencesService(
            UserPreferencesRepository preferencesRepository,
            UserRepository userRepository) {

        this.preferencesRepository = preferencesRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public UserPreferences getOrCreatePreferences(UUID userId) {

        return preferencesRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));
    }

    private UserPreferences createDefaultPreferences(UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found: " + userId));

        UserPreferences preferences = new UserPreferences();
        preferences.setUser(user);

        return preferencesRepository.save(preferences);
    }

    @Transactional
    public UserPreferences updatePreferences(
            UUID userId,
            UserPreferences updatedPreferences) {

        UserPreferences existing = getOrCreatePreferences(userId);

        validatePreferences(updatedPreferences);

        existing.setCountryCode(updatedPreferences.getCountryCode());
        existing.setDisplayCurrency(updatedPreferences.getDisplayCurrency());
        existing.setTimeZone(updatedPreferences.getTimeZone());
        existing.setLocale(updatedPreferences.getLocale());
        existing.setDateFormat(updatedPreferences.getDateFormat());
        existing.setTimeFormat(updatedPreferences.getTimeFormat());

        return preferencesRepository.save(existing);
    }

    private void validatePreferences(UserPreferences preferences) {

        if (preferences.getCountryCode() == null
                || !preferences.getCountryCode().matches("[A-Z]{2}")) {
            throw new IllegalArgumentException(
                    "Country code must contain two uppercase letters");
        }

        if (preferences.getDisplayCurrency() == null
                || !preferences.getDisplayCurrency().matches("[A-Z]{3}")) {
            throw new IllegalArgumentException(
                    "Currency must contain three uppercase letters");
        }

        if (preferences.getTimeZone() == null
                || preferences.getTimeZone().isBlank()) {
            throw new IllegalArgumentException("Time zone is required");
        }

        if (preferences.getLocale() == null
                || preferences.getLocale().isBlank()) {
            throw new IllegalArgumentException("Locale is required");
        }

        if (!"DD/MM/YYYY".equals(preferences.getDateFormat())
                && !"MM/DD/YYYY".equals(preferences.getDateFormat())
                && !"YYYY-MM-DD".equals(preferences.getDateFormat())) {
            throw new IllegalArgumentException("Invalid date format");
        }

        if (!"12H".equals(preferences.getTimeFormat())
                && !"24H".equals(preferences.getTimeFormat())) {
            throw new IllegalArgumentException("Invalid time format");
        }
    }

    @Transactional(readOnly = true)
    public UserPreferencesResponse getPreferences(UUID userId) {
        return mapToResponse(getOrCreatePreferences(userId));
    }

    @Transactional
    public UserPreferencesResponse updatePreferences(
            UUID userId,
            UserPreferencesRequest request) {

        UserPreferences existing = getOrCreatePreferences(userId);

        existing.setCountryCode(request.countryCode());
        existing.setDisplayCurrency(request.displayCurrency());
        existing.setTimeZone(request.timeZone());
        existing.setLocale(request.locale());
        existing.setDateFormat(request.dateFormat());
        existing.setTimeFormat(request.timeFormat());

        return mapToResponse(preferencesRepository.save(existing));
    }

    private UserPreferencesResponse mapToResponse(UserPreferences preferences) {
        return new UserPreferencesResponse(
                preferences.getId(),
                preferences.getCountryCode().trim(),
                preferences.getDisplayCurrency().trim(),
                preferences.getTimeZone(),
                preferences.getLocale(),
                preferences.getDateFormat(),
                preferences.getTimeFormat(),
                preferences.getCreatedAt(),
                preferences.getUpdatedAt()
        );
    }
}
