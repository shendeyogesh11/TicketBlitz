package com.ticketblitz.backend.controller;

import com.ticketblitz.backend.model.Event;
import com.ticketblitz.backend.model.Venue;
import com.ticketblitz.backend.repository.EventRepository;
import com.ticketblitz.backend.repository.VenueRepository;
import com.ticketblitz.backend.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * TOP 1% G SYNC ORCHESTRATOR:
 * Manages the final handshake between Persistent DB state and the Redis Cache.
 */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(eventRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        return eventRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Event>> search(@RequestParam String q) {
        return ResponseEntity.ok(eventRepository.searchEvents(q));
    }

    /**
     * SECURE CREATION HANDSHAKE:
     * Saves to DB first, then syncs to Redis only after IDs are guaranteed.
     */
    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Event> createEvent(@Valid @RequestBody Event event) {
        // 1. Resolve Venue from the global pool
        if (event.getVenue() != null && event.getVenue().getId() != null) {
            Venue venue = venueRepository.findById(event.getVenue().getId())
                    .orElseThrow(() -> new RuntimeException("Venue not found"));
            event.setVenue(venue);
        }

        // 2. DATABASE PERSISTENCE: Transaction starts and finishes here
        Event savedEvent = adminService.prepareAndSaveEvent(event);

        // 3. POST-COMMIT SYNC: IDs are now 100% hydrated from the DB
        adminService.syncStockToRedis(savedEvent);

        return ResponseEntity.ok(savedEvent);
    }

    /**
     * SECURE UPDATE HANDSHAKE:
     * Refreshes metadata and re-broadcasts the latest stock levels.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Event> updateEvent(@PathVariable Long id, @Valid @RequestBody Event eventDetails) {
        return eventRepository.findById(id)
                .map(existingEvent -> {
                    // Update Core Fields
                    existingEvent.setTitle(eventDetails.getTitle());
                    existingEvent.setDescription(eventDetails.getDescription());
                    existingEvent.setCategory(eventDetails.getCategory());
                    existingEvent.setEventDate(eventDetails.getEventDate());
                    existingEvent.setEventTime(eventDetails.getEventTime());
                    existingEvent.setImageUrl(eventDetails.getImageUrl());

                    // Sync Venue
                    if (eventDetails.getVenue() != null) {
                        existingEvent.setVenue(eventDetails.getVenue());
                    }

                    // Sync Dynamic Tiers
                    if (eventDetails.getTicketTiers() != null) {
                        existingEvent.getTicketTiers().clear();
                        eventDetails.getTicketTiers().forEach(existingEvent::addTicketTier);
                    }

                    // 1. SAVE: Finalize DB transaction
                    Event updatedEvent = adminService.prepareAndSaveEvent(existingEvent);

                    // 2. SYNC: Refresh the cache using persistent IDs
                    adminService.syncStockToRedis(updatedEvent);

                    return ResponseEntity.ok(updatedEvent);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * TOP 1% G DELETE LOGIC:
     * Coordinated purge of orders and stock keys.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        if (!eventRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        // Atomic cleanup of Cache and Database
        adminService.deleteFullEvent(id);

        return ResponseEntity.ok().build();
    }
}