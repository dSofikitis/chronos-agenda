package com.dsofikitis.chronos.ai;

import com.dsofikitis.chronos.ai.llm.AnthropicClient;
import com.dsofikitis.chronos.ai.llm.ChatTurn;
import com.dsofikitis.chronos.ai.llm.GeminiClient;
import com.dsofikitis.chronos.ai.llm.LlmClient;
import com.dsofikitis.chronos.ai.llm.LlmException;
import com.dsofikitis.chronos.ai.llm.OllamaClient;
import com.dsofikitis.chronos.ai.tools.ToolRegistry;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    /**
     * What the UI knows about the user's current view of the calendar — the
     * week visible on /agenda and whether weekends are hidden. Optional;
     * the assistant runs fine without it but produces sharper "this week"
     * answers when it has it.
     */
    public record ViewContext(
            LocalDate visibleWeekStart,
            LocalDate visibleWeekEnd,
            boolean hideWeekends) {
    }

    /** Single non-streaming exchange. SSE streaming is a follow-up. */
    @Transactional
    public AssistantReply chat(UUID userId, String userMessage, ViewContext view) {
        var client = pickClient();
        // Anthropic is the only backend whose tool wire-format differs from
        // OpenAI's. Gemini reuses the OpenAI shape and unwraps it inside the
        // GeminiClient.
        var toolDefs = client == anthropic ? tools.anthropicTools() : tools.openAiTools();
        var preamble = buildSystemPreamble(view);

        // Persist the user turn first so failures still leave the question on record.
        save(userId, "user", userMessage, null, null);

        var turns = loadRecentHistory(userId);
        turns.add(ChatTurn.user(userMessage));

        try {
            for (int loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
                var reply = client.complete(turns, toolDefs, preamble);

                if (reply.hasToolCalls()) {
                    // Threaded into the in-flight conversation but NOT
                    // persisted: replaying tool_use / tool_result pairs
                    // across requests breaks Gemini's strict pairing rule
                    // ("functionResponse must immediately follow
                    // functionCall"). The model can re-fetch via tools on
                    // the next turn if it needs the same data.
                    turns.add(reply);
                    for (var call : reply.toolCalls()) {
                        JsonNode result = tools.invoke(call.name(), call.input(), userId);
                        String resultStr = jsonToString(result);
                        turns.add(ChatTurn.toolResult(call.id(), call.name(), resultStr));
                    }
                    continue;
                }

                // Final text turn — persist and return.
                save(userId, "assistant", reply.content(), null, null);
                return new AssistantReply(client.backend(), reply.content());
            }
        } catch (LlmException e) {
            log.warn("LLM call failed via {}: {}", client.backend(), e.getMessage());
            var msg = friendlyLlmError(client, e);
            save(userId, "assistant", msg, null, null);
            return new AssistantReply("system", msg);
        }

        var stuck = "I made " + MAX_TOOL_LOOPS
                + " tool calls without reaching a conclusion. Please rephrase the request.";
        save(userId, "assistant", stuck, null, null);
        return new AssistantReply(client.backend(), stuck);
    }

    /** Wipe a user's conversation history. Returns the row count deleted. */
    @Transactional
    public int clearHistory(UUID userId) {
        return history.deleteByUserId(userId);
    }

    /**
     * Backend-agnostic system preamble that pins the assistant to the user's
     * actual "now" and what they're currently looking at. Without this Gemini
     * in particular asks "what's today's date?" before answering anything
     * relative.
     */
    private String buildSystemPreamble(ViewContext view) {
        var now = ZonedDateTime.now();
        var line = new StringBuilder();
        var dow = now.format(DateTimeFormatter.ofPattern("EEEE", Locale.ENGLISH));
        var date = now.format(DateTimeFormatter.ISO_LOCAL_DATE);
        var time = now.format(DateTimeFormatter.ofPattern("HH:mm"));
        line.append("Current context (do NOT ask the user for these):\n");
        line.append("- Today is ").append(dow).append(", ").append(date)
                .append(" — local time ").append(time)
                .append(" ").append(now.getOffset().getId())
                .append(" (").append(now.getZone().getId()).append(").\n");

        if (view != null && view.visibleWeekStart() != null && view.visibleWeekEnd() != null) {
            line.append("- The user is currently viewing the week ")
                    .append(view.visibleWeekStart())
                    .append(" → ")
                    .append(view.visibleWeekEnd())
                    .append(".\n");
            if (view.hideWeekends()) {
                line.append("- Weekends are hidden from their view; refer to ")
                        .append("Monday–Friday only unless they explicitly mention Saturday or Sunday.\n");
            }
        }
        line.append("Resolve relative phrases (\"this week\", \"tomorrow\", ")
                .append("\"next Tuesday\") against today's date above. ")
                .append("Always emit ISO-8601 datetimes with a timezone offset ")
                .append("(e.g. ").append(date).append("T15:00:00")
                .append(now.getOffset().getId()).append(").");
        return line.toString();
    }

    /**
     * Pick a message that helps the user fix the most likely cause without
     * digging through API logs. The Ollama fallback failing is by far the
     * common case in local dev — no key set, no Ollama running, channel
     * dies on connect.
     */
    private String friendlyLlmError(LlmClient client, LlmException e) {
        if (client == ollama) {
            return "I'm not configured with an LLM backend yet. Set "
                    + "AGENT_MODE=gemini (or claude) and AGENT_KEY=<your-key> in "
                    + "the project's .env, then restart the API. Without that I "
                    + "fall back to a local Ollama on http://localhost:11434, "
                    + "which doesn't appear to be running.";
        }

        var name = capitalize(client.backend());
        var msg = e.getMessage() == null ? "" : e.getMessage();

        // Rate limit (free-tier quota or burst). Surface the retry-after
        // hint when the provider gives one — Gemini does, Anthropic
        // sometimes does in the body.
        if (msg.contains(" 429") || msg.contains("RESOURCE_EXHAUSTED")
                || msg.contains("rate_limit") || msg.contains("rate-limit")) {
            var retry = parseRetryHint(msg);
            return name + " is rate-limiting requests" + retry
                    + ". Free tiers cap requests per minute; either wait a "
                    + "moment, switch to a paid plan, or pick a different "
                    + "model via CHRONOS_GEMINI_MODEL / CHRONOS_CLAUDE_MODEL.";
        }
        if (msg.contains(" 401") || msg.contains(" 403")
                || msg.toLowerCase().contains("unauthorized")) {
            return name + " rejected the API key. Check that AGENT_KEY in "
                    + ".env is current and active for this provider.";
        }
        if (msg.contains(" 404") || msg.toLowerCase().contains("model not found")) {
            return name + " couldn't find the requested model. Set "
                    + "CHRONOS_" + client.backend().toUpperCase()
                    + "_MODEL to a model id this provider supports.";
        }
        return name + " returned an error. Double-check that AGENT_KEY is "
                + "valid and the model id is one this provider supports.";
    }

    /** Pull "Please retry in 12.4s" out of provider 429 bodies. */
    private static String parseRetryHint(String body) {
        var m = java.util.regex.Pattern.compile("retry in ([0-9.]+)\\s*s")
                .matcher(body);
        if (!m.find()) return "";
        try {
            long secs = Math.round(Double.parseDouble(m.group(1)));
            return " — please retry in ~" + secs + "s";
        } catch (NumberFormatException ex) {
            return "";
        }
    }

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return s == null ? "" : s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
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
            // Only replay user and final assistant text turns. Tool turns
            // (and the empty-content assistant rows that older builds wrote
            // alongside them) get filtered: replaying them across requests
            // breaks Gemini's strict tool_use → tool_result pairing rule.
            switch (row.getRole()) {
                case "user" -> {
                    if (row.getContent() != null && !row.getContent().isBlank()) {
                        turns.add(ChatTurn.user(row.getContent()));
                    }
                }
                case "assistant" -> {
                    if (row.getContent() != null && !row.getContent().isBlank()) {
                        turns.add(ChatTurn.assistantText(row.getContent()));
                    }
                }
                default -> { /* drop "tool" rows + anything unknown */ }
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
