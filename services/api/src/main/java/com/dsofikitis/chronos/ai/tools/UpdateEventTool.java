package com.dsofikitis.chronos.ai.tools;

import com.dsofikitis.chronos.events.EventDto;
import com.dsofikitis.chronos.events.EventService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
class UpdateEventTool implements ToolHandler {

    private final EventService events;
    private final ObjectMapper json;

    UpdateEventTool(EventService events, ObjectMapper json) {
        this.events = events;
        this.json = json;
    }

    @Override
    public String name() {
        return "update_event";
    }

    @Override
    public String description() {
        return "Update an existing event. Pass only the fields that should change.";
    }

    @Override
    public JsonNode inputSchema() {
        ObjectNode schema = json.createObjectNode();
        schema.put("type", "object");
        var props = schema.putObject("properties");
        props.putObject("id").put("type", "string");
        props.putObject("title").put("type", "string");
        props.putObject("startsAt").put("type", "string").put("format", "date-time");
        props.putObject("endsAt").put("type", "string").put("format", "date-time");
        props.putObject("allDay").put("type", "boolean");
        props.putObject("location").put("type", "string");
        props.putObject("notes").put("type", "string");
        schema.putArray("required").add("id");
        return schema;
    }

    @Override
    public JsonNode handle(JsonNode input, UUID userId) {
        var req = new EventDto.UpdateRequest(
                input.has("title") ? input.get("title").asText() : null,
                input.has("startsAt") ? OffsetDateTime.parse(input.get("startsAt").asText()) : null,
                input.has("endsAt") ? OffsetDateTime.parse(input.get("endsAt").asText()) : null,
                input.has("allDay") ? input.get("allDay").asBoolean() : null,
                input.has("location") ? input.get("location").asText() : null,
                input.has("notes") ? input.get("notes").asText() : null);
        var updated = events.update(userId, UUID.fromString(input.path("id").asText()), req);

        ObjectNode out = json.createObjectNode();
        out.put("id", updated.getId().toString());
        out.put("title", updated.getTitle());
        out.put("startsAt", updated.getStartsAt().toString());
        out.put("endsAt", updated.getEndsAt().toString());
        return out;
    }
}
