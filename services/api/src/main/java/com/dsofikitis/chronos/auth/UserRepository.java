package com.dsofikitis.chronos.auth;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByGoogleSubject(String googleSubject);

    Optional<User> findByEmail(String email);
}
