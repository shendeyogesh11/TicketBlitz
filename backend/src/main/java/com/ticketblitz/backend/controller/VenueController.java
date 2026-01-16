package com.ticketblitz.backend.controller;

import com.ticketblitz.backend.model.Venue;
import com.ticketblitz.backend.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * TOP 1% G INFRASTRUCTURE CONTROLLER:
 * Manages the global pool of physical locations and seating infrastructure.
 */
@RestController
@RequestMapping("/api/venues")
@RequiredArgsConstructor
public class VenueController {

    private final VenueRepository venueRepository;

    /**
     * PUBLIC: Get all venues.
     * Essential for the "Event Creation" dropdown and city-based filtering.
     */
    @GetMapping
    public List<Venue> getAllVenues() {
        return venueRepository.findAll();
    }

    /**
     * ADMIN ONLY: Register a new global venue.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Venue> createVenue(@RequestBody Venue venue) {
        System.out.println("🚀 Registering New Infrastructure: " + venue.getName());
        return ResponseEntity.ok(venueRepository.save(venue));
    }

    /**
     * PUBLIC: Get details for a specific venue.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Venue> getVenueById(@PathVariable Long id) {
        return venueRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * ADMIN ONLY: Update venue details.
     * Now fully weaponized to handle seating map URL updates.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Venue> updateVenue(@PathVariable Long id, @RequestBody Venue updatedVenue) {
        return venueRepository.findById(id)
                .map(venue -> {
                    venue.setName(updatedVenue.getName());
                    venue.setAddress(updatedVenue.getAddress());
                    venue.setCity(updatedVenue.getCity());
                    venue.setTotalCapacity(updatedVenue.getTotalCapacity());
                    // THE FIX: Persist the high-fidelity seating map link
                    venue.setSeatingMapUrl(updatedVenue.getSeatingMapUrl());

                    System.out.println("🔄 Patching Infrastructure for ID: " + id);
                    return ResponseEntity.ok(venueRepository.save(venue));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * ADMIN ONLY: Remove a venue from the global pool.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteVenue(@PathVariable Long id) {
        if (!venueRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        System.out.println("🚨 Decommissioning Venue ID: " + id);
        venueRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}