package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * Motivo da recusa de uma denúncia de pessoa desaparecida.
 */
@Schema(description = "Motivo da recusa de uma denúncia.")
public class RejectMissingPersonRequestDTO {

    @Schema(description = "Motivo da recusa (opcional, visível para o denunciante/moderadores).",
            example = "Foto ilegível ou dados insuficientes.")
    @Size(max = 500, message = "Motivo deve ter no máximo 500 caracteres")
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
