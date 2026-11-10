package com.zelo.backend.controller;

import com.zelo.backend.dto.AdminStatsDTO;
import com.zelo.backend.dto.DeleteUserRequestDTO;
import com.zelo.backend.dto.ErrorResponseDTO;
import com.zelo.backend.dto.IncidentResponseDTO;
import com.zelo.backend.dto.SetRoleRequestDTO;
import com.zelo.backend.dto.UserDTO;
import com.zelo.backend.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Painel administrativo RBAC. Protegido no SecurityConfig:
 * - GET  /api/admin/**           → ROOT ou GESTOR
 * - PUT  /api/admin/users/{id}/role → regras extras no service (cidade/papel)
 * - GET  /api/admin/stats        → apenas ROOT (validado no service)
 */
@Tag(name = "5. Painel administrativo",
        description = """
                Gestão de usuários e visão operacional do painel administrativo.

                **Acesso:** `ROOT` ou `GESTOR`. O `GESTOR` só enxerga (e só pode alterar)
                dados da **própria cidade**; o `ROOT` tem visão irrestrita.

                Cada endpoint abaixo descreve exatamente o que o papel do chamador
                consegue fazer — quando a resposta for `403`, é por escopo de cidade
                ou por falta de privilégio.
                """)
@RestController
@RequestMapping("/api/admin")
public class AdminRestController {

    private final AdminService adminService;

    public AdminRestController(AdminService adminService) {
        this.adminService = adminService;
    }

