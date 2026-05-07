package com.dsofikitis.chronos.ics;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IcsTokenService {

    private static final SecureRandom RNG = new SecureRandom();
    private static final Base64.Encoder URL = Base64.getUrlEncoder().withoutPadding();

    private final IcsTokenRepository repo;

    public IcsTokenService(IcsTokenRepository repo) {
        this.repo = repo;
    }

    /**
     * Returns the user's existing token, minting one on first call. Calling
     * this is idempotent — the same user always sees the same token unless
     * {@link #rotate} is invoked.
     */
    @Transactional
    public IcsToken getOrCreate(UUID userId) {
        return repo.findById(userId).orElseGet(() -> repo.save(IcsToken.builder()
                .userId(userId)
                .token(generate())
                .createdAt(OffsetDateTime.now())
                .build()));
    }

    /** Issue a fresh token, invalidating the previous one. */
    @Transactional
    public IcsToken rotate(UUID userId) {
        var token = getOrCreate(userId);
        token.setToken(generate());
        token.setCreatedAt(OffsetDateTime.now());
        token.setLastAccessedAt(null);
        return token;
    }

    @Transactional(readOnly = true)
    public java.util.Optional<IcsToken> findByToken(String token) {
        return repo.findByToken(token);
    }

    @Transactional
    public void touch(IcsToken token) {
        token.setLastAccessedAt(OffsetDateTime.now());
        repo.save(token);
    }

    private static String generate() {
        var bytes = new byte[32];
        RNG.nextBytes(bytes);
        return URL.encodeToString(bytes);
    }
}
