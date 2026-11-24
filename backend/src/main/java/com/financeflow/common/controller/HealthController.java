package com.financeflow.common.controller;

import com.financeflow.common.dto.HealthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/api/v1/health")
    public ResponseEntity<HealthResponse> health() {

        HealthResponse response =
                new HealthResponse("UP", "FinanceFlow Backend");

        return ResponseEntity.ok(response);
    }
}
