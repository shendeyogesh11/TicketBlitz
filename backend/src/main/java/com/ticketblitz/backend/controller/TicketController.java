package com.ticketblitz.backend.controller;

import com.ticketblitz.backend.dto.OrderDto;
import com.ticketblitz.backend.model.Order;
import com.ticketblitz.backend.repository.OrderRepository;
import com.ticketblitz.backend.service.AdminService;
import com.ticketblitz.backend.service.StockService;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stock")
@Slf4j
public class TicketController {

    @Autowired
    private StockService stockService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AdminService adminService; // Required for DTO mapping logic

    @Data
    public static class PurchaseRequest {
        private Long eventId;
        private Long tierId;
        private int quantity;
    }

    /**
     * UPDATED SECURE WALLET ENDPOINT:
     * Returns enriched OrderDto objects with full Event and Venue details.
     * This eliminates "Invalid Date" and placeholder text in the UI.
     */
    @GetMapping("/my-tickets")
    public ResponseEntity<List<OrderDto>> getMyTickets(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        String userEmail = principal.getName().toLowerCase().trim();
        log.info("Deep-Fetching Wallet for User: {}", userEmail);

        // 1. Fetch orders WITH Event and Venue details joined
        List<Order> orders = orderRepository.findByUserIdWithDetails(userEmail);

        // 2. Map entities to enriched DTOs to resolve placeholders
        List<OrderDto> userTickets = orders.stream()
                .map(order -> adminService.mapToOrderDto(order))
                .collect(Collectors.toList());

        return ResponseEntity.ok(userTickets);
    }

    /**
     * Booking engine handles the atomic purchase handshake.
     */
    @PostMapping("/purchase")
    public ResponseEntity<String> buyTicket(@RequestBody PurchaseRequest request, Principal principal) {
        if (principal == null) {
            log.error("Purchase attempt without authentication for Event ID: {}", request.getEventId());
            return ResponseEntity.status(401).body("Error: Authentication required.");
        }

        String userId = principal.getName().toLowerCase().trim();

        log.info("Processing purchase request: User={}, Event={}, Tier={}, Qty={}",
                userId, request.getEventId(), request.getTierId(), request.getQuantity());

        boolean success = stockService.processPurchase(
                request.getEventId(),
                request.getTierId(),
                userId,
                request.getQuantity()
        );

        if (success) {
            log.info("Purchase Successful for User: {}", userId);
            return ResponseEntity.ok("Successfully secured " + request.getQuantity() + " tickets!");
        } else {
            log.warn("Purchase FAILED for User: {} - Stock depleted or limit exceeded.", userId);
            return ResponseEntity.status(400).body("Booking failed: Tickets no longer available.");
        }
    }

    @GetMapping("/count/{eventId}/{tierId}")
    public int getStockCount(@PathVariable Long eventId, @PathVariable Long tierId) {
        return stockService.getStockCount(eventId, tierId);
    }
}