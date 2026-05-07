package com.dsofikitis.chronos.events;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class EventDto {

    public record CreateRequest(
            @NotBlank String title,
            @NotNull OffsetDateTime startsAt,
            @NotNull OffsetDateTime endsAt,
            Boolean allDay,
            String location,
            String notes) {
    }

    public record UpdateRequest(
            String title,
            OffsetDateTime startsAt,
            OffsetDateTime endsAt,
            Boolean allDay,
            String location,
            String notes) {
    }

    public record Response(
            UUID id,
            String title,
            OffsetDateTime startsAt,
            OffsetDateTime endsAt,
            boolean allDay,
            String location,
            String notes) {

        public static Response from(Event e) {
            return new Response(
                    e.getId(),
                    e.getTitle(),
                    e.getStartsAt(),
                    e.getEndsAt(),
                    e.isAllDay(),
                    e.getLocation(),
                    e.getNotes());
        }
    }

    private EventDto() {
    }
}
