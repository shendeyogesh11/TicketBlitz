package com.ticketblitz.backend.auth;

import com.ticketblitz.backend.config.JwtService;
import com.ticketblitz.backend.model.Role;
import com.ticketblitz.backend.model.User;
import com.ticketblitz.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * TOP 1% G AUTHENTICATION SERVICE:
 * Manages secure user lifecycle and synchronizes full identity payloads.
 */
@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * 1. REGISTER: Creates user and returns full identity sync.
     */
    public AuthenticationResponse register(RegisterRequest request) {
        var user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER) // Defaulting to USER role for standard signups
                .build();

        repository.save(user);

        var jwtToken = jwtService.generateToken(user);

        // FULL SYNC: Include real name and role immediately after signup
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }

    /**
     * 2. AUTHENTICATE: Verifies credentials and builds the persistent identity payload.
     */
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        // This will throw an exception if credentials fail the handshake
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Fetch User entity from the DB to retrieve the REAL registered Name
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User infrastructure not found"));

        var jwtToken = jwtService.generateToken(user);

        // ATOMIC RESPONSE: Plugs database values into your updated DTO
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .role(user.getRole().name())
                .name(user.getName())
                .build();
    }
}