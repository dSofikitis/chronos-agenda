package com.dsofikitis.chronos.ai;

import com.dsofikitis.chronos.auth.CurrentUserIdResolver.CurrentUserId;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
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
        return assistant.chat(userId, req.message());
    }

    public record ChatRequest(@NotBlank String message) {
    }
}
