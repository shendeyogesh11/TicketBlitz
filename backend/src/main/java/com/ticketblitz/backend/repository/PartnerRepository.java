package com.ticketblitz.backend.repository;

import com.ticketblitz.backend.model.PartnerInquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * TOP 1% G DATA BRIDGE:
 * Handles automated persistence for all incoming partner applications.
 */
@Repository
public interface PartnerRepository extends JpaRepository<PartnerInquiry, Long> {
    // Basic CRUD operations are inherited automatically.
    // In production, we could add custom finders like:
    // List<PartnerInquiry> findByStatus(String status);

    @Query("SELECT p FROM PartnerInquiry p WHERE p.submittedByEmail = :email OR p.businessEmail = :email ORDER BY p.submittedAt DESC")
    List<PartnerInquiry> findByOwnerOrContact(String email);
}





