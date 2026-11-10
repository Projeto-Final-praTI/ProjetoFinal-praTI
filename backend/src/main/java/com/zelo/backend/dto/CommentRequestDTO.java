package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Corpo do comentário enviado em um ponto crítico.
 */
@Schema(description = "Conteúdo do comentário enviado por um usuário.")
public class CommentRequestDTO {

    @Schema(description = "Texto do comentário (obrigatório, até 1000 caracteres).",
            example = "Confirmo, o buraco está piorando com a chuva.")
    @NotBlank(message = "Comentário não pode estar vazio")
    @Size(max = 1000, message = "Comentário deve ter no máximo 1000 caracteres")
    private String content;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
