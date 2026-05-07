package com.dsofikitis.chronos.ai;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByUserIdOrderByCreatedAtDesc(UUID userId, Limit limit);
}
