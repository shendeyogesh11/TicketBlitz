package com.ticketblitz.backend.controller;

import com.ticketblitz.backend.dto.StatusUpdateRequest;
import com.ticketblitz.backend.model.PartnerInquiry;
import com.ticketblitz.backend.repository.PartnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * TOP 1% G ADMIN PARTNER ENGINE:
 * Manages the vetting and status orchestration of global event proposals.
 */
@RestController
@RequestMapping("/api/admin/partners")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AdminPartnerController {

    private final PartnerRepository partnerRepository;

    /**
     * FETCH ALL PROPOSALS:
     * Provides the Admin Dashboard with the full registry of organizer leads.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PartnerInquiry>> getAllProposals() {
        return ResponseEntity.ok(partnerRepository.findAll());
    }

    /**
     * STATUS SYNCHRONIZATION:
     * Atomic update for proposal states (APPROVED, REJECTED, PENDING).
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PartnerInquiry> updateStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest request) {

        PartnerInquiry inquiry = partnerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proposal infrastructure not found"));

        inquiry.setStatus(request.getStatus().toUpperCase());
        partnerRepository.save(inquiry);

        return ResponseEntity.ok(inquiry);
    }
}