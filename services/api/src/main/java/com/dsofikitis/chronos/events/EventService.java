package com.dsofikitis.chronos.events;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EventService {

    private final EventRepository repo;

    public EventService(EventRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<Event> listInWindow(UUID userId, OffsetDateTime from, OffsetDateTime to) {
        if (!from.isBefore(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "from must be before to");
        }
        return repo.findInWindow(userId, from, to);
    }

    @Transactional
    public Event create(UUID userId, EventDto.CreateRequest req) {
        if (!req.startsAt().isBefore(req.endsAt()) && !req.startsAt().equals(req.endsAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startsAt must be <= endsAt");
        }
        var now = OffsetDateTime.now();
        return repo.save(Event.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .title(req.title())
                .startsAt(req.startsAt())
                .endsAt(req.endsAt())
                .allDay(Boolean.TRUE.equals(req.allDay()))
                .location(req.location())
                .notes(req.notes())
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    @Transactional
    public Event update(UUID userId, UUID eventId, EventDto.UpdateRequest req) {
        var event = repo.findByIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (req.title() != null) event.setTitle(req.title());
        if (req.startsAt() != null) event.setStartsAt(req.startsAt());
        if (req.endsAt() != null) event.setEndsAt(req.endsAt());
        if (req.allDay() != null) event.setAllDay(req.allDay());
        if (req.location() != null) event.setLocation(req.location());
        if (req.notes() != null) event.setNotes(req.notes());

        if (!event.getStartsAt().isBefore(event.getEndsAt())
                && !event.getStartsAt().equals(event.getEndsAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startsAt must be <= endsAt");
        }
        event.setUpdatedAt(OffsetDateTime.now());
        return event;
    }

    @Transactional
    public void delete(UUID userId, UUID eventId) {
        var event = repo.findByIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        repo.delete(event);
    }

    @Transactional(readOnly = true)
    public Event get(UUID userId, UUID eventId) {
        return repo.findByIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    /** Used by the .ics exporter — read-only window dump for a single user. */
    @Transactional(readOnly = true)
    public List<Event> listAll(UUID userId) {
        var bounds = OffsetDateTime.now();
        return repo.findInWindow(userId, bounds.minusYears(2), bounds.plusYears(2));
    }
}
