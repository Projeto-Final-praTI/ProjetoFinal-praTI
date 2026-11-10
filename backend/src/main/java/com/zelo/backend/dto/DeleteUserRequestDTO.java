package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Corpo de DELETE /api/admin/users/{id} — exclusão de usuário pelo ROOT.
 *
 * O root decide explicitamente o destino dos pontos críticos registrados pelo
 * usuário que será apagado. Se {@code deleteIncidents = false}, os pontos são
 * MANTIDOS e a autoria é transferida para uma conta técnica de sistema,
 * anonimizando o autor original sem perder o histórico do mapa.
 */
@Schema(description = "Opções de exclusão de usuário (ROOT).")
public class DeleteUserRequestDTO {

    /**
     * true  → apaga também todos os pontos críticos do usuário (e seus
     *         comentários/upvotes).
     * false → mantém os pontos no mapa, anonimizando a autoria.
     * O padrão é false (mais conservador: não destrói dados do mapa).
     */
    @Schema(description = "Se `true`, apaga também os pontos críticos do usuário. Se `false` (padrão), mantém os pontos e anonimiza a autoria.",
            example = "false")
    private boolean deleteIncidents = false;

    public boolean isDeleteIncidents() { return deleteIncidents; }
    public void setDeleteIncidents(boolean deleteIncidents) { this.deleteIncidents = deleteIncidents; }
}
