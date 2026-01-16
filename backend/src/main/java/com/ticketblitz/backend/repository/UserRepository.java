package com.ticketblitz.backend.repository;

import com.ticketblitz.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Finds a user by email (needed for Login)
    Optional<User> findByEmail(String email);

}