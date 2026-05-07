package com.dsofikitis.chronos.ai;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByUserIdOrderByCreatedAtDesc(UUID userId, Limit limit);

    @Modifying
    @Transactional
    @Query("DELETE FROM ChatMessage m WHERE m.userId = :userId")
    long deleteByUserId(@Param("userId") UUID userId);
}
