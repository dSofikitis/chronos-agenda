package com.dsofikitis.chronos.auth;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository repo;

    public UserService(UserRepository repo) {
        this.repo = repo;
    }

    /**
     * Find an existing user by Google subject, or create one. Email and display
     * name are refreshed on every login so a Google profile change propagates.
     */
    @Transactional
    public User upsertGoogle(String googleSubject, String email, String displayName) {
        var now = OffsetDateTime.now();
        return repo.findByGoogleSubject(googleSubject)
                .map(existing -> {
                    existing.setEmail(email);
                    existing.setDisplayName(displayName);
                    existing.setUpdatedAt(now);
                    return existing;
                })
                .orElseGet(() -> repo.save(User.builder()
                        .id(UUID.randomUUID())
                        .googleSubject(googleSubject)
                        .email(email)
                        .displayName(displayName)
                        .timezone("UTC")
                        .createdAt(now)
                        .updatedAt(now)
                        .build()));
    }

    /**
     * The deterministic local-dev user. Used when GOOGLE_CLIENT_ID is unset so
     * the frontend can iterate without a real OAuth app.
     */
    @Transactional
    public User upsertDevUser() {
        var now = OffsetDateTime.now();
        return repo.findByEmail("dev@chronos.local")
                .map(existing -> {
                    existing.setUpdatedAt(now);
                    return existing;
                })
                .orElseGet(() -> repo.save(User.builder()
                        .id(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                        .email("dev@chronos.local")
                        .displayName("Local Dev")
                        .timezone("UTC")
                        .createdAt(now)
                        .updatedAt(now)
                        .build()));
    }
}
