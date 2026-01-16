package com.ticketblitz.backend.controller;

import com.ticketblitz.backend.model.PartnerInquiry;
import com.ticketblitz.backend.repository.PartnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/partners")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PartnerController {
    private final PartnerRepository repository;

    @PostMapping("/apply")
    public ResponseEntity<String> submitApplication(@RequestBody PartnerInquiry inquiry) {
        inquiry.setSubmittedAt(LocalDateTime.now());
        inquiry.setStatus("PENDING");
        repository.save(inquiry);
        return ResponseEntity.ok("Infrastructure handshake initiated. Our team will contact you.");
    }

    // Inside PartnerController.java (Public/User facing controller)
    // Inside PartnerController.java
    @GetMapping("/my-proposals")
    public ResponseEntity<List<PartnerInquiry>> getMyProposals(@RequestParam String email) {
        // ATOMIC SYNC: Uses the new resilient search
        return ResponseEntity.ok(repository.findByOwnerOrContact(email));
    }
}