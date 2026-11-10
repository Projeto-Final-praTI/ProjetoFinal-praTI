package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Registro de alteração de status de um ponto crítico.
 */
@Schema(description = "Entrada da linha do tempo de status/notas de um ponto crítico.")
public class IncidentStatusHistoryDTO {

    @Schema(description = "Identificador da entrada (UUID).")
    private UUID id;

    @Schema(description = "Status anterior.", allowableValues = {"ABERTO", "EM_ATENDIMENTO", "RESOLVIDO"}, example = "ABERTO")
    private String previousStatus;

    @Schema(description = "Status novo.", allowableValues = {"ABERTO", "EM_ATENDIMENTO", "RESOLVIDO"}, example = "EM_ATENDIMENTO")
    private String newStatus;

    @Schema(description = "Nota operacional registrada junto com a mudança.", example = "Equipe da prefeitura acionada às 14:30")
    private String note;

    @Schema(description = "Quem registrou a mudança.", example = "Gestor de São Paulo")
    private String authorName;

    @Schema(description = "Data da mudança.", example = "2026-10-21T14:30:00-03:00")
    private OffsetDateTime createdAt;

    public IncidentStatusHistoryDTO() {
    }

    public IncidentStatusHistoryDTO(UUID id, String previousStatus, String newStatus,
                                    String note, String authorName, OffsetDateTime createdAt) {
        this.id = id;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.note = note;
        this.authorName = authorName;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
