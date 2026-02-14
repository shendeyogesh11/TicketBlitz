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
import org.springframework.transaction.annotation.Isolation;
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
     */
    public void initializeStock(Long eventId, Long tierId, int amount) {
        if (eventId == null || tierId == null) {
            System.err.println(" ABORTING REDIS SYNC: Received Null IDs");
            return;
        }

        String stockKey = String.format("event:%d:tier:%d", eventId, tierId);
        redisTemplate.opsForValue().set(stockKey, String.valueOf(amount));

        broadcastStockUpdate(eventId, tierId, (long) amount);
        System.out.println(" Redis Cache Initialized: Event " + eventId + " Tier " + tierId + " -> " + amount);
    }

    /**
     * TRANSACTION (PESSIMISTIC LOCKING)
     * 1. DB locks the row (serialized access).
     * 2. DB checks and deducts stock.
     * 3. Redis is updated only AFTER success for UI sync.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public boolean processPurchase(Long eventId, Long tierId, String userId, int quantity) {
        if (eventId == null || tierId == null) return false;

        // 1. ACQUIRE LOCK (Waits up to 5s if row is busy via Repo config)
        TicketTier tier = ticketTierRepository.findByIdWithLock(tierId)
                .orElseThrow(() -> new RuntimeException("Tier not found"));

        // 2. CHECK STOCK (Source of Truth: PostgreSQL)
        if (tier.getAvailableStock() >= quantity) {

            // 3. DEDUCT & SAVE
            int newStock = tier.getAvailableStock() - quantity;
            tier.setAvailableStock(newStock);
            ticketTierRepository.save(tier);

            // 4. CREATE ORDER
            Event event = eventRepository.findById(eventId)
                    .orElseThrow(() -> new RuntimeException("Event not found"));

            Order newOrder = Order.builder()
                    .userId(userId)
                    .event(event)
                    .tierName(tier.getTierName())
                    .quantity(quantity)
                    .totalAmount(tier.getPrice() * quantity)
                    .orderTime(LocalDateTime.now())
                    .build();

            orderRepository.save(newOrder);

            // 5. SYNC UI (Redis + WebSocket)
            try {
                String stockKey = String.format("event:%d:tier:%d", eventId, tierId);
                redisTemplate.opsForValue().set(stockKey, String.valueOf(newStock));
                broadcastStockUpdate(eventId, tierId, (long) newStock);
            } catch (Exception e) {
                System.err.println("⚠️ UI Sync failed, but Order is safe: " + e.getMessage());
            }

            return true;
        }

        // Stock depleted
        return false;
    }

    /**
     * Helper to broadcast JSON updates to the WebSocket topic.
     */
    private void broadcastStockUpdate(Long eventId, Long tierId, Long remaining) {
        Map<String, Object> update = new HashMap<>();
        update.put("tierId", tierId);
        update.put("remaining", remaining);

        // Cast 'update' to (Object) to resolve ambiguity
        // between convertAndSend(String, Object) and convertAndSend(Object, Map)
        messagingTemplate.convertAndSend("/topic/stock/" + eventId, (Object) update);
    }

    public int getStockCount(Long eventId, Long tierId) {
        if (eventId == null || tierId == null) return 0;
        String stockKey = String.format("event:%d:tier:%d", eventId, tierId);
        String val = redisTemplate.opsForValue().get(stockKey);
        return val != null ? Integer.parseInt(val) : 0;
    }
}