package com.ticketblitz.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder // Added Builder for cleaner object creation in StockService
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;      // email or unique ID of the buyer

    // THE CRITICAL FIX: Relationship instead of just a Long ID
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    @JsonIgnoreProperties({"orders", "ticketTiers"}) // Prevent Event from loading its children again
    private Event event;

    private String tierName;    // e.g., "VIP" or "General Admission"

    private int quantity;       // Number of tickets bought
    private double totalAmount; // The final price paid (Price * Quantity)

    private LocalDateTime orderTime;

    /**
     * UPDATED CONSTRUCTOR:
     * Now accepts the Event entity directly to satisfy the JPA relationship.
     */
    public Order(String userId, Event event, String tierName, int quantity, double totalAmount) {
        this.userId = userId;
        this.event = event;
        this.tierName = tierName;
        this.quantity = quantity;
        this.totalAmount = totalAmount;
        this.orderTime = LocalDateTime.now();
    }
}