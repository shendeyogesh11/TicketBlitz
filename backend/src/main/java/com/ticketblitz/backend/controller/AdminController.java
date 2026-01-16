package com.ticketblitz.backend.controller;

import com.ticketblitz.backend.dto.OrderDto;
import com.ticketblitz.backend.dto.SystemStatsDto;
import com.ticketblitz.backend.dto.UserDto;
import com.ticketblitz.backend.model.Venue;
import com.ticketblitz.backend.service.AdminService;
import com.ticketblitz.backend.service.StockService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * TOP 1% G ADMIN ENGINE:
 * Orchestrates global system management, inventory synchronization,
 * and physical venue infrastructure.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final StockService stockService;

    @Data
    public static class StockInitRequest {
        private Long eventId;
        private Long tierId;
        private int amount;
    }

    // --- CORE ANALYTICS HANDSHAKES ---

    @GetMapping("/stats")
    public ResponseEntity<SystemStatsDto> getDashboardStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderDto>> getAllOrders() {
        return ResponseEntity.ok(adminService.getAllOrders());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<String> deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.ok("User deleted successfully");
    }

    // --- GLOBAL INVENTORY SYNC ENGINE ---

    @PostMapping("/sync-stock")
    public ResponseEntity<String> syncGlobalStock() {
        System.out.println("🚨 [Layer 1: Controller] Global Sync Request Verified. Initiating Service...");
        adminService.reinitializeAllStock();
        return ResponseEntity.ok("Global Inventory Synchronized successfully.");
    }

    @PostMapping("/init")
    public ResponseEntity<String> resetStock(@RequestBody StockInitRequest request) {
        stockService.initializeStock(request.getEventId(), request.getTierId(), request.getAmount());
        return ResponseEntity.ok("Stock for Tier " + request.getTierId() + " reset to " + request.getAmount());
    }

    // --- VENUE INFRASTRUCTURE BRIDGE ---

    /**
     * Fetches all registered venues for the dashboard dropdowns and management table.
     */
    @GetMapping("/venues")
    public ResponseEntity<List<Venue>> getAllVenues() {
        return ResponseEntity.ok(adminService.getAllVenues());
    }

    /**
     * Registers a new physical venue directly from the Command Center.
     */
    @PostMapping("/venues")
    public ResponseEntity<Venue> createVenue(@RequestBody Venue venue) {
        System.out.println("🏟️ [Infrastructure Update] Registering New Venue: " + venue.getName());
        return ResponseEntity.ok(adminService.saveVenue(venue));
    }

    /**
     * Removes venue infrastructure from the database.
     */
    @DeleteMapping("/venues/{id}")
    public ResponseEntity<Void> deleteVenue(@PathVariable Long id) {
        adminService.deleteVenue(id);
        return ResponseEntity.noContent().build();
    }
}