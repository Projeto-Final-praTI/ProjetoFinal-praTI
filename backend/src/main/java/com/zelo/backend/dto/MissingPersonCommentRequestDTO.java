package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * Parte {@code data} do multipart de comentário em uma denúncia de pessoa
 * desaparecida. A imagem é opcional (parte {@code image}); o texto pode vir
 * vazio quando a mensagem é só a imagem.
 */
@Schema(description = "Comentário/avistamento em uma denúncia de pessoa desaparecida.")
public class MissingPersonCommentRequestDTO {

    @Schema(description = "Texto do comentário (opcional quando há imagem).",
            example = "Vi uma pessoa parecida perto da rodoviária.")
    @Size(max = 1000, message = "Comentário deve ter no máximo 1000 caracteres")
    private String content;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
