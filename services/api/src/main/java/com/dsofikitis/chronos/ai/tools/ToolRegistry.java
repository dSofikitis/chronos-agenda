package com.dsofikitis.chronos.ai.tools;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Bean container that exposes every {@link ToolHandler} by name + assembles the
 * JSON schema list both LLM backends expect.
 */
@Component
public class ToolRegistry {

    private final Map<String, ToolHandler> byName;
    private final ObjectMapper json;

    public ToolRegistry(List<ToolHandler> handlers, ObjectMapper json) {
        this.byName = handlers.stream()
                .collect(Collectors.toUnmodifiableMap(ToolHandler::name, Function.identity()));
        this.json = json;
    }

    public Map<String, ToolHandler> all() {
        return byName;
    }

    /** Anthropic-flavored tool definitions: {@code [{name, description, input_schema}]}. */
    public ArrayNode anthropicTools() {
        var arr = json.createArrayNode();
        for (var h : byName.values()) {
            ObjectNode node = json.createObjectNode();
            node.put("name", h.name());
            node.put("description", h.description());
            node.set("input_schema", h.inputSchema());
            arr.add(node);
        }
        return arr;
    }

    /** OpenAI-flavored tool definitions, also accepted by Ollama's chat API. */
    public ArrayNode openAiTools() {
        var arr = json.createArrayNode();
        for (var h : byName.values()) {
            ObjectNode wrapper = json.createObjectNode();
            wrapper.put("type", "function");
            ObjectNode fn = wrapper.putObject("function");
            fn.put("name", h.name());
            fn.put("description", h.description());
            fn.set("parameters", h.inputSchema());
            arr.add(wrapper);
        }
        return arr;
    }

    public JsonNode invoke(String name, JsonNode input, UUID userId) {
        var handler = byName.get(name);
        if (handler == null) {
            return json.createObjectNode().put("error", "unknown tool: " + name);
        }
        try {
            return handler.handle(input, userId);
        } catch (Exception e) {
            return json.createObjectNode()
                    .put("error", e.getClass().getSimpleName())
                    .put("message", e.getMessage() != null ? e.getMessage() : "");
        }
    }
}
