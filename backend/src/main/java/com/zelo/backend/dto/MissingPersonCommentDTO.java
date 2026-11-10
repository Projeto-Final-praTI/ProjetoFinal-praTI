package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Comentário ou avistamento de uma denúncia de pessoa desaparecida.
 */
@Schema(description = "Comentário/avistamento em uma denúncia de pessoa desaparecida.")
public class MissingPersonCommentDTO {

    @Schema(description = "Identificador do comentário.")
    private UUID id;

    @Schema(description = "Nome de quem comentou.", example = "Maria Souza")
    private String authorName;

    @Schema(description = "Texto do comentário (pode vir vazio quando há imagem).",
            example = "Vi uma pessoa parecida perto da rodoviária.")
    private String content;

    @Schema(description = "URL da imagem enviada junto do comentário, se houver.")
    private String imageUrl;

    @Schema(description = "Verdadeiro quando o comentário é do denunciante original.")
    private boolean reporter;

    @Schema(description = "Data/hora do comentário.")
    private OffsetDateTime createdAt;

    public MissingPersonCommentDTO() {
    }

    public MissingPersonCommentDTO(UUID id, String authorName, String content, String imageUrl,
                                   boolean reporter, OffsetDateTime createdAt) {
        this.id = id;
        this.authorName = authorName;
        this.content = content;
        this.imageUrl = imageUrl;
        this.reporter = reporter;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public boolean isReporter() { return reporter; }
    public void setReporter(boolean reporter) { this.reporter = reporter; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