    @Operation(
            summary = "Listar usuários",
            description = """
                    Lista os usuários visíveis para quem chama.

                    * `ROOT`: todos os usuários.
                    * `GESTOR`: apenas os usuários da **própria cidade**.

                    Filtros opcionais por nome/e-mail (`search`) e por cidade (`city`).
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de usuários do escopo do chamador.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserDTO.class)))),
            @ApiResponse(responseCode = "401", description = "Token ausente ou inválido.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "403", description = "Perfil sem acesso ao painel.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> users(
            @AuthenticationPrincipal UserDetails details,
            @Parameter(description = "Filtro por nome ou e-mail (parcial, sem diferenciar maiúsculas).")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filtro por cidade de atuação. Ignorado para gestores (que já são restritos à própria cidade).")
            @RequestParam(required = false) String city) {
        return ResponseEntity.ok(adminService.listUsers(details, search, city));
    }

    @Operation(
            summary = "Alterar cargo e/ou cidade",
            description = """
                    Promove ou rebaixa um usuário.

                    * `ROOT`: qualquer usuário, qualquer cargo (`USER`, `FISCAL`, `GESTOR` ou `ROOT`)
                      e qualquer cidade.
                    * `GESTOR`: **apenas** usuários da própria cidade e **apenas** alternando
                      `USER` ⇄ `FISCAL`. Não pode tocar em gestores nem em root.

                    Ao promover para `FISCAL`/`GESTOR` a `city` é obrigatória (senão `400`).
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Novo cargo e (opcionalmente) a nova cidade de atuação.",
                    required = true,
                    content = @Content(schema = @Schema(implementation = SetRoleRequestDTO.class))))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cargo/cidade atualizados.",
                    content = @Content(schema = @Schema(implementation = UserDTO.class))),
            @ApiResponse(responseCode = "400", description = "Cargo inválido ou cidade ausente ao promover.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "403", description = "Sem permissão (gestor fora da própria cidade, ou alvo protegido).",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "Usuário inexistente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserDTO> setRole(
            @Parameter(description = "Identificador do usuário alvo (UUID).")
            @PathVariable UUID id,
            @Valid @RequestBody SetRoleRequestDTO dto,
            @AuthenticationPrincipal UserDetails details) {
        return ResponseEntity.ok(adminService.setRole(id, dto, details));
    }

    @Operation(
            summary = "Listar pontos críticos do escopo",
            description = """
                    Lista os pontos críticos sob responsabilidade de quem chama.

                    * `ROOT`: todos os pontos.
                    * `GESTOR`: apenas os pontos da **própria cidade**.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de pontos do escopo.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = IncidentResponseDTO.class)))),
            @ApiResponse(responseCode = "401", description = "Token ausente ou inválido.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "403", description = "Perfil sem acesso ao painel.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @GetMapping("/incidents")
    public ResponseEntity<List<IncidentResponseDTO>> incidents(
            @AuthenticationPrincipal UserDetails details,
            @Parameter(description = "Filtro por cidade do ponto. Ignorado para gestores.")
            @RequestParam(required = false) String city) {
        return ResponseEntity.ok(adminService.listIncidents(details, city));
    }

    @Operation(
            summary = "Visão global (ROOT)",
            description = """
                    Contagens agregadas do sistema: total de usuários, total de pontos
                    críticos, distribuição por papel e por status e a lista de cidades
                    cadastradas.

                    **Exclusivo do ROOT** — um `GESTOR` recebe `403`.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Indicadores globais.",
                    content = @Content(schema = @Schema(implementation = AdminStatsDTO.class))),
            @ApiResponse(responseCode = "403", description = "Somente o root pode ver a visão global.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> stats(@AuthenticationPrincipal UserDetails details) {
        return ResponseEntity.ok(adminService.stats(details));
    }

    @Operation(
            summary = "Excluir ponto crítico pelo painel",
            description = """
                    Apaga um ponto crítico considerado falso/indevido.

                    * `ROOT`: qualquer ponto.
                    * `GESTOR`: somente os da **própria cidade**.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Ponto crítico excluído."),
            @ApiResponse(responseCode = "403", description = "Sem permissão para este ponto.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "Ponto crítico inexistente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @DeleteMapping("/incidents/{id}")
    public ResponseEntity<Void> deleteIncident(
            @Parameter(description = "Identificador do ponto crítico (UUID).")
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails details) {
        adminService.deleteIncident(id, details);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Contar pontos de um usuário",
            description = """
                    Quantos pontos críticos o usuário informado registrou.

                    Usado pelo painel para avisar quantos registros serão afetados
                    ao excluir uma conta. **Exclusivo do ROOT**.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Contagem de pontos do usuário.",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "403", description = "Somente o root pode consultar este dado.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @GetMapping("/users/{id}/incident-count")
    public ResponseEntity<Map<String, Long>> incidentCount(
            @Parameter(description = "Identificador do usuário (UUID).")
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails details) {
        return ResponseEntity.ok(Map.of("count", adminService.countIncidentsByAuthor(id, details)));
    }

    @Operation(
            summary = "Excluir usuário",
            description = """
                    Remove uma conta do sistema. **Exclusivo do ROOT**.

                    O corpo é opcional e decide o destino dos pontos críticos do usuário:

                    * `{"deleteIncidents": true}` — apaga também os pontos (e comentários/upvotes);
                    * `{"deleteIncidents": false}` (padrão) — **mantém** os pontos no mapa e
                      apenas anonimiza a autoria.

                    Não é possível excluir a própria conta nem o último root do sistema.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Opcional: se `deleteIncidents` for true, os pontos do usuário também são apagados.",
                    required = false,
                    content = @Content(schema = @Schema(implementation = DeleteUserRequestDTO.class))))
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Usuário excluído."),
            @ApiResponse(responseCode = "403", description = "Apenas o root exclui usuários; ou é a própria conta; ou é o último root.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "Usuário inexistente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(
            @Parameter(description = "Identificador do usuário alvo (UUID).")
            @PathVariable UUID id,
            @RequestBody(required = false) DeleteUserRequestDTO dto,
            @AuthenticationPrincipal UserDetails details) {
        adminService.deleteUser(id, dto, details);
        return ResponseEntity.noContent().build();
    }
}
