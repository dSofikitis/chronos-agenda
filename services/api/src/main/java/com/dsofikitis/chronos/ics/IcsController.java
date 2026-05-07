package com.dsofikitis.chronos.ics;

import com.dsofikitis.chronos.auth.CurrentUserIdResolver.CurrentUserId;
import com.dsofikitis.chronos.auth.UserRepository;
import com.dsofikitis.chronos.events.EventService;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ics")
public class IcsController {

    private final IcsTokenService tokens;
    private final EventService events;
    private final IcsExporter exporter;
    private final UserRepository users;
    private final String publicBase;

    public IcsController(
            IcsTokenService tokens,
            EventService events,
            IcsExporter exporter,
            UserRepository users,
            @Value("${chronos.ics.public-base:http://localhost:8080}") String publicBase) {
        this.tokens = tokens;
        this.events = events;
        this.exporter = exporter;
        this.users = users;
        this.publicBase = publicBase;
    }

    /** Authenticated — returns the user's stable feed URL. */
    @GetMapping("/url")
    public Map<String, String> myUrl(@CurrentUserId UUID userId) {
        var token = tokens.getOrCreate(userId);
        return Map.of("url", publicBase + "/api/ics/" + token.getToken() + ".ics");
    }

    /** Authenticated — rotates the token, invalidating any subscribed clients. */
    @PostMapping("/rotate")
    public Map<String, String> rotate(@CurrentUserId UUID userId) {
        var token = tokens.rotate(userId);
        return Map.of("url", publicBase + "/api/ics/" + token.getToken() + ".ics");
    }

    /** Public — token-authenticated. Whitelisted in SecurityConfig. */
    @GetMapping(value = "/{token:.+}.ics", produces = "text/calendar")
    public ResponseEntity<String> feed(@PathVariable String token) {
        var icsToken = tokens.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        var user = users.findById(icsToken.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        tokens.touch(icsToken);
        var body = exporter.render(user.getDisplayName() + " · Chronos", events.listAll(user.getId()));
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("text/calendar; charset=utf-8"))
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300")
                .body(body);
    }
}
