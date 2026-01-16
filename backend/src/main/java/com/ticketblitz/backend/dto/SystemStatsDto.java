package com.ticketblitz.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SystemStatsDto {
    private long totalUsers;
    private long totalTicketsSold;
    private long totalRevenue; // Placeholder for future logic
}