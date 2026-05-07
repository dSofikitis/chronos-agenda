package com.dsofikitis.chronos.ai.tools;

import com.dsofikitis.chronos.tasks.TaskDto;
import com.dsofikitis.chronos.tasks.TaskService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
class CreateTaskTool implements ToolHandler {

    private final TaskService tasks;
    private final ObjectMapper json;

    CreateTaskTool(TaskService tasks, ObjectMapper json) {
        this.tasks = tasks;
        this.json = json;
    }

    @Override
    public String name() {
        return "create_task";
    }

    @Override
    public String description() {
        return "Create a new task. Priority is 0 (low), 1 (normal), 2 (high).";
    }

    @Override
    public JsonNode inputSchema() {
        ObjectNode schema = json.createObjectNode();
        schema.put("type", "object");
        var props = schema.putObject("properties");
        props.putObject("title").put("type", "string");
        props.putObject("dueBy").put("type", "string").put("format", "date-time");
        var priority = props.putObject("priority");
        priority.put("type", "integer");
        priority.put("minimum", 0);
        priority.put("maximum", 2);
        props.putObject("notes").put("type", "string");
        schema.putArray("required").add("title");
        return schema;
    }

    @Override
    public JsonNode handle(JsonNode input, UUID userId) {
        var req = new TaskDto.CreateRequest(
                input.path("title").asText(),
                input.has("dueBy") ? OffsetDateTime.parse(input.get("dueBy").asText()) : null,
                input.has("priority") ? (short) input.get("priority").asInt() : null,
                input.has("notes") ? input.get("notes").asText() : null);
        var created = tasks.create(userId, req);

        ObjectNode out = json.createObjectNode();
        out.put("id", created.getId().toString());
        out.put("title", created.getTitle());
        if (created.getDueBy() != null) out.put("dueBy", created.getDueBy().toString());
        out.put("priority", created.getPriority());
        out.put("status", created.getStatus());
        return out;
    }
}
