package com.ticketblitz.backend.service;

import com.ticketblitz.backend.dto.*;
import com.ticketblitz.backend.model.*;
import com.ticketblitz.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final StockService stockService;
    private final StringRedisTemplate redisTemplate;

    // --- VENUE MANAGEMENT ---
    @Transactional(readOnly = true)
    public List<Venue> getAllVenues() {
        return venueRepository.findAll();
    }

    @Transactional
    public Venue saveVenue(Venue venue) {
        return venueRepository.save(venue);
    }

    @Transactional
    public void deleteVenue(Long id) {
        venueRepository.deleteById(id);
    }

    /**
     * 🛑 TOP 1% G PERSISTENCE GUARD (CREATE):
     * 1. Links Tiers to Event (Fixes NULL event_id bug).
     * 2. Saves to Postgres & Flushes (Generates IDs).
     * 3. ⚡ SYNC: Pushes stock to Redis immediately.
     */
    @Transactional
    public Event prepareAndSaveEvent(Event event) {
        // 1. Link Tiers
        if (event.getTicketTiers() != null) {
            event.getTicketTiers().forEach(tier -> tier.setEvent(event));
        }

        // 2. Save to DB
        Event savedEvent = eventRepository.saveAndFlush(event);

        // 3. Sync Redis
        if (savedEvent.getTicketTiers() != null) {
            for (TicketTier tier : savedEvent.getTicketTiers()) {
                stockService.initializeStock(
                        savedEvent.getId(),
                        tier.getId(),
                        tier.getAvailableStock()
                );
            }
        }

        System.out.println("✅ Event Created & Redis Hydrated: " + savedEvent.getTitle() + " | ID: " + savedEvent.getId());
        return savedEvent;
    }

    /**
     * 🛑 ATOMIC UPDATE ENGINE (UPDATE):
     * Handles complex merging of existing events, forcing relationships on new tiers,
     * and ensuring Redis is perfectly synchronized.
     */
    @Transactional
    public Event updateEvent(Long id, Event updatedData) {
        Event existingEvent = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // 1. Update Basic Fields
        existingEvent.setTitle(updatedData.getTitle());
        existingEvent.setDescription(updatedData.getDescription());
        existingEvent.setImageUrl(updatedData.getImageUrl());
        existingEvent.setEventDate(updatedData.getEventDate());
        existingEvent.setEventTime(updatedData.getEventTime());
        existingEvent.setCategory(updatedData.getCategory());

        // 2. Update Venue (Relationship Handshake)
        if (updatedData.getVenue() != null && updatedData.getVenue().getId() != null) {
            Venue venue = venueRepository.findById(updatedData.getVenue().getId())
                    .orElseThrow(() -> new RuntimeException("Venue not found"));
            existingEvent.setVenue(venue);
        }

        // 3. Update Gallery (Safe Merge)
        if (updatedData.getGalleryImages() != null) {
            existingEvent.getGalleryImages().clear();
            existingEvent.getGalleryImages().addAll(updatedData.getGalleryImages());
        }

        // 4. 🛑 CRITICAL FIX: Update Tiers & Force Link
        // This solves the "Ghost Tier" issue on updates.
        if (updatedData.getTicketTiers() != null) {
            existingEvent.getTicketTiers().clear();
            existingEvent.getTicketTiers().addAll(updatedData.getTicketTiers());

            // 🔗 THE MISSING LINK: Re-stamp the parent on every tier (old or new)
            existingEvent.getTicketTiers().forEach(tier -> tier.setEvent(existingEvent));
        }

        // 5. Save & Flush (Commit to DB)
        Event savedEvent = eventRepository.saveAndFlush(existingEvent);

        // 6. ⚡ Redis Sync (Update Cache)
        if (savedEvent.getTicketTiers() != null) {
            for (TicketTier tier : savedEvent.getTicketTiers()) {
                stockService.initializeStock(
                        savedEvent.getId(),
                        tier.getId(),
                        tier.getAvailableStock()
                );
            }
        }

        System.out.println("✅ Event Updated & Redis Synced: " + savedEvent.getTitle());
        return savedEvent;
    }

    /**
     * GLOBAL CACHE ENGINE:
     * Useful for server restarts or manual admin syncs.
     */
    @Transactional(readOnly = true)
    public void reinitializeAllStock() {
        List<Event> allEvents = eventRepository.findAll();
        System.out.println("🏁 [Layer 2: Service] Syncing " + allEvents.size() + " events to Redis.");

        for (Event event : allEvents) {
            if (event.getTicketTiers() != null) {
                event.getTicketTiers().forEach(tier -> {
                    if (event.getId() != null && tier.getId() != null) {
                        stockService.initializeStock(event.getId(), tier.getId(), tier.getAvailableStock());
                    }
                });
            }
        }
        System.out.println("🚀 Global Inventory Safety Sync Complete.");
    }

    public void syncStockToRedis(Event event) {
        if (event == null || event.getId() == null) return;
        eventRepository.findById(event.getId()).ifPresent(freshEvent -> {
            if (freshEvent.getTicketTiers() != null) {
                freshEvent.getTicketTiers().forEach(tier -> {
                    if (tier.getId() != null) {
                        stockService.initializeStock(freshEvent.getId(), tier.getId(), tier.getAvailableStock());
                    }
                });
            }
        });
    }

    @Transactional
    public void deleteFullEvent(Long eventId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        if (event.getTicketTiers() != null) {
            event.getTicketTiers().forEach(tier ->
                    redisTemplate.delete(String.format("event:%d:tier:%d", eventId, tier.getId()))
            );
        }
        eventRepository.delete(event);
    }

    // --- DASHBOARD STATS ---
    @Transactional(readOnly = true)
    public SystemStatsDto getSystemStats() {
        Long ticketsSold = orderRepository.sumTotalTicketsSold();
        Double revenue = orderRepository.sumTotalRevenue();
        return SystemStatsDto.builder()
                .totalUsers(userRepository.count())
                .totalTicketsSold(ticketsSold != null ? ticketsSold : 0)
                .totalRevenue(revenue != null ? revenue.longValue() : 0)
                .build();
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> UserDto.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapToOrderDto)
                .collect(Collectors.toList());
    }

    public OrderDto mapToOrderDto(Order order) {
        OrderDto.OrderDtoBuilder builder = OrderDto.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .ticketType(order.getTierName())
                .quantity(order.getQuantity())
                .orderDate(order.getOrderTime());

        if (order.getEvent() != null) {
            builder.eventTitle(order.getEvent().getTitle());
            builder.eventDate(order.getEvent().getEventDate() != null ? order.getEvent().getEventDate().toString() : "");
            builder.eventTime(order.getEvent().getEventTime());
            if (order.getEvent().getVenue() != null) {
                builder.venueName(order.getEvent().getVenue().getName());
                builder.venueCity(order.getEvent().getVenue().getCity());
            }
        }
        return builder.build();
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }
}