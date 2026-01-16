package com.ticketblitz.backend.controller;

import com.ticketblitz.backend.model.Order;
import com.ticketblitz.backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderRepository orderRepository;

    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(Authentication authentication) {
        // 1. SECURITY: Automatically get email from the JWT Token
        String email = authentication.getName();

        // 2. DATABASE: Fetch only this user's tickets
        List<Order> myOrders = orderRepository.findByUserId(email);

        return ResponseEntity.ok(myOrders);
    }
}