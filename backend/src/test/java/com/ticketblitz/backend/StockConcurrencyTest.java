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
import org.springframework.dao.PessimisticLockingFailureException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ⚡ STRESS TEST MODULE
 * Verifies that Pessimistic Locking prevents overselling under high load.
 */
@SpringBootTest
public class StockConcurrencyTest {

    @Autowired
    private StockService stockService;

    @Autowired
    private TicketTierRepository ticketTierRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private OrderRepository orderRepository;

    private Long eventId;
    private Long tierId;

    //  CONFIGURATION
    private final int TOTAL_SEATS = 1;          // Only 10 seats available
    private final int CONCURRENT_USERS = 500;    // 100 Users trying to buy at once

    @BeforeEach
    public void setup() {
        // Clean Slate
        orderRepository.deleteAll();
        ticketTierRepository.deleteAll();
        eventRepository.deleteAll();

        // 1. Create Mock Event
        Event event = new Event();
        event.setTitle("High Voltage Stress Test");
        event.setDescription("Testing Locking Mechanism");
        event.setEventDate(LocalDate.now().plusDays(10));
        event.setEventTime(String.valueOf(LocalTime.of(19, 0)));
        event = eventRepository.save(event);
        this.eventId = event.getId();

        // 2. Create Tier with LIMITED Stock
        TicketTier tier = new TicketTier();
        tier.setTierName("Golden Circle");
        tier.setPrice(1000.0);
        tier.setAvailableStock(TOTAL_SEATS); // Only 10 tickets!
        tier.setEvent(event);
        tier = ticketTierRepository.save(tier);
        this.tierId = tier.getId();

        // Initialize Redis to match DB (optional, but good practice)
        stockService.initializeStock(eventId, tierId, TOTAL_SEATS);
    }

    @Test
    @DisplayName(" THE STADIUM RUSH: 100 Users vs 10 Tickets")
    public void testConcurrency_NoOverselling() throws InterruptedException {

        // Thread Pool to simulate users
        ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);

        // Latch 1: The "Starting Gun" (Holds all threads until we say "GO")
        CountDownLatch startGun = new CountDownLatch(1);

        // Latch 2: The "Finish Line" (Waits for all threads to complete)
        CountDownLatch finishLine = new CountDownLatch(CONCURRENT_USERS);

        AtomicInteger successfulBuys = new AtomicInteger(0);
        AtomicInteger failedBuys = new AtomicInteger(0);
        AtomicInteger lockTimeouts = new AtomicInteger(0);

        System.out.println(" [TEST START] Spawning " + CONCURRENT_USERS + " threads to fight for " + TOTAL_SEATS + " tickets...");

        for (int i = 0; i < CONCURRENT_USERS; i++) {
            final String userId = "user-" + i + "@loadtest.com";

            executor.submit(() -> {
                try {
                    startGun.await(); // Wait for the Gun!

                    //  The Critical Action
                    boolean success = stockService.processPurchase(eventId, tierId, userId, 1);

                    if (success) {
                        successfulBuys.incrementAndGet();
                        System.out.println(" SOLD to " + userId);
                    } else {
                        failedBuys.incrementAndGet();
                    }

                } catch (PessimisticLockingFailureException e) {
                    lockTimeouts.incrementAndGet();
                    System.out.println(" Timeout/Lock Error for " + userId);
                } catch (Exception e) {
                    failedBuys.incrementAndGet();
                    System.out.println(" Error: " + e.getMessage());
                } finally {
                    finishLine.countDown();
                }
            });
        }

        //  FIRE! All threads hit the DB simultaneously
        startGun.countDown();

        // Wait for everyone to finish
        finishLine.await();
        executor.shutdown();

        // ---  ANALYSIS & ASSERTIONS ---

        // 1. Fetch final state from DB
        TicketTier finalTier = ticketTierRepository.findById(tierId).orElseThrow();
        long actualOrders = orderRepository.count();

        System.out.println("\n======  TEST RESULTS ======");
        System.out.println("Items Available: " + TOTAL_SEATS);
        System.out.println("Users Trying   : " + CONCURRENT_USERS);
        System.out.println("-----------------------------");
        System.out.println(" Successful  : " + successfulBuys.get());
        System.out.println(" Failed      : " + failedBuys.get());
        System.out.println(" Lock Timeouts: " + lockTimeouts.get());
        System.out.println("-----------------------------");
        System.out.println(" DB Stock    : " + finalTier.getAvailableStock());
        System.out.println(" DB Orders   : " + actualOrders);
        System.out.println("=============================\n");

        // 2. THE GOLDEN RULES (If any of these fail, the code is broken)

        // Rule A: We must not sell more than we have
        assertEquals(TOTAL_SEATS, successfulBuys.get(), "CRITICAL: Should sell exactly " + TOTAL_SEATS);

        // Rule B: Orders in DB must match successful buys
        assertEquals(TOTAL_SEATS, actualOrders, "CRITICAL: Database Orders must match success count");

        // Rule C: Stock must not be negative
        assertEquals(0, finalTier.getAvailableStock(), "CRITICAL: Stock should end at exactly 0");

        // Rule D: Failures + Successes must equal total attempts (roughly)
        assertTrue(successfulBuys.get() + failedBuys.get() + lockTimeouts.get() == CONCURRENT_USERS, "Math check");
    }
}