package com.dsofikitis.chronos.ai;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder(toBuilder = true)
public class ChatMessage {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "tool_name")
    private String toolName;

    @Column(name = "tool_call_id")
    private String toolCallId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}
