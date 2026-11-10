package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * Atualização do próprio perfil (PUT /api/users/me).
 *
 * E-mail e CPF não são alteráveis: são identificadores/credenciais de login.
 * A troca de senha é opcional e, quando informada, exige a senha atual.
 */
@Getter
@Setter
@Schema(description = "Novos dados do perfil do usuário logado.")
public class UpdateProfileRequestDTO {

    @Schema(description = "Novo nome completo (obrigatório).", example = "Maria Silva Santos")
    @NotBlank(message = "Nome completo é obrigatório")
    private String fullName;

    /** Cidade de atuação (opcional). Vazio limpa a cidade. */
    @Schema(description = "Nova cidade de atuação. Envie `\"\"` para limpar.", example = "São Paulo")
    private String city;

    /** Senha atual — obrigatória apenas quando {@code newPassword} é informada. */
    @Schema(description = "Senha atual — obrigatória somente se `newPassword` for enviada.", example = "senha123", format = "password")
    private String currentPassword;

    /** Nova senha (mínimo 6 caracteres) — opcional. */
    @Schema(description = "Nova senha (opcional, mínimo de 6 caracteres).", example = "novaSenha123", minLength = 6, format = "password")
    private String newPassword;
}
