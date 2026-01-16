package com.ticketblitz.backend.repository;

import com.ticketblitz.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * TOP 1% G DEEP FETCH:
     * This query uses 'JOIN FETCH' to solve the "Invalid Date" and missing venue bug.
     * It eagerly loads the Event and Venue data so they are available in the AdminService mapper.
     */
    @Query("SELECT o FROM Order o " +
            "JOIN FETCH o.event e " +
            "JOIN FETCH e.venue " +
            "WHERE o.userId = :userId")
    List<Order> findByUserIdWithDetails(@Param("userId") String userId);

    // Standard method kept for simple lookups
    List<Order> findByUserId(String userId);

    /**
     * Returns 0 instead of null if no orders are found.
     * Prevents NullPointerException in SystemStatsDto.
     */
    @Query("SELECT COALESCE(SUM(o.quantity), 0) FROM Order o")
    Long sumTotalTicketsSold();

    /**
     * Returns 0.0 instead of null if no orders are found.
     * Ensures Admin Dashboard 'Total Revenue' loads with zero sales.
     */
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0.0) FROM Order o")
    Double sumTotalRevenue();
}