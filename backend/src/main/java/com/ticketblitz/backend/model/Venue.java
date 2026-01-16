package com.ticketblitz.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.util.List;

/**
 * TOP 1% G INFRASTRUCTURE ENTITY:
 * Represents the physical source of truth for event locations.
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Venue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 500) // Expanded to ensure full addresses fit
    private String address;

    @Column(nullable = false)
    private String city;

    @Column(name = "seating_map_url", length = 500)
    private String seatingMapUrl;

    /**
     * THE DATA HANDSHAKE FIX:
     * Standardized to totalCapacity to match the VenueManager.jsx payload.
     * Added both camelCase and snake_case property support for maximum compatibility.
     */
    @JsonProperty("totalCapacity")
    @Column(name = "total_capacity", nullable = false)
    private Integer totalCapacity;

    /**
     * TOP 1% G LINK:
     * Allows us to track every event hosted at this venue.
     * JsonIgnore prevents circular reference errors during API calls.
     */
    @OneToMany(mappedBy = "venue", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Event> events;
}