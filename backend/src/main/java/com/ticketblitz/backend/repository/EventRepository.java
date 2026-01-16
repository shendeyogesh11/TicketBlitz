package com.ticketblitz.backend.repository;

import com.ticketblitz.backend.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

/**
 * TOP 1% G REPOSITORY:
 * Implements Join Fetching to prevent LazyInitializationException and Null ID errors.
 */
public interface EventRepository extends JpaRepository<Event, Long> {

    // Discovery Feature: Standard category filtering
    List<Event> findByCategory(String category);

    /**
     * THE PERSISTENCE GUARD QUERY:
     * 'JOIN FETCH' tells Hibernate to initialize the collections immediately.
     * 'DISTINCT' prevents duplicate Event records when multiple tiers exist.
     */
    @Query("SELECT DISTINCT e FROM Event e LEFT JOIN FETCH e.ticketTiers LEFT JOIN FETCH e.venue")
    List<Event> findAllWithTiers();

    /**
     * FUZZY SEARCH ENGINE:
     * Searches across titles and cities with case-insensitivity.
     */
    @Query("SELECT e FROM Event e WHERE LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(e.venue.city) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Event> searchEvents(@Param("query") String query);
}