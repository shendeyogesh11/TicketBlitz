package com.ticketblitz.backend.service;

import com.ticketblitz.backend.model.Event;
import com.ticketblitz.backend.model.Order;
import com.ticketblitz.backend.model.TicketTier;
import com.ticketblitz.backend.repository.EventRepository;
import com.ticketblitz.backend.repository.OrderRepository;
import com.ticketblitz.backend.repository.TicketTierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StockService {

    private final StringRedisTemplate redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final OrderRepository orderRepository;
    private final TicketTierRepository ticketTierRepository;
    private final EventRepository eventRepository;

    /**
     * THE NULL ID SHIELD:
     * Initializes Redis cache ONLY if valid IDs are provided.
     * Prevents "event:null:tier:null" keys from poisoning the cache.
     */
    public void initializeStock(Long eventId, Long tierId, int amount) {
        // --- FINAL GATEKEEPER CHECK ---
        if (eventId == null || tierId == null) {
            System.err.println("❌ ABORTING REDIS SYNC: Received Null IDs (Event: " + eventId + ", Tier: " + tierId + ")");
            return; // Exit early to prevent cache poisoning
        }

        String stockKey = String.format("event:%d:tier:%d", eventId, tierId);
        redisTemplate.opsForValue().set(stockKey, String.valueOf(amount));

        broadcastStockUpdate(eventId, tierId, (long) amount);
        System.out.println("🔄 Redis Cache Initialized: Event " + eventId + " Tier " + tierId + " -> " + amount);
    }

    /**
     * TOP 1% G ATOMIC PURCHASE ENGINE:
     * Uses a compensating transaction to refund Redis if the database fails.
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean processPurchase(Long eventId, Long tierId, String userId, int quantity) {
        if (eventId == null || tierId == null) return false;

        String stockKey = String.format("event:%d:tier:%d", eventId, tierId);

        // 1. ATOMIC REDIS DECREMENT
        Long remainingStock = redisTemplate.opsForValue().decrement(stockKey, quantity);

        // 2. STOCK SHIELD: Prevent negative inventory
        if (remainingStock != null && remainingStock >= 0) {
            try {
                TicketTier tier = ticketTierRepository.findById(tierId)
                        .orElseThrow(() -> new RuntimeException("Tier not found"));

                Event event = eventRepository.findById(eventId)
                        .orElseThrow(() -> new RuntimeException("Event not found"));

                // 3. SYNC DB: This will now succeed because we allowed 0 in SQL
                tier.setAvailableStock(remainingStock.intValue());
                ticketTierRepository.saveAndFlush(tier); // Force immediate check

                // 4. PERSIST ORDER
                Order newOrder = Order.builder()
                        .userId(userId)
                        .event(event)
                        .tierName(tier.getTierName())
                        .quantity(quantity)
                        .totalAmount(tier.getPrice() * quantity)
                        .orderTime(LocalDateTime.now())
                        .build();

                orderRepository.save(newOrder);

                // 5. SUCCESS BROADCAST
                broadcastStockUpdate(eventId, tierId, remainingStock);
                return true;

            } catch (Exception e) {
                // 6. EMERGENCY REFUND: If DB fails, put the ticket back in Redis
                redisTemplate.opsForValue().increment(stockKey, quantity);
                System.err.println("🚨 TRANSACTION ABORTED: " + e.getMessage());
                // Re-throw to trigger the @Transactional rollback
                throw new RuntimeException("Database rejected the save. Redis restored.", e);
            }
        } else {
            // 7. OVERSOLD RECOVERY
            redisTemplate.opsForValue().increment(stockKey, quantity);
            return false;
        }
    }

    /**
     * Helper to broadcast JSON updates to the WebSocket topic.
     */
    private void broadcastStockUpdate(Long eventId, Long tierId, Long remaining) {
        Map<String, Object> update = new HashMap<>();
        update.put("tierId", tierId);
        update.put("remaining", remaining);

        messagingTemplate.convertAndSend(
                "/topic/stock/" + eventId,
                (Object) update,
                (Map<String, Object>) null
        );
    }

    public int getStockCount(Long eventId, Long tierId) {
        if (eventId == null || tierId == null) return 0;
        String stockKey = String.format("event:%d:tier:%d", eventId, tierId);
        String val = redisTemplate.opsForValue().get(stockKey);
        return val != null ? Integer.parseInt(val) : 0;
    }
}
