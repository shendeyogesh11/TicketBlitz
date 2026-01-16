package com.ticketblitz.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.StringRedisTemplate;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    // This runs automatically when you start the server
    @Bean
    CommandLineRunner testConnection(StringRedisTemplate redisTemplate) {
        return args -> {
            System.out.println("---------------------------------------");
            System.out.println("⚡ TESTING REDIS CONNECTION...");

            // 1. Try to write to Redis
            redisTemplate.opsForValue().set("test_key", "TicketBlitz is Live!");

            // 2. Try to read from Redis
            String value = redisTemplate.opsForValue().get("test_key");

            System.out.println("⚡ REDIS RESPONSE: " + value);
            System.out.println("---------------------------------------");
        };
    }
}