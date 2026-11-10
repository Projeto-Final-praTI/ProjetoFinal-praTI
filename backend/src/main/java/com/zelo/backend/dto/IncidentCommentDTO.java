package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Comentário associado a um ponto crítico.
 */
@Schema(description = "Comentário de um usuário em um ponto crítico.")
public class IncidentCommentDTO {

    @Schema(description = "Identificador do comentário (UUID).")
    private UUID id;

    @Schema(description = "Nome de quem comentou.", example = "Maria Silva")
    private String authorName;

    @Schema(description = "Texto do comentário (até 1000 caracteres).", example = "Confirmo, o buraco está piorando.")
    private String content;

    @Schema(description = "Data do comentário.", example = "2026-10-21T12:05:00-03:00")
    private OffsetDateTime createdAt;

    public IncidentCommentDTO() {
    }

    public IncidentCommentDTO(UUID id, String authorName, String content, OffsetDateTime createdAt) {
        this.id = id;
        this.authorName = authorName;
        this.content = content;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
