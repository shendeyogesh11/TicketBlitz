package com.ticketblitz.backend.repository;

import com.ticketblitz.backend.model.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VenueRepository extends JpaRepository<Venue, Long> {

    /**
     * FIND BY CITY:
     * Crucial for the "Explore" page so Kunal can find art events in his specific city.
     */
    List<Venue> findByCityIgnoreCase(String city);

    /**
     * SEARCH BY NAME:
     * Helps the Admin find the correct venue when creating a new event.
     */
    List<Venue> findByNameContainingIgnoreCase(String name);
}