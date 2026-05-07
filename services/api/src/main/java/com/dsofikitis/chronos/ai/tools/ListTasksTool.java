package com.dsofikitis.chronos.ai.tools;

import com.dsofikitis.chronos.tasks.TaskService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
class ListTasksTool implements ToolHandler {

    private final TaskService tasks;
    private final ObjectMapper json;

    ListTasksTool(TaskService tasks, ObjectMapper json) {
        this.tasks = tasks;
        this.json = json;
    }

    @Override
    public String name() {
        return "list_tasks";
    }

    @Override
    public String description() {
        return "List the user's tasks. Filter by status: open, done, or all.";
    }

    @Override
    public JsonNode inputSchema() {
        ObjectNode schema = json.createObjectNode();
        schema.put("type", "object");
        var props = schema.putObject("properties");
        var status = props.putObject("status");
        status.put("type", "string");
        var enums = status.putArray("enum");
        enums.add("open");
        enums.add("done");
        enums.add("all");
        return schema;
    }

    @Override
    public JsonNode handle(JsonNode input, UUID userId) {
        var status = input.has("status") ? input.get("status").asText() : "open";
        ArrayNode out = json.createArrayNode();
        for (var task : tasks.list(userId, status)) {
            ObjectNode node = json.createObjectNode();
            node.put("id", task.getId().toString());
            node.put("title", task.getTitle());
            if (task.getDueBy() != null) node.put("dueBy", task.getDueBy().toString());
            node.put("priority", task.getPriority());
            node.put("status", task.getStatus());
            if (task.getNotes() != null) node.put("notes", task.getNotes());
            out.add(node);
        }
        return out;
    }
}
