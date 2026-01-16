package com.ticketblitz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor // Necessary for @Builder to function correctly with JPA/Jackson
public class OrderDto {
    private Long id;
    private String userId;      // The Email of the holder
    private String ticketType;  // The tier name (e.g., "VIP", "Standard")
    private int quantity;       // Total tickets in this order
    private LocalDateTime orderDate; // When the purchase happened

    // ENRICHED EVENT DETAILS
    private String eventTitle;
    private String eventDate;   // Formatted String to fix "Invalid Date" in frontend

    /**
     * TOP 1% G ENRICHMENT:
     * Added to fix the "Missing Timing" bug in the user wallet.
     */
    private String eventTime;   // e.g., "07:00 PM"

    // ENRICHED VENUE DETAILS
    private String venueName;
    private String venueCity;
}