package com.dsofikitis.chronos.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Tiny HS256 JWT service. The full jjwt / nimbus stack is overkill for a
 * single-issuer / single-audience system whose claims fit on one hand.
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final Base64.Encoder URL = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URLD = Base64.getUrlDecoder();
    private static final ObjectMapper JSON = new ObjectMapper();

    private final byte[] secret;
    private final Duration ttl;

    public JwtService(
            @Value("${chronos.jwt.secret:}") String configuredSecret,
            @Value("${chronos.jwt.ttl:PT24H}") Duration ttl) {
        this.ttl = ttl;
        this.secret = resolveSecret(configuredSecret);
    }

    /** Mint a token whose subject is the user's UUID. */
    public String issue(UUID userId) {
        var now = Instant.now();
        var header = JSON.createObjectNode()
                .put("alg", "HS256")
                .put("typ", "JWT");
        var payload = JSON.createObjectNode()
                .put("sub", userId.toString())
                .put("iat", now.getEpochSecond())
                .put("exp", now.plus(ttl).getEpochSecond());
        var unsigned = encode(header) + "." + encode(payload);
        var signature = URL.encodeToString(hmac(unsigned));
        return unsigned + "." + signature;
    }

    /** Verify signature + expiry. Returns the user id if the token is valid. */
    public Optional<UUID> verify(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        var parts = token.split("\\.");
        if (parts.length != 3) return Optional.empty();

        var unsigned = parts[0] + "." + parts[1];
        var expected = URL.encodeToString(hmac(unsigned));
        if (!constantTimeEquals(expected, parts[2])) {
            return Optional.empty();
        }
        try {
            JsonNode payload = JSON.readTree(URLD.decode(parts[1]));
            long exp = payload.path("exp").asLong(0);
            if (exp < Instant.now().getEpochSecond()) return Optional.empty();
            return Optional.of(UUID.fromString(payload.path("sub").asText()));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public Duration ttl() {
        return ttl;
    }

    private byte[] hmac(String unsigned) {
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(unsigned.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("HmacSHA256 unavailable", e);
        }
    }

    private static String encode(ObjectNode node) {
        try {
            return URL.encodeToString(JSON.writeValueAsBytes(node));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) return false;
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.US_ASCII),
                b.getBytes(StandardCharsets.US_ASCII));
    }

    private static byte[] resolveSecret(String configured) {
        if (configured != null && !configured.isBlank()) {
            // Hash the supplied value so any string becomes a 32-byte key.
            return digest(configured);
        }
        // Fallback for local dev: stable per-process random.
        // Logged once so devs notice in case they expected a configured key.
        var random = new byte[32];
        new java.security.SecureRandom().nextBytes(random);
        log.warn("CHRONOS_JWT_SECRET unset — issued tokens will not survive a restart");
        return random;
    }

    private static byte[] digest(String s) {
        try {
            return MessageDigest.getInstance("SHA-256")
                    .digest(s.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    // Visible for tests.
    Map<String, Object> debugClaims(String token) {
        Objects.requireNonNull(token);
        try {
            JsonNode payload = JSON.readTree(URLD.decode(token.split("\\.")[1]));
            return JSON.convertValue(payload, Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }
}
