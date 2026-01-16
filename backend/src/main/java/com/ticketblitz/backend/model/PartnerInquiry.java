package com.ticketblitz.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "partner_inquiries")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PartnerInquiry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String organizerName;
    private String businessEmail;
    private String eventCategory;
    private String estimatedAttendance;
    private String contactNumber;
    private String city;
    private String eventDate;
    private String submittedByEmail;

    @Column(columnDefinition = "TEXT")
    private String eventProposal;

    private LocalDateTime submittedAt;
    private String status; // PENDING, REVIEWED, APPROVED
}