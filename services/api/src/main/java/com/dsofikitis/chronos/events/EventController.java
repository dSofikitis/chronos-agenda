package com.dsofikitis.chronos.events;

import com.dsofikitis.chronos.auth.CurrentUserIdResolver.CurrentUserId;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService events;

    public EventController(EventService events) {
        this.events = events;
    }

    @GetMapping
    public List<EventDto.Response> list(
            @CurrentUserId UUID userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        return events.listInWindow(userId, from, to).stream().map(EventDto.Response::from).toList();
    }

    @GetMapping("/{id}")
    public EventDto.Response get(@CurrentUserId UUID userId, @PathVariable UUID id) {
        return EventDto.Response.from(events.get(userId, id));
    }

    @PostMapping
    public EventDto.Response create(
            @CurrentUserId UUID userId,
            @Valid @RequestBody EventDto.CreateRequest req) {
        return EventDto.Response.from(events.create(userId, req));
    }

    @PatchMapping("/{id}")
    public EventDto.Response update(
            @CurrentUserId UUID userId,
            @PathVariable UUID id,
            @RequestBody EventDto.UpdateRequest req) {
        return EventDto.Response.from(events.update(userId, id, req));
    }

    @DeleteMapping("/{id}")
    public void delete(@CurrentUserId UUID userId, @PathVariable UUID id) {
        events.delete(userId, id);
    }
}
