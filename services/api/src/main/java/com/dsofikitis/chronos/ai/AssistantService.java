package com.dsofikitis.chronos.ai;

import com.dsofikitis.chronos.ai.llm.AnthropicClient;
import com.dsofikitis.chronos.ai.llm.ChatTurn;
import com.dsofikitis.chronos.ai.llm.LlmClient;
import com.dsofikitis.chronos.ai.llm.OllamaClient;
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

    private static final int MAX_TOOL_LOOPS = 6;

    private final ChatMessageRepository history;
    private final ToolRegistry tools;
    private final AnthropicClient anthropic;
    private final OllamaClient ollama;
    private final ObjectMapper json;
    private final int historyWindow;

    public AssistantService(
            ChatMessageRepository history,
            ToolRegistry tools,
            AnthropicClient anthropic,
            OllamaClient ollama,
            ObjectMapper json,
            @Value("${chronos.llm.history-window:12}") int historyWindow) {
        this.history = history;
        this.tools = tools;
        this.anthropic = anthropic;
        this.ollama = ollama;
        this.json = json;
        this.historyWindow = historyWindow;
    }

    /** Single non-streaming exchange. SSE streaming is a follow-up. */
    @Transactional
    public AssistantReply chat(UUID userId, String userMessage) {
        var client = pickClient();
        var toolDefs = clientUsesAnthropic(client) ? tools.anthropicTools() : tools.openAiTools();

        // Persist the user turn first so failures still leave the question on record.
        save(userId, "user", userMessage, null, null);

        var turns = loadRecentHistory(userId);
        turns.add(ChatTurn.user(userMessage));

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

        var stuck = "I made " + MAX_TOOL_LOOPS
                + " tool calls without reaching a conclusion. Please rephrase the request.";
        save(userId, "assistant", stuck, null, null);
        return new AssistantReply(client.backend(), stuck);
    }

    private LlmClient pickClient() {
        return anthropic.configured() ? anthropic : ollama;
    }

    private static boolean clientUsesAnthropic(LlmClient c) {
        return "anthropic".equals(c.backend());
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
