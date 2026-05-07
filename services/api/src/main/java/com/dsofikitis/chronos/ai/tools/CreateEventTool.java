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
class CreateEventTool implements ToolHandler {

    private final EventService events;
    private final ObjectMapper json;

    CreateEventTool(EventService events, ObjectMapper json) {
        this.events = events;
        this.json = json;
    }

    @Override
    public String name() {
        return "create_event";
    }

    @Override
    public String description() {
        return "Create a new event for the user. Times are ISO-8601 with timezone.";
    }

    @Override
    public JsonNode inputSchema() {
        ObjectNode schema = json.createObjectNode();
        schema.put("type", "object");
        var props = schema.putObject("properties");
        props.putObject("title").put("type", "string");
        props.putObject("startsAt").put("type", "string").put("format", "date-time");
        props.putObject("endsAt").put("type", "string").put("format", "date-time");
        props.putObject("allDay").put("type", "boolean");
        props.putObject("location").put("type", "string");
        props.putObject("notes").put("type", "string");
        var required = schema.putArray("required");
        required.add("title");
        required.add("startsAt");
        required.add("endsAt");
        return schema;
    }

    @Override
    public JsonNode handle(JsonNode input, UUID userId) {
        var req = new EventDto.CreateRequest(
                input.path("title").asText(),
                OffsetDateTime.parse(input.path("startsAt").asText()),
                OffsetDateTime.parse(input.path("endsAt").asText()),
                input.has("allDay") ? input.get("allDay").asBoolean() : null,
                input.has("location") ? input.get("location").asText() : null,
                input.has("notes") ? input.get("notes").asText() : null);
        var created = events.create(userId, req);

        ObjectNode out = json.createObjectNode();
        out.put("id", created.getId().toString());
        out.put("title", created.getTitle());
        out.put("startsAt", created.getStartsAt().toString());
        out.put("endsAt", created.getEndsAt().toString());
        return out;
    }
}
