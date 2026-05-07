package com.dsofikitis.chronos.ai.tools;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;

/**
 * One assistant tool. Implementations must be {@code @Component} so the
 * registry can discover them; the registry guarantees per-user authorization
 * is upstream of every tool invocation.
 */
public interface ToolHandler {

    /** Stable identifier — must match the LLM's {@code tool_use.name}. */
    String name();

    /** One-line natural-language description shown to the LLM. */
    String description();

    /** JSON schema for the tool's input. */
    JsonNode inputSchema();

    /**
     * Execute the tool. Authorization is enforced by the underlying service
     * (event/task service); this method scopes by {@code userId} on every call.
     *
     * @return JSON node ready to be appended to the conversation as a tool
     *         result; should be a serializable view, not an entity.
     */
    JsonNode handle(JsonNode input, UUID userId);
}
