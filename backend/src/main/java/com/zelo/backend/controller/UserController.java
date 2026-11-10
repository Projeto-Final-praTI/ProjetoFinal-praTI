package com.zelo.backend.controller;

import com.zelo.backend.dto.ErrorResponseDTO;
import com.zelo.backend.dto.UpdateProfileRequestDTO;
import com.zelo.backend.dto.UserDTO;
import com.zelo.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dados do próprio usuário autenticado.
 *
 * <p>Fica fora de {@code /api/auth/**} (que é permitAll) de propósito: assim cai em
 * {@code anyRequest().authenticated()} e exige token válido.
 */
@Tag(name = "2. Usuário",
        description = "Dados da própria conta: nome, cidade de atuação e troca de senha.")
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Atualiza nome, cidade e (opcionalmente) a senha do usuário logado.
     *
     * @param dto          novo nome, cidade e/ou nova senha
     * @param userDetails  usuário autenticado (extraído do token JWT)
     */
    @Operation(
            summary = "Atualizar meu perfil",
            description = """
                    Altera os dados da **conta logada**.

                    * `fullName` é obrigatório (até 150 caracteres);
                    * `city` é opcional — envie `""` para **limpar** a cidade;
                    * a troca de senha é opcional: informe `newPassword` **e** `currentPassword`
                      (a senha atual é validada; mínimo de 6 caracteres na nova).

                    E-mail, CPF e **cargo** não são alteráveis aqui — o cargo só muda pelo
                    painel administrativo.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Novos dados do perfil.",
                    required = true,
                    content = @Content(schema = @Schema(implementation = UpdateProfileRequestDTO.class))))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil atualizado.",
                    content = @Content(schema = @Schema(implementation = UserDTO.class))),
            @ApiResponse(responseCode = "400", description = "Nome vazio ou nova senha com menos de 6 caracteres.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "Token ausente ou inválido.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "403", description = "Senha atual incorreta.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateMe(
            @Valid @RequestBody UpdateProfileRequestDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.updateProfile(userDetails, dto));
    }
}
