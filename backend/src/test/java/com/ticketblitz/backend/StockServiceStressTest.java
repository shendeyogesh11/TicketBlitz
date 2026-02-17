package com.ticketblitz.backend;

import com.ticketblitz.backend.model.Event;
import com.ticketblitz.backend.model.TicketTier;
import com.ticketblitz.backend.repository.EventRepository;
import com.ticketblitz.backend.repository.OrderRepository;
import com.ticketblitz.backend.repository.TicketTierRepository;
import com.ticketblitz.backend.service.StockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.LocalDate;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
public class StockServiceStressTest {

    @Autowired private StockService stockService;
    @Autowired private EventRepository eventRepository;
    @Autowired private TicketTierRepository ticketTierRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private StringRedisTemplate redisTemplate;

    private Long eventId;
    private Long tierId;

    // 🎯 THE CHALLENGE: 1,000 Users fighting for 1 Ticket
    private final int TOTAL_STOCK = 1;
    private final int CONCURRENT_USERS = 1000;

    @BeforeEach
    public void setup() {
        // 1. Clean Slate
        orderRepository.deleteAll();
        ticketTierRepository.deleteAll();
        eventRepository.deleteAll();

        // Clear Redis key specifically for this test
        // (In a real app, we'd use a dynamic key, but this is safe for local test)
        // Ideally we would get IDs first, but we clean up in the loop below.

        // 2. Setup Data
        Event event = Event.builder()
                .title("The 1-Ticket War")
                .eventDate(LocalDate.now().plusDays(5))
                .build();
        event = eventRepository.save(event);
        this.eventId = event.getId();

        TicketTier tier = TicketTier.builder()
                .tierName("Golden Ticket")
                .price(100.0)
                .availableStock(TOTAL_STOCK)
                .event(event) // Manual link (though Repo save handles it if cascaded)
                .build();
        tier = ticketTierRepository.save(tier);
        this.tierId = tier.getId();

        // 3. ⚡ PRIME REDIS (Critical Step)
        stockService.initializeStock(eventId, tierId, TOTAL_STOCK);
    }

    @Test
    @DisplayName("🔥 1000 Users vs 1 Ticket (Service Layer)")
    public void testHighConcurrency() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
        CountDownLatch startGun = new CountDownLatch(1);
        CountDownLatch finishLine = new CountDownLatch(CONCURRENT_USERS);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        System.out.println("🚀 STARTING STRESS TEST...");

        for (int i = 0; i < CONCURRENT_USERS; i++) {
            final String userId = "user" + i + "@test.com";
            executor.submit(() -> {
                try {
                    startGun.await(); // Wait for signal

                    // The Action
                    boolean purchased = stockService.processPurchase(eventId, tierId, userId, 1);

                    if (purchased) {
                        successCount.incrementAndGet();
                        System.out.println("✅ WINNER: " + userId);
                    } else {
                        failCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    System.out.println("💥 ERROR: " + e.getMessage());
                    failCount.incrementAndGet();
                } finally {
                    finishLine.countDown();
                }
            });
        }

        // FIRE!
        long startTime = System.currentTimeMillis();
        startGun.countDown();
        finishLine.await(); // Wait for all to finish
        long duration = System.currentTimeMillis() - startTime;

        System.out.println("🏁 FINISHED in " + duration + "ms");
        System.out.println("--------------------------------------------------");
        System.out.println("🎫 Tickets Available : " + TOTAL_STOCK);
        System.out.println("👥 Users Trying      : " + CONCURRENT_USERS);
        System.out.println("✅ Successful Buys   : " + successCount.get());
        System.out.println("❌ Failed Attempts   : " + failCount.get());
        System.out.println("📦 DB Orders Count   : " + orderRepository.count());
        System.out.println("--------------------------------------------------");

        // 4. ASSERTIONS
        assertEquals(TOTAL_STOCK, successCount.get(), "Should sell exactly the available stock");
        assertEquals(CONCURRENT_USERS - TOTAL_STOCK, failCount.get(), "Everyone else should fail");
        assertEquals(TOTAL_STOCK, orderRepository.count(), "Database orders must match sales");

        // Check Final DB Stock
        int finalDbStock = ticketTierRepository.findById(tierId).get().getAvailableStock();
        assertEquals(0, finalDbStock, "Database stock should be 0");
    }
}