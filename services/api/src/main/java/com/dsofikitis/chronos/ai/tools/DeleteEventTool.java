package com.dsofikitis.chronos.ai.tools;

import com.dsofikitis.chronos.events.EventService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
class DeleteEventTool implements ToolHandler {

    private final EventService events;
    private final ObjectMapper json;

    DeleteEventTool(EventService events, ObjectMapper json) {
        this.events = events;
        this.json = json;
    }

    @Override
    public String name() {
        return "delete_event";
    }

    @Override
    public String description() {
        return "Delete an event by id. Returns {ok: true} on success.";
    }

    @Override
    public JsonNode inputSchema() {
        ObjectNode schema = json.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties").putObject("id").put("type", "string");
        schema.putArray("required").add("id");
        return schema;
    }

    @Override
    public JsonNode handle(JsonNode input, UUID userId) {
        events.delete(userId, UUID.fromString(input.path("id").asText()));
        return json.createObjectNode().put("ok", true);
    }
}
