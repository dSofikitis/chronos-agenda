package com.dsofikitis.chronos.ai.llm;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

/**
 * One turn in the assistant conversation. Either:
 *   - role=user / system / assistant with a text content, or
 *   - role=assistant with one or more tool_calls, or
 *   - role=tool with a tool_call_id + result content.
 */
public record ChatTurn(
        Role role,
        String content,
        List<ToolCall> toolCalls,
        String toolCallId,
        String toolName) {

    public enum Role { SYSTEM, USER, ASSISTANT, TOOL }

    public record ToolCall(String id, String name, JsonNode input) {
    }

    public static ChatTurn user(String text) {
        return new ChatTurn(Role.USER, text, List.of(), null, null);
    }

    public static ChatTurn system(String text) {
        return new ChatTurn(Role.SYSTEM, text, List.of(), null, null);
    }

    public static ChatTurn assistantText(String text) {
        return new ChatTurn(Role.ASSISTANT, text, List.of(), null, null);
    }

    public static ChatTurn assistantToolCalls(List<ToolCall> calls) {
        return new ChatTurn(Role.ASSISTANT, "", calls, null, null);
    }

    public static ChatTurn toolResult(String callId, String name, String content) {
        return new ChatTurn(Role.TOOL, content, List.of(), callId, name);
    }

    public boolean hasToolCalls() {
        return toolCalls != null && !toolCalls.isEmpty();
    }
}
