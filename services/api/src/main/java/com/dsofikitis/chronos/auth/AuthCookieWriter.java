package com.dsofikitis.chronos.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Owns the session-cookie shape so frontend + JwtAuthenticationFilter agree on
 * one place. Local dev defaults to non-Secure so cookies work on
 * `http://localhost`; production sets `chronos.jwt.cookie-secure=true`.
 */
@Component
public class AuthCookieWriter {

    private final String cookieName;
    private final boolean secure;
    private final int ttlSeconds;

    public AuthCookieWriter(
            @Value("${chronos.jwt.cookie-name:chronos_session}") String cookieName,
            @Value("${chronos.jwt.cookie-secure:false}") boolean secure,
            JwtService jwtService) {
        this.cookieName = cookieName;
        this.secure = secure;
        this.ttlSeconds = (int) jwtService.ttl().toSeconds();
    }

    public String cookieName() {
        return cookieName;
    }

    public void writeSession(HttpServletResponse resp, String token) {
        var cookie = new Cookie(cookieName, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(secure);
        cookie.setPath("/");
        cookie.setMaxAge(ttlSeconds);
        cookie.setAttribute("SameSite", "Lax");
        resp.addCookie(cookie);
    }

    public void clearSession(HttpServletResponse resp) {
        var cookie = new Cookie(cookieName, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(secure);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", "Lax");
        resp.addCookie(cookie);
    }
}
