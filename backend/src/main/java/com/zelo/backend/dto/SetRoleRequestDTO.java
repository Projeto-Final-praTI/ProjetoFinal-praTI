package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Corpo de PUT /api/admin/users/{id}/role — promover/rebaixar cargo.
 * O backend valida por papel de quem chama:
 * - ROOT: qualquer usuário, qualquer papel e cidade.
 * - GESTOR: SOMENTE usuários da MESMA cidade dele, e SOMENTE alterna
 *   USER <-> FISCAL (não pode criar gestores nem tocar em ROOT/GESTOR).
 */
@Schema(description = "Novo cargo (e cidade) de um usuário.")
public class SetRoleRequestDTO {

    /** Novo cargo: USER | FISCAL (ROOT também pode setar GESTOR). */
    @Schema(description = "Cargo a aplicar.",
            allowableValues = {"USER", "FISCAL", "GESTOR", "ROOT"}, example = "FISCAL")
    private String role;

    /** Cidade de atuação (obrigatória ao promover a FISCAL/GESTOR). */
    @Schema(description = "Cidade de atuação do usuário. Obrigatória para FISCAL/GESTOR; vazia limpa o campo.",
            example = "São Paulo")
    private String city;

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
}
