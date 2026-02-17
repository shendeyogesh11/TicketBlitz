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

import java.time.LocalDate;
import java.util.List;

/**
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

    @GetMapping("/past")
    public ResponseEntity<List<Event>> getPastEvents() {
        // Fetch all, filter for date < now, sort by most recent
        List<Event> allEvents = eventRepository.findAll();
        List<Event> pastEvents = allEvents.stream()
                .filter(e -> e.getEventDate().isBefore(LocalDate.now()))
                .sorted((a, b) -> b.getEventDate().compareTo(a.getEventDate())) // Newest past event first
                .toList();
        return ResponseEntity.ok(pastEvents);
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
     *  SECURE UPDATE HANDSHAKE (FIXED):
     * Delegates complex merging logic to AdminService to ensure
     * data integrity (Parent-Child links) and Redis synchronization.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Event> updateEvent(@PathVariable Long id, @RequestBody Event updatedData) {
        try {
            // The service now handles the complex merging, tier linking, and Redis sync
            Event updatedEvent = adminService.updateEvent(id, updatedData);
            return ResponseEntity.ok(updatedEvent);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
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