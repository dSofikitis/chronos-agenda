package com.dsofikitis.chronos.tasks;

import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class TaskDto {

    public record CreateRequest(
            @NotBlank String title,
            OffsetDateTime dueBy,
            Short priority,
            String notes) {
    }

    public record UpdateRequest(
            String title,
            OffsetDateTime dueBy,
            Short priority,
            String status,
            String notes) {
    }

    public record Response(
            UUID id,
            String title,
            OffsetDateTime dueBy,
            short priority,
            String status,
            String notes) {

        public static Response from(Task t) {
            return new Response(
                    t.getId(),
                    t.getTitle(),
                    t.getDueBy(),
                    t.getPriority(),
                    t.getStatus(),
                    t.getNotes());
        }
    }

    private TaskDto() {
    }
}
