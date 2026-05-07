package com.dsofikitis.chronos.auth;

import com.dsofikitis.chronos.auth.CurrentUserIdResolver.CurrentUserId;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final UserService userService;
    private final JwtService jwt;
    private final AuthCookieWriter cookies;
    private final boolean oauthEnabled;

    public AuthController(
            UserRepository users,
            UserService userService,
            JwtService jwt,
            AuthCookieWriter cookies,
            @Value("${chronos.oauth.enabled:false}") boolean oauthEnabled) {
        this.users = users;
        this.userService = userService;
        this.jwt = jwt;
        this.cookies = cookies;
        this.oauthEnabled = oauthEnabled;
    }

    /** Whoami — the frontend uses this to render the current user header. */
    @GetMapping("/me")
    public Map<String, Object> me(@CurrentUserId UUID userId) {
        var u = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return Map.of(
                "id", u.getId(),
                "email", u.getEmail(),
                "displayName", u.getDisplayName(),
                "timezone", u.getTimezone());
    }

    /**
     * Local-dev login. When GOOGLE_CLIENT_ID is unset the OAuth flow is
     * disabled entirely; clients can POST here to mint a session for the
     * deterministic local-dev user. Returns 404 in production.
     */
    @PostMapping("/dev-login")
    public Map<String, Object> devLogin(HttpServletResponse resp) {
        if (oauthEnabled) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        var u = userService.upsertDevUser();
        cookies.writeSession(resp, jwt.issue(u.getId()));
        return Map.of(
                "id", u.getId(),
                "email", u.getEmail(),
                "displayName", u.getDisplayName());
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpServletResponse resp) {
        cookies.clearSession(resp);
        return Map.of("ok", true);
    }
}
