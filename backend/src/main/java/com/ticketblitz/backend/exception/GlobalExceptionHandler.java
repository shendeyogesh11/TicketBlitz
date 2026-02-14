package com.ticketblitz.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.dao.PessimisticLockingFailureException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Centralizes all error responses for the entire application.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. HANDLE VALIDATION ERRORS (Day 1 Logic)
    // This catches @Valid failures from your EventController
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        // Returns 400 Bad Request with a map of fields and their specific errors
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    // 2. HANDLE GENERIC RUNTIME EXCEPTIONS
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorDetails> handleRuntimeException(RuntimeException ex) {
        ErrorDetails error = new ErrorDetails(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                ex.getMessage(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // 3. HANDLE ALL OTHER EXCEPTIONS (The Safety Net)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDetails> handleGlobalException(Exception ex) {
        ErrorDetails error = new ErrorDetails(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected error occurred: " + ex.getMessage(),
                LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Catch Database Lock Timeouts (5s limit)
    @ExceptionHandler(PessimisticLockingFailureException.class)
    public ResponseEntity<ErrorDetails> handleLockFailure(PessimisticLockingFailureException ex) {
        ErrorDetails error = new ErrorDetails(
                HttpStatus.TOO_MANY_REQUESTS.value(), // 429 Error
                "🔥 High traffic! Please retry your booking in a few seconds.",
                LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.TOO_MANY_REQUESTS);
    }

    // --- INNER HELPER CLASS FOR STRUCTURED JSON ---
    public static class ErrorDetails {
        private int status;
        private String message;
        private LocalDateTime timestamp;

        public ErrorDetails(int status, String message, LocalDateTime timestamp) {
            this.status = status;
            this.message = message;
            this.timestamp = timestamp;
        }

        // Getters (Required for JSON serialization)
        public int getStatus() { return status; }
        public String getMessage() { return message; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
}