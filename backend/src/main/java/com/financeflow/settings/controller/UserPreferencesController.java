
package com.financeflow.settings.controller;

import com.financeflow.settings.dto.request.UserPreferencesRequest;
import com.financeflow.settings.dto.response.UserPreferencesResponse;
import com.financeflow.settings.service.UserPreferencesService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/settings/preferences")
public class UserPreferencesController {

    private final UserPreferencesService preferencesService;

    public UserPreferencesController(
            UserPreferencesService preferencesService) {
        this.preferencesService = preferencesService;
    }

    @GetMapping
    public UserPreferencesResponse getPreferences(
            @RequestParam UUID userId) {

        return preferencesService.getPreferences(userId);
    }

    @PutMapping
    public UserPreferencesResponse updatePreferences(
            @RequestParam UUID userId,
            @Valid @RequestBody UserPreferencesRequest request) {

        return preferencesService.updatePreferences(userId, request);
    }
}
