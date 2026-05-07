package com.dsofikitis.chronos.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    @Test
    void issuedTokenRoundTripsThroughVerify() {
        var jwt = new JwtService("test-secret-do-not-use", Duration.ofHours(1));
        var userId = UUID.randomUUID();

        var token = jwt.issue(userId);
        assertThat(jwt.verify(token)).contains(userId);
    }

    @Test
    void tamperedSignatureIsRejected() {
        var jwt = new JwtService("test-secret-do-not-use", Duration.ofHours(1));
        var token = jwt.issue(UUID.randomUUID());

        // Flip the last char of the signature.
        var parts = token.split("\\.");
        var sig = parts[2];
        var tampered = parts[0] + "." + parts[1] + "." + sig.substring(0, sig.length() - 1)
                + (sig.endsWith("a") ? "b" : "a");
        assertThat(jwt.verify(tampered)).isEmpty();
    }

    @Test
    void differentSecretsDoNotVerifyEachOthersTokens() {
        var jwtA = new JwtService("secret-a", Duration.ofHours(1));
        var jwtB = new JwtService("secret-b", Duration.ofHours(1));
        var token = jwtA.issue(UUID.randomUUID());
        assertThat(jwtB.verify(token)).isEmpty();
    }

    @Test
    void expiredTokenIsRejected() {
        // Negative TTL mints a token whose exp is already in the past — avoids
        // the racy second-precision sleep an equivalent millisecond-TTL test
        // would need.
        var jwt = new JwtService("test-secret-do-not-use", Duration.ofSeconds(-1));
        var token = jwt.issue(UUID.randomUUID());
        assertThat(jwt.verify(token)).isEmpty();
    }
}
