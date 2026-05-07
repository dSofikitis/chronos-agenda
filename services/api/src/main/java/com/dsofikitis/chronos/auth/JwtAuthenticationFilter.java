package com.dsofikitis.chronos.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Reads the session cookie, verifies the JWT, sets the SecurityContext. */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwt;
    private final AuthCookieWriter cookies;

    public JwtAuthenticationFilter(JwtService jwt, AuthCookieWriter cookies) {
        this.jwt = jwt;
        this.cookies = cookies;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest req,
            HttpServletResponse resp,
            FilterChain chain) throws ServletException, IOException {
        readToken(req).flatMap(jwt::verify).ifPresent(userId -> {
            var auth = new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_USER")));
            SecurityContextHolder.getContext().setAuthentication(auth);
        });
        chain.doFilter(req, resp);
    }

    private Optional<String> readToken(HttpServletRequest req) {
        if (req.getCookies() == null) return Optional.empty();
        for (var c : req.getCookies()) {
            if (cookies.cookieName().equals(c.getName())) {
                return Optional.of(c.getValue());
            }
        }
        return Optional.empty();
    }

    /** Convenience for callers that have an Authentication on the SecurityContext. */
    public static UUID currentUserIdOrThrow() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UUID id)) {
            throw new IllegalStateException("no authenticated user on security context");
        }
        return id;
    }
}
