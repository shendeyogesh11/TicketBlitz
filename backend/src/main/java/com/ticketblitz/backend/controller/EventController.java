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

    // Inside EventController.java

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
     * SECURE UPDATE HANDSHAKE:
     * Refreshes metadata and re-broadcasts the latest stock levels.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Event> updateEvent(@PathVariable Long id, @RequestBody Event updatedData) {
        return eventRepository.findById(id).map(existingEvent -> {

            // 1. Update Standard Fields
            existingEvent.setTitle(updatedData.getTitle());
            existingEvent.setDescription(updatedData.getDescription());
            existingEvent.setImageUrl(updatedData.getImageUrl());
            existingEvent.setEventDate(updatedData.getEventDate());
            existingEvent.setEventTime(updatedData.getEventTime());
            existingEvent.setCategory(updatedData.getCategory());

            // 2. Update Venue Relation
            if (updatedData.getVenue() != null && updatedData.getVenue().getId() != null) {
                venueRepository.findById(updatedData.getVenue().getId())
                        .ifPresent(existingEvent::setVenue);
            }

            // 3. Update Ticket Tiers
            if (updatedData.getTicketTiers() != null) {
                existingEvent.getTicketTiers().clear();
                existingEvent.getTicketTiers().addAll(updatedData.getTicketTiers());
            }

            // ---------------------------------------------------------
            // 🛑 CRITICAL FIX FOR GALLERY IMAGES
            // Do NOT use setGalleryImages(). Use clear() + addAll()
            // ---------------------------------------------------------
            if (updatedData.getGalleryImages() != null) {
                // We assume the list is not null in Entity (initialized to new ArrayList<>())
                if (existingEvent.getGalleryImages() == null) {
                    // Safety check if your DB has nulls
                    existingEvent.setGalleryImages(updatedData.getGalleryImages());
                } else {
                    existingEvent.getGalleryImages().clear(); // Wipe old (Hibernate tracks this)
                    existingEvent.getGalleryImages().addAll(updatedData.getGalleryImages()); // Add new (Hibernate sees these as new inserts)
                }
            }
            // ---------------------------------------------------------

            return ResponseEntity.ok(eventRepository.save(existingEvent));
        }).orElse(ResponseEntity.notFound().build());
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