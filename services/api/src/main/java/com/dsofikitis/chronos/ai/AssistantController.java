package com.dsofikitis.chronos.ai;

import com.dsofikitis.chronos.auth.CurrentUserIdResolver.CurrentUserId;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistant;

    public AssistantController(AssistantService assistant) {
        this.assistant = assistant;
    }

    @PostMapping("/chat")
    public AssistantService.AssistantReply chat(
            @CurrentUserId UUID userId,
            @Valid @RequestBody ChatRequest req) {
        var view = req.toViewContext();
        return assistant.chat(userId, req.message(), view);
    }

    @DeleteMapping("/history")
    public Map<String, Object> clear(@CurrentUserId UUID userId) {
        long deleted = assistant.clearHistory(userId);
        return Map.of("deleted", deleted);
    }

    public record ChatRequest(
            @NotBlank String message,
            LocalDate visibleWeekStart,
            LocalDate visibleWeekEnd,
            Boolean hideWeekends) {

        AssistantService.ViewContext toViewContext() {
            if (visibleWeekStart == null || visibleWeekEnd == null) return null;
            return new AssistantService.ViewContext(
                    visibleWeekStart,
                    visibleWeekEnd,
                    Boolean.TRUE.equals(hideWeekends));
        }
    }
}
