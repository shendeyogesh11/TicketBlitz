package com.ticketblitz.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ticketblitz.backend.controller.TicketController;
import com.ticketblitz.backend.model.Event;
import com.ticketblitz.backend.model.Role;
import com.ticketblitz.backend.model.TicketTier;
import com.ticketblitz.backend.model.User;
import com.ticketblitz.backend.repository.EventRepository;
import com.ticketblitz.backend.repository.TicketTierRepository;
import com.ticketblitz.backend.repository.UserRepository;
import com.ticketblitz.backend.service.StockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
public class ControllerLoadTest {

    @Autowired private WebApplicationContext webApplicationContext;
    @Autowired private EventRepository eventRepository;
    @Autowired private TicketTierRepository tierRepository;
    @Autowired private StockService stockService;
    @Autowired private UserRepository userRepository;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private Long eventId;
    private Long tierId;
    private Long userId;

    @BeforeEach
    public void setup() {
        // Build MockMvc with Spring Security
        this.mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        this.objectMapper = new ObjectMapper();

        // Clean up test data from previous runs
        userRepository.findByEmail("test@user.com")
                .ifPresent(user -> userRepository.delete(user));

        // Setup test data
        User testUser = User.builder()
                .email("test@user.com")
                .password("pass")
                .role(Role.CUSTOMER)
                .build();
        testUser = userRepository.save(testUser);
        this.userId = testUser.getId();

        Event event = Event.builder()
                .title("Controller Stress Test - " + System.currentTimeMillis())
                .eventDate(LocalDate.now())
                .build();
        event = eventRepository.save(event);
        this.eventId = event.getId();

        TicketTier tier = TicketTier.builder()
                .tierName("VIP")
                .availableStock(5)
                .price(50.0)
                .event(event)
                .build();
        tier = tierRepository.save(tier);
        this.tierId = tier.getId();

        stockService.initializeStock(eventId, tierId, 5);
    }

    @Test
    @DisplayName("🌐 100 Concurrent HTTP Requests")
    public void testControllerConcurrency() throws InterruptedException {
        int threads = 100;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        TicketController.PurchaseRequest req = new TicketController.PurchaseRequest();
        req.setEventId(eventId);
        req.setTierId(tierId);
        req.setQuantity(1);

        String jsonBody;
        try {
            jsonBody = objectMapper.writeValueAsString(req);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        // Create mock user for authentication
        SecurityMockMvcRequestPostProcessors.UserRequestPostProcessor mockUser =
                user(userId.toString()).roles("CUSTOMER");

        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                try {
                    latch.await();
                    try {
                        mockMvc.perform(post("/api/stock/purchase")
                                        .with(mockUser)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(jsonBody))
                                .andDo(result -> {
                                    int status = result.getResponse().getStatus();
                                    if (status == 200) {
                                        successCount.incrementAndGet();
                                    } else {
                                        failCount.incrementAndGet();
                                    }
                                });
                    } catch (Exception e) {
                        failCount.incrementAndGet();
                        e.printStackTrace();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
        }

        latch.countDown();
        done.await();
        executor.shutdown();

        System.out.println("✅ Success: " + successCount.get());
        System.out.println("❌ Failed: " + failCount.get());

        assertEquals(5, successCount.get(), "Expected exactly 5 successful purchases");
        assertEquals(95, failCount.get(), "Expected exactly 95 failed purchases");
    }
}