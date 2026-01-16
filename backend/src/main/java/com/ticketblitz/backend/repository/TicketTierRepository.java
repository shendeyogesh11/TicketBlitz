package com.ticketblitz.backend.repository;

import com.ticketblitz.backend.model.TicketTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketTierRepository extends JpaRepository<TicketTier, Long> {
    // Standard CRUD operations are inherited automatically
}