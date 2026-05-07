package com.dsofikitis.chronos.ai.tools;

import com.dsofikitis.chronos.events.EventService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
class ListEventsTool implements ToolHandler {

    private final EventService events;
    private final ObjectMapper json;

    ListEventsTool(EventService events, ObjectMapper json) {
        this.events = events;
        this.json = json;
    }

    @Override
    public String name() {
        return "list_events";
    }

    @Override
    public String description() {
        return "List the user's events in the [from, to) ISO-8601 datetime window.";
    }

    @Override
    public JsonNode inputSchema() {
        ObjectNode schema = json.createObjectNode();
        schema.put("type", "object");
        var props = schema.putObject("properties");
        props.putObject("from").put("type", "string").put("format", "date-time");
        props.putObject("to").put("type", "string").put("format", "date-time");
        var required = schema.putArray("required");
        required.add("from");
        required.add("to");
        return schema;
    }

    @Override
    public JsonNode handle(JsonNode input, UUID userId) {
        var from = OffsetDateTime.parse(input.path("from").asText());
        var to = OffsetDateTime.parse(input.path("to").asText());
        ArrayNode out = json.createArrayNode();
        for (var event : events.listInWindow(userId, from, to)) {
            ObjectNode node = json.createObjectNode();
            node.put("id", event.getId().toString());
            node.put("title", event.getTitle());
            node.put("startsAt", event.getStartsAt().toString());
            node.put("endsAt", event.getEndsAt().toString());
            node.put("allDay", event.isAllDay());
            if (event.getLocation() != null) node.put("location", event.getLocation());
            if (event.getNotes() != null) node.put("notes", event.getNotes());
            out.add(node);
        }
        return out;
    }
}
