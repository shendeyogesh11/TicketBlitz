package com.ticketblitz.backend.controller;

import com.ticketblitz.backend.model.*;
import com.ticketblitz.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    @PostMapping("/{eventId}")
    public ResponseEntity<Review> addReview(
            @PathVariable Long eventId,
            @RequestBody Review review,
            Authentication auth) {

        String email = auth.getName();
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        review.setUserId(email);
        review.setUserName(user.getName());
        review.setEvent(event);
        review.setCreatedAt(LocalDateTime.now());

        return ResponseEntity.ok(reviewRepository.save(review));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<List<Review>> getReviews(@PathVariable Long eventId) {
        return ResponseEntity.ok(reviewRepository.findByEventIdOrderByCreatedAtDesc(eventId));
    }

    // ... existing imports and methods ...

    @PutMapping("/{reviewId}")
    public ResponseEntity<Review> updateReview(
            @PathVariable Long reviewId,
            @RequestBody Review updatedData,
            Authentication auth) {

        String email = auth.getName(); // Current Logged-in User

        Review existing = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        // 🛡️ SECURITY CHECK: Only allow if email matches
        if (!existing.getUserId().equals(email)) {
            return ResponseEntity.status(403).build(); // Forbidden
        }

        // Update Fields
        existing.setRating(updatedData.getRating());
        existing.setComment(updatedData.getComment());

        // Update Images (Standard Hibernate List Handling)
        if (updatedData.getReviewImages() != null) {
            existing.getReviewImages().clear();
            existing.getReviewImages().addAll(updatedData.getReviewImages());
        }

        return ResponseEntity.ok(reviewRepository.save(existing));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId, Authentication auth) {
        String email = auth.getName();

        Review existing = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        // 🛡️ SECURITY CHECK
        if (!existing.getUserId().equals(email)) {
            return ResponseEntity.status(403).build();
        }

        reviewRepository.delete(existing);
        return ResponseEntity.ok().build();
    }

}