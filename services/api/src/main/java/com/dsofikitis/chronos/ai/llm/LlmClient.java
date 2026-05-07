package com.dsofikitis.chronos.ai.llm;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

/**
 * Thin LLM-backend abstraction. All implementations consume the same chat
 * history + tool registry and an optional system preamble (current date,
 * timezone, etc.), and return a {@link ChatTurn} containing either a final
 * text reply or a list of tool calls the assistant wants the API to execute.
 */
public interface LlmClient {

    /** Stable id used in logs / fallbacks ({@code anthropic} | {@code gemini} | {@code ollama}). */
    String backend();

    /**
     * @param systemPreamble Backend-agnostic, time-sensitive context appended
     *     to the per-backend system prompt. Pass empty string for none.
     */
    ChatTurn complete(List<ChatTurn> history, JsonNode tools, String systemPreamble);
}
