package com.dsofikitis.chronos.ai.llm;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

/**
 * Thin LLM-backend abstraction. Both implementations consume the same chat
 * history + tool registry, return a {@link ChatTurn} containing either a final
 * text reply or a list of tool calls the assistant wants the API to execute.
 */
public interface LlmClient {

    /** Stable id used in logs / fallbacks ({@code anthropic} | {@code ollama}). */
    String backend();

    ChatTurn complete(List<ChatTurn> history, JsonNode tools);
}
