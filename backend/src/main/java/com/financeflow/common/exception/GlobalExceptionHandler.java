
package com.financeflow.common.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage()));

        ApiError apiError = new ApiError(
                400,
                "Validation failed",
                Instant.now(),
                errors
        );

        return ResponseEntity.badRequest().body(apiError);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleBusiness(
            IllegalArgumentException ex) {

        ApiError apiError = new ApiError(
                409,
                ex.getMessage(),
                Instant.now(),
                null
        );

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(apiError);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiError> handleInvalidCredentials(
            InvalidCredentialsException ex) {

        ApiError apiError = new ApiError(
                401,
                "Invalid email or password",
                Instant.now(),
                null
        );

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(apiError);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(
            Exception ex) {

        log.error("Unexpected backend exception", ex);

        ApiError apiError = new ApiError(
                500,
                "An unexpected error occurred",
                Instant.now(),
                null
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(apiError);
    }
}
