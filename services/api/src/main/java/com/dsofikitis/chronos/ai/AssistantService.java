package com.dsofikitis.chronos.ai;

import com.dsofikitis.chronos.ai.llm.AnthropicClient;
import com.dsofikitis.chronos.ai.llm.ChatTurn;
import com.dsofikitis.chronos.ai.llm.GeminiClient;
import com.dsofikitis.chronos.ai.llm.LlmClient;
import com.dsofikitis.chronos.ai.llm.LlmException;
import com.dsofikitis.chronos.ai.llm.OllamaClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.dsofikitis.chronos.ai.tools.ToolRegistry;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssistantService {

    private static final Logger log = LoggerFactory.getLogger(AssistantService.class);
    private static final int MAX_TOOL_LOOPS = 6;

    private final ChatMessageRepository history;
    private final ToolRegistry tools;
    private final AnthropicClient anthropic;
    private final GeminiClient gemini;
    private final OllamaClient ollama;
    private final ObjectMapper json;
    private final int historyWindow;

    public AssistantService(
            ChatMessageRepository history,
            ToolRegistry tools,
            AnthropicClient anthropic,
            GeminiClient gemini,
            OllamaClient ollama,
            ObjectMapper json,
            @Value("${chronos.llm.history-window:12}") int historyWindow) {
        this.history = history;
        this.tools = tools;
        this.anthropic = anthropic;
        this.gemini = gemini;
        this.ollama = ollama;
        this.json = json;
        this.historyWindow = historyWindow;
    }

    /** Single non-streaming exchange. SSE streaming is a follow-up. */
    @Transactional
    public AssistantReply chat(UUID userId, String userMessage) {
        var client = pickClient();
        // Anthropic is the only backend whose tool wire-format differs from
        // OpenAI's. Gemini reuses the OpenAI shape and unwraps it inside the
        // GeminiClient.
        var toolDefs = client == anthropic ? tools.anthropicTools() : tools.openAiTools();

        // Persist the user turn first so failures still leave the question on record.
        save(userId, "user", userMessage, null, null);

        var turns = loadRecentHistory(userId);
        turns.add(ChatTurn.user(userMessage));

        try {
            for (int loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
                var reply = client.complete(turns, toolDefs);

                if (reply.hasToolCalls()) {
                    turns.add(reply);
                    save(userId, "assistant", "", null, null);
                    for (var call : reply.toolCalls()) {
                        JsonNode result = tools.invoke(call.name(), call.input(), userId);
                        String resultStr = jsonToString(result);
                        turns.add(ChatTurn.toolResult(call.id(), call.name(), resultStr));
                        save(userId, "tool", resultStr, call.name(), call.id());
                    }
                    continue;
                }

                // Final text turn — persist and return.
                save(userId, "assistant", reply.content(), null, null);
                return new AssistantReply(client.backend(), reply.content());
            }
        } catch (LlmException e) {
            log.warn("LLM call failed via {}: {}", client.backend(), e.getMessage());
            var msg = friendlyLlmError(client);
            save(userId, "assistant", msg, null, null);
            return new AssistantReply("system", msg);
        }

        var stuck = "I made " + MAX_TOOL_LOOPS
                + " tool calls without reaching a conclusion. Please rephrase the request.";
        save(userId, "assistant", stuck, null, null);
        return new AssistantReply(client.backend(), stuck);
    }

    /**
     * Pick a message that helps the user fix the most likely cause without
     * digging through API logs. The Ollama fallback failing is by far the
     * common case in local dev — no key set, no Ollama running, channel
     * dies on connect.
     */
    private String friendlyLlmError(LlmClient client) {
        if (client == ollama) {
            return "I'm not configured with an LLM backend yet. Set "
                    + "AGENT_MODE=gemini (or claude) and AGENT_KEY=<your-key> in "
                    + "the project's .env, then restart the API. Without that I "
                    + "fall back to a local Ollama on http://localhost:11434, "
                    + "which doesn't appear to be running.";
        }
        return "The "
                + client.backend()
                + " backend rejected the request. Double-check that AGENT_KEY is "
                + "valid and the model id is one this provider supports.";
    }

    private LlmClient pickClient() {
        if (anthropic.configured()) return anthropic;
        if (gemini.configured()) return gemini;
        return ollama;
    }

    private List<ChatTurn> loadRecentHistory(UUID userId) {
        var rows = history.findByUserIdOrderByCreatedAtDesc(userId, Limit.of(historyWindow));
        Collections.reverse(rows);
        var turns = new ArrayList<ChatTurn>(rows.size());
        for (var row : rows) {
            switch (row.getRole()) {
                case "user" -> turns.add(ChatTurn.user(row.getContent()));
                case "assistant" -> turns.add(ChatTurn.assistantText(row.getContent()));
                case "tool" -> turns.add(ChatTurn.toolResult(
                        row.getToolCallId(), row.getToolName(), row.getContent()));
                default -> { /* ignore unknown */ }
            }
        }
        return turns;
    }

    private void save(UUID userId, String role, String content, String toolName, String toolCallId) {
        history.save(ChatMessage.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .role(role)
                .content(content == null ? "" : content)
                .toolName(toolName)
                .toolCallId(toolCallId)
                .createdAt(OffsetDateTime.now())
                .build());
    }

    private String jsonToString(JsonNode node) {
        try {
            return json.writeValueAsString(node);
        } catch (Exception e) {
            return "{\"error\":\"failed to serialize tool result\"}";
        }
    }

    public record AssistantReply(String backend, String text) {
    }
}
