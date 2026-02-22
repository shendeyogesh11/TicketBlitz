<div align="center">

# 🎟️ TicketBlitz

**Full-stack event ticketing platform with Redis-based concurrency control and real-time WebSocket inventory sync.**

[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=openjdk)](https://openjdk.org)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.1-6DB33F?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?style=flat-square&logo=redis)](https://redis.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org)

</div>

---

## Overview

TicketBlitz is a full-stack ticketing system that handles the core problem of flash sales: selling limited inventory to many concurrent buyers without race conditions or oversells.

The purchase path runs through a **Redis atomic `DECREMENT`** before touching the database. Since Redis executes commands single-threadedly, this acts as a lock-free concurrency gate — 1,000 simultaneous buyers competing for 1 ticket produce exactly 1 order. If the subsequent PostgreSQL write fails, the Redis counter is restored via a compensating increment.

Stock changes are broadcast to all connected browser tabs over **WebSocket (STOMP)** in real time.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Frontend](#frontend)
5. [Backend](#backend)
6. [Data Model](#data-model)
7. [Redis Purchase Engine](#redis-purchase-engine)
8. [API Reference](#api-reference)
9. [Setup & Installation](#setup--installation)
10. [Testing](#testing)
11. [Screenshots](#screenshots)

---

## Tech Stack

| Layer | Technology | Version |
|:------|:-----------|:--------|
| Frontend | React, Vite | 19.2 / 7.2 |
| Routing | React Router DOM | 7.12 |
| HTTP | Axios | 1.13 |
| WebSocket (client) | stompjs, sockjs-client | 2.3 / 1.6 |
| PDF & QR | jsPDF, html2canvas, qrcode.react | 4.0 / 1.4 / 4.2 |
| Charts | Recharts | 3.6 |
| Icons | Lucide React | 0.562 |
| Backend | Spring Boot, Java 17 | 4.0.1 |
| Security | Spring Security, JJWT (HS256) | 0.11.5 |
| Database | PostgreSQL | 15+ |
| ORM | Spring Data JPA / Hibernate | — |
| Cache / Concurrency | Redis, Lettuce client | 7+ |
| Real-time | Spring WebSocket (STOMP) | — |
| Build | Maven Wrapper, npm | — |

---

## Features

- **Atomic inventory control** — Redis `DECREMENT` as the concurrency gate; no database locks on the purchase hot path
- **Compensating transactions** — Redis is restored if the PostgreSQL write fails, preventing phantom reservations
- **Real-time stock sync** — WebSocket broadcasts `{ tierId, remaining }` to all tabs on every purchase
- **Client-side ticket generation** — PDF with embedded QR code rendered entirely in the browser via `html2canvas` + `jsPDF`
- **Simulated payment flow** — 2-second modal with a unique `TXN_BLITZ_XXXX` ID before the API call fires
- **Event reviews** — Star ratings (1–5), text, and images; edit/delete restricted to the original author
- **Partner portal** — B2B inquiry submission with admin-side status management (PENDING / REVIEWED / APPROVED)
- **Admin dashboard** — System stats (users, revenue, tickets sold via Recharts), full event/venue/user/partner CRUD
- **Role-based access** — `CUSTOMER` and `ADMIN` roles embedded in JWT; enforced server-side via `@PreAuthorize`

---

## Architecture

### Request Flow

```
React (Vite) ──── Axios ───────────────────────────► Spring Boot :8080
                                                              │
               POST /api/stock/purchase                       │
                 └─ StockService.processPurchase()            │
                      ├─ Redis DECREMENT (atomic)             │
                      │    ├─ result >= 0 → continue          │
                      │    └─ result < 0  → refund, reject    │
                      ├─ PostgreSQL: update tier stock         │
                      ├─ PostgreSQL: insert order             │
                      └─ WebSocket broadcast                   │
                                                              │
WebSocket (SockJS/STOMP) ◄── /topic/stock/{eventId} ─────────┘
```

### Redis Key Format

```
event:{eventId}:tier:{tierId}  →  "42"   (string integer)
```

### Module Map

```
backend/
├── auth/           Register + authenticate endpoints and service
├── config/         Security, CORS, JWT filter, WebSocket broker
├── controller/     Admin, Event, Order, Ticket, Venue, Review, Partner
├── service/        StockService (Redis + WS), AdminService (event lifecycle + stats)
├── model/          JPA entities
├── repository/     Spring Data JPA with custom JPQL queries
├── dto/            OrderDto, SystemStatsDto, UserDto, StatusUpdateRequest
└── exception/      GlobalExceptionHandler

frontend/src/
├── pages/          HomePage, TicketPage, MyTickets, AdminDashboard, PartnerWithUs, HelpCenter
├── components/     Navbar, AdminRoute, AdminEventForm, EventTable, VenueManager, ProposalsTracker, PastEventsSection
└── utils/          auth.js (isTokenExpired), authUtils.js (getUserRoleFromToken)
```

---

## Frontend

### Pages

| Route | Page | Description |
|:------|:-----|:------------|
| `/` and `/home` | `HomePage` | Event grid with live search (title + city) and category filters |
| `/tickets/:eventId` | `TicketPage` | Tier selection, WebSocket subscription, seating map lightbox, payment modal, confetti on success |
| `/my-tickets` | `MyTickets` | Digital wallet — enriched order list with PDF/QR download |
| `/admin` | `AdminDashboard` | Stats, event/venue/user/partner management |
| `/partner` | `PartnerWithUs` | Multi-step B2B inquiry form *(public — no auth required)* |
| `/help` | `HelpCenter` | Support hub *(public — no auth required)* |

### Route Guards

`App.jsx` checks `isTokenExpired()` on every protected route render. Expired tokens trigger `localStorage.clear()` and redirect to login. `AdminRoute.jsx` additionally reads the `role` claim via `getUserRoleFromToken()` and blocks non-admins from `/admin`.

### Client-Side Ticket Generation (`MyTickets.jsx`)

1. `html2canvas` renders the styled ticket component to a `<canvas>` (3× scale for high-DPI)
2. `jsPDF` converts the canvas to a downloadable PDF blob saved as `TicketBlitz_Pass_{id}.pdf`
3. `qrcode.react` (`QRCodeSVG`) embeds a QR code encoding the order ID as a string

### Purchase Success Animation

After a successful purchase, `TicketPage` navigates to `/my-tickets` with `{ state: { confetti: true } }`. On mount, `MyTickets` checks `location.state?.confetti` and fires a 3-second `canvas-confetti` burst animation — then clears the flag via `window.history.replaceState` so it doesn't re-trigger on back navigation.

---

## Backend

### Security

| Path Pattern | Access |
|:-------------|:-------|
| `/api/auth/**`, `/ws/**`, `/error` | Public |
| `POST /api/partners/apply` | Public |
| `GET /api/partners/my-proposals` | Authenticated |
| `/api/admin/**` | `ROLE_ADMIN` |
| `/api/stock/**` | Authenticated |
| `/api/events/**` | Authenticated |
| All others | Authenticated |

Session policy is `STATELESS`. CSRF is disabled. CORS allows `http://localhost:5173` with credentials.

### JWT

Tokens are HS256-signed and include `sub` (email), `role` (`CUSTOMER` or `ADMIN`), `iat`, and `exp`. Default expiry is 24 hours (configurable). `JwtAuthenticationFilter` validates the `Authorization: Bearer` header on every request and populates `SecurityContextHolder`.

### Service Layer

**`StockService`** — owns all Redis operations and WebSocket broadcasts.

**`AdminService`** — owns event lifecycle (create / update / delete) with Redis synchronization, and aggregates dashboard statistics.

---

## Data Model

```
User            id, name, email, password, role (CUSTOMER | ADMIN)

Event           id, title, description, imageUrl, eventDate, eventTime,
                category, venue_id → Venue
                ticketTiers[] → TicketTier  (CascadeType.ALL)
                galleryImages[] → @ElementCollection
                reviews[] → Review
                @Transient getAverageRating()

TicketTier      id, tierName, price, availableStock (@Min 0), benefits, event_id

Order           id, userId (email), event_id → Event, tierName,
                quantity, totalAmount, orderTime

Venue           id, name, address, city, totalCapacity, seatingMapUrl

Review          id, userId, userName, rating (int, no backend constraint), comment,
                reviewImages[] → @ElementCollection, event_id, createdAt

PartnerInquiry  id, organizerName, businessEmail, eventCategory,
                estimatedAttendance, contactNumber, city, eventDate,
                eventProposal, submittedByEmail, submittedAt,
                status (PENDING | REVIEWED | APPROVED)
```

### Custom Repository Queries

```java
// Prevents LazyInitializationException — eagerly joins tiers and venue
@Query("SELECT DISTINCT e FROM Event e LEFT JOIN FETCH e.ticketTiers LEFT JOIN FETCH e.venue")
List<Event> findAllWithTiers();

// Case-insensitive fuzzy search across title and venue city
@Query("SELECT e FROM Event e WHERE LOWER(e.title) LIKE LOWER(CONCAT('%',:query,'%')) " +
       "OR LOWER(e.venue.city) LIKE LOWER(CONCAT('%',:query,'%'))")
List<Event> searchEvents(@Param("query") String query);

// Eager-loads event + venue to populate OrderDto (fixes missing date/venue in wallet)
@Query("SELECT o FROM Order o JOIN FETCH o.event e JOIN FETCH e.venue WHERE o.userId = :userId")
List<Order> findByUserIdWithDetails(@Param("userId") String userId);

// Null-safe aggregates for dashboard stats
@Query("SELECT COALESCE(SUM(o.quantity), 0) FROM Order o")
Long sumTotalTicketsSold();

@Query("SELECT COALESCE(SUM(o.totalAmount), 0.0) FROM Order o")
Double sumTotalRevenue();
```

---

## Redis Purchase Engine

### Why `DECREMENT` instead of DB locks

| Approach | Mechanism | Problem under high concurrency |
|:---------|:----------|:-------------------------------|
| Pessimistic lock (`SELECT FOR UPDATE`) | DB row locked per transaction | All requests queue at the DB |
| Optimistic lock (version field) | Retry on version mismatch | Retry storms under contention |
| **Redis `DECREMENT`** ✅ | Single-threaded O(1) command | No contention; DB only touched for winners |

### `processPurchase()` — annotated flow

```java
@Transactional(rollbackFor = Exception.class)
public boolean processPurchase(Long eventId, Long tierId, String userId, int quantity) {
    String stockKey = String.format("event:%d:tier:%d", eventId, tierId);

    // 1. Atomic Redis decrement — no race condition possible
    Long remaining = redisTemplate.opsForValue().decrement(stockKey, quantity);

    if (remaining != null && remaining >= 0) {
        try {
            // 2. Fetch entities from DB
            TicketTier tier = ticketTierRepository.findById(tierId).orElseThrow(...);
            Event event    = eventRepository.findById(eventId).orElseThrow(...);

            // 3. Sync tier stock in PostgreSQL
            tier.setAvailableStock(remaining.intValue());
            ticketTierRepository.saveAndFlush(tier);

            // 4. Persist order record
            orderRepository.save(Order.builder()
                .userId(userId).event(event).tierName(tier.getTierName())
                .quantity(quantity).totalAmount(tier.getPrice() * quantity)
                .orderTime(LocalDateTime.now()).build());

            // 5. Push updated stock to all WebSocket subscribers
            broadcastStockUpdate(eventId, tierId, remaining);
            return true;

        } catch (Exception e) {
            // 6. DB failed — restore Redis so inventory is not lost
            redisTemplate.opsForValue().increment(stockKey, quantity);
            throw new RuntimeException("DB write failed. Redis restored.", e);
        }
    } else {
        // 7. Over-decremented (sold out) — restore and reject
        redisTemplate.opsForValue().increment(stockKey, quantity);
        return false;
    }
}
```

### `initializeStock()` — null-safe initialization

```java
public void initializeStock(Long eventId, Long tierId, int amount) {
    if (eventId == null || tierId == null) return; // Prevents "event:null:tier:null" keys
    String key = String.format("event:%d:tier:%d", eventId, tierId);
    redisTemplate.opsForValue().set(key, String.valueOf(amount));
    broadcastStockUpdate(eventId, tierId, (long) amount);
}
```

### Event Lifecycle → Redis Sync

| Operation | Flow |
|:----------|:-----|
| **Create** | `saveAndFlush()` (generates IDs) → `initializeStock()` per tier → `syncStockToRedis()` (second pass to guarantee correctness) |
| **Update** | Merge fields/tiers/venue, re-link tier parent references → `saveAndFlush()` → `initializeStock()` per tier |
| **Delete** | `redisTemplate.delete()` per tier key → `eventRepository.delete()` (JPA cascade handles orders/tiers/reviews) |

The `saveAndFlush()` + `syncStockToRedis()` two-pass pattern ensures JPA has generated real IDs before Redis is written, preventing the null-key cache poisoning bug.

---

## API Reference

### Auth

| Method | Endpoint | Auth | Body / Response |
|:-------|:---------|:-----|:----------------|
| POST | `/api/auth/register` | Public | `{ name, email, password }` → `{ token, role, name }` |
| POST | `/api/auth/authenticate` | Public | `{ email, password }` → `{ token, role, name }` |

### Events — `/api/events`

| Method | Endpoint | Auth |
|:-------|:---------|:-----|
| GET | `/api/events` | User |
| GET | `/api/events/{id}` | User |
| GET | `/api/events/search?q=` | User |
| GET | `/api/events/past` | User |
| POST | `/api/events/create` | Admin |
| PUT | `/api/events/{id}` | Admin |
| DELETE | `/api/events/{id}` | Admin |

### Stock / Tickets — `/api/stock`

| Method | Endpoint | Auth | Notes |
|:-------|:---------|:-----|:------|
| POST | `/api/stock/purchase` | User | `{ eventId, tierId, quantity }` |
| GET | `/api/stock/my-tickets` | User | Returns enriched `OrderDto[]` with event + venue details |
| GET | `/api/stock/count/{eventId}/{tierId}` | User | Current Redis stock count |

### Orders — `/api/orders`

| Method | Endpoint | Auth |
|:-------|:---------|:-----|
| GET | `/api/orders/my-orders` | User |

### Venues — `/api/venues`

| Method | Endpoint | Auth |
|:-------|:---------|:-----|
| GET | `/api/venues` | User |
| GET | `/api/venues/{id}` | User |
| POST | `/api/venues` | Admin |
| PUT | `/api/venues/{id}` | Admin |
| DELETE | `/api/venues/{id}` | Admin |

### Reviews — `/api/reviews`

| Method | Endpoint | Auth | Notes |
|:-------|:---------|:-----|:------|
| POST | `/api/reviews/{eventId}` | User | |
| GET | `/api/reviews/{eventId}` | User | Sorted newest first |
| PUT | `/api/reviews/{reviewId}` | User | Owner only (403 otherwise) |
| DELETE | `/api/reviews/{reviewId}` | User | Owner only (403 otherwise) |

### Partners

| Method | Endpoint | Auth |
|:-------|:---------|:-----|
| POST | `/api/partners/apply` | Public |
| GET | `/api/partners/my-proposals?email=` | User |
| GET | `/api/admin/partners` | Admin |
| PUT | `/api/admin/partners/{id}/status` | Admin |

### Admin — `/api/admin`

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | `/api/admin/stats` | `{ totalUsers, totalTicketsSold, totalRevenue }` |
| GET | `/api/admin/orders` | All orders as enriched `OrderDto[]` |
| GET | `/api/admin/users` | All users as `UserDto[]` |
| DELETE | `/api/admin/users/{id}` | Delete user |
| POST | `/api/admin/sync-stock` | Re-sync all Redis inventory from PostgreSQL |
| POST | `/api/admin/init` | Reset a specific tier's Redis stock |
| GET / POST / DELETE | `/api/admin/venues` | Venue management |

### WebSocket

Connect to `ws://localhost:8080/ws` via SockJS, then subscribe:

```
/topic/stock/{eventId}   →  { "tierId": 3, "remaining": 41 }
```

---

## Setup & Installation

### Prerequisites

- Java 17+
- Node.js 18+
- PostgreSQL 15+ (port 5432)
- Redis 7+ (port 6379)
- Maven (wrapper included)

---

### Backend

**1. Create the database**
```sql
CREATE DATABASE ticketblitz;
```

**2. Configure `backend/src/main/resources/application.properties`**
```properties
spring.application.name=TicketBlitz

# PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/ticketblitz
spring.datasource.username=postgres
spring.datasource.password=YOUR_PASSWORD
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.lettuce.pool.max-active=20
spring.data.redis.lettuce.pool.max-idle=10
spring.data.redis.lettuce.pool.min-idle=5

# HikariCP
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5

spring.transaction.default-timeout=10
server.port=8080

# JWT — use environment variables in production
application.security.jwt.secret-key=YOUR_256_BIT_BASE64_SECRET
application.security.jwt.expiration=86400000

# Logging
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.springframework.orm.jpa=DEBUG
```

**3. Start Redis**
```bash
redis-server

# Verify
redis-cli ping   # → PONG
```

**4. Run the backend**
```bash
# Linux/Mac
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

On startup, the `CommandLineRunner` in `BackendApplication` writes and reads a test key to confirm Redis connectivity:
```
⚡ TESTING REDIS CONNECTION...
⚡ REDIS RESPONSE: TicketBlitz is Live!
```

Backend: `http://localhost:8080`

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

---

### Creating an Admin Account

Register normally via the UI, then update the role in the database:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

Log out and back in to receive a new JWT with the `ADMIN` claim embedded.

---

### Verification

```bash
redis-cli ping                           # PONG
curl http://localhost:8080/api/events    # [] or event array
psql -U postgres -d ticketblitz -c "SELECT version();"
```

**Real-time test:** Open the same event in two browser tabs. Purchase a ticket in one and verify the stock counter updates in the other without refreshing.

---

## Testing

Two integration tests are included. Both require live PostgreSQL and Redis instances. Data is set up in `@BeforeEach` and cleaned with `deleteAll()` before each run.

### `StockServiceStressTest` — service layer

1,000 concurrent threads compete for 1 ticket via `StockService.processPurchase()` directly.

```java
final int TOTAL_STOCK      = 1;
final int CONCURRENT_USERS = 1000;
```

Threads are held on a `CountDownLatch` and released simultaneously. Assertions:

```java
assertEquals(1,    successCount.get());       // exactly one winner
assertEquals(999,  failCount.get());          // everyone else rejected
assertEquals(1,    orderRepository.count());  // one order in DB
assertEquals(0,    finalDbStock);             // tier stock at zero
```

### `ControllerLoadTest` — HTTP layer

100 concurrent requests to `POST /api/stock/purchase` via MockMvc with full Spring Security context, against an event with 5 tickets.

```java
assertEquals(5,  successCount.get());   // five HTTP 200 responses
assertEquals(95, failCount.get());      // ninety-five HTTP 400 responses
```

### Running

```bash
cd backend

./mvnw test                                    # all tests
./mvnw test -Dtest=StockServiceStressTest
./mvnw test -Dtest=ControllerLoadTest
```

---

## Screenshots

### Homepage
<img src="./images/homepage1.png" width="400"/> <img src="./images/homepage2.png" width="400"/>
<img src="./images/homepage3.png" width="400"/>

### Purchase Flow & E-Ticket
<img src="./images/ticketpage.png" width="400"/> <img src="./images/paymentwindow.png" width="400"/>
<img src="./images/wallet.png" width="400"/> <img src="./images/ticket.png" width="400"/>

### Admin Dashboard
<img src="./images/admin-dashboard1.png" width="400"/> <img src="./images/admin-dashboard2.png" width="400"/>

### Partner Portal & Support
<img src="./images/event-proposal.png" width="400"/> <img src="./images/support.png" width="400"/>

---

<div align="center">

Built with Spring Boot  & React git &nbsp;·&nbsp; © 2026 Yogesh Shende

</div>
