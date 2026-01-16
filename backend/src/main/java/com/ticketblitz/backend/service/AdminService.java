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
    private final VenueRepository venueRepository; // INJECTED: For physical infrastructure management
    private final StockService stockService;
    private final StringRedisTemplate redisTemplate;

    /**
     * VENUE INFRASTRUCTURE HELPERS:
     * Provides clean CRUD operations for the Admin Dashboard.
     */
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
     * TOP 1% G PERSISTENCE GUARD:
     * Saves the event and flushes it to ensure IDs are generated immediately.
     */
    @Transactional
    public Event prepareAndSaveEvent(Event event) {
        if (event.getTicketTiers() != null) {
            event.getTicketTiers().forEach(tier -> tier.setEvent(event));
        }
        return eventRepository.saveAndFlush(event);
    }

    /**
     * GLOBAL CACHE ENGINE (EAGER FETCH):
     * The definitive sync tool for re-populating Redis from the Database.
     */
    @Transactional(readOnly = true)
    public void reinitializeAllStock() {
        // FORCE JOIN FETCH: Crucial to load IDs before sync
        List<Event> allEvents = eventRepository.findAllWithTiers();
        System.out.println("🏁 [Layer 2: Service] Syncing " + allEvents.size() + " events to Redis.");

        for (Event event : allEvents) {
            if (event.getTicketTiers() != null && !event.getTicketTiers().isEmpty()) {
                System.out.println("🔎 Hydrating: " + event.getTitle());
                event.getTicketTiers().forEach(tier -> {
                    if (event.getId() != null && tier.getId() != null) {
                        stockService.initializeStock(event.getId(), tier.getId(), tier.getAvailableStock());
                        System.out.println("   ✅ BRICK LAID: Tier " + tier.getId() + " -> " + tier.getAvailableStock());
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