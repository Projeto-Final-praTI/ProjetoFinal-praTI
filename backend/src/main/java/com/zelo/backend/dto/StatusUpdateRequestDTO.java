package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Corpo de PUT /api/incidents/{id}/status — transição de status operacional
 * com nota opcional do operador (fiscal/gestor/root).
 */
@Schema(description = "Mudança de status de um ponto crítico, com nota opcional.")
public class StatusUpdateRequestDTO {

    /** Nome do novo status: ABERTO | EM_ATENDIMENTO | RESOLVIDO */
    @Schema(description = "Novo status do ponto crítico.",
            allowableValues = {"ABERTO", "EM_ATENDIMENTO", "RESOLVIDO"}, example = "EM_ATENDIMENTO")
    private String status;

    /** Nota da linha do tempo (ex.: "Equipe da prefeitura acionada às 14:30"). */
    @Schema(description = "Nota da linha do tempo (opcional).",
            example = "Equipe da prefeitura acionada às 14:30")
    private String note;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
