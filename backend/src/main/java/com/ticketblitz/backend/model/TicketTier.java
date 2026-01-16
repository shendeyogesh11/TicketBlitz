package com.ticketblitz.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a specific pricing tier for an event.
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder // Enables clean object creation in services
public class TicketTier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Tier name is required (e.g., VIP)")
    private String tierName; // e.g., VIP, Early Bird, General

    @Min(value = 0, message = "Price cannot be negative")
    private Double price;

    /**
     * THE SELL-OUT FIX:
     * Changed from @Min(1) to @Min(0) to allow the tier to reach zero stock.
     * This resolves the ConstraintViolationException during the purchase commit phase.
     */
    @Min(value = 0, message = "Inventory cannot be negative")
    private Integer availableStock;

    /**
     * TOP 1% G ENRICHMENT:
     * Stores the facilities/perks for this specific tier.
     * This info appears in the user's wallet (e.g., "Free Drinks", "Backstage Access").
     */
    @Column(length = 500) // Allows for detailed benefit descriptions
    private String benefits;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    @JsonIgnore // Prevents circular reference in JSON
    private Event event;
}