package com.ticketblitz.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Event title is mandatory")
    private String title;

    // Inside Event.java
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL,fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonIgnoreProperties("event")
    private List<Order> orders; // This ensures orders vanish when the event is deleted


    @Column(length = 2000) // Expanded for detailed event narratives
    private String description;

    private String imageUrl; // For high-res posters

//    @Future(message = "Event date must be in the future")?
    private LocalDate eventDate;

    /**
     * TOP 1% G ENRICHMENT:
     * Explicitly stores the start time (e.g., "07:00 PM").
     * This fixes the "Missing Timing" bug in the user wallet.
     */
    private String eventTime;

    private String category; // Music, Sports, Tech, Arts, etc.

    @ManyToOne(fetch = FetchType.EAGER) // Eagerly load venue to ensure metadata is always available
    @JoinColumn(name = "venue_id")
    private Venue venue;

    /**
     * DYNAMIC TIER MANAGEMENT:
     * Managed as a list to support an unlimited number of custom tiers.
     */
    @Valid
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default // Ensures the list is initialized when using the Builder
    private List<TicketTier> ticketTiers = new ArrayList<>();

    // Helper method to keep the bidirectional relationship in sync
    public void addTicketTier(TicketTier tier) {
        ticketTiers.add(tier);
        tier.setEvent(this);
    }


    @ElementCollection
    @CollectionTable(name = "event_gallery", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "image_url")
    @Builder.Default
    private List<String> galleryImages = new ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnoreProperties("event")
    private List<Review> reviews;

    // Computed property for the UI star rating
    @Transient
    public double getAverageRating() {
        if (reviews == null || reviews.isEmpty()) return 0.0;
        // Round to 1 decimal place
        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        return Math.round(avg * 10.0) / 10.0;
    }

}