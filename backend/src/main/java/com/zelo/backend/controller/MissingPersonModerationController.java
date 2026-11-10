package com.zelo.backend.controller;

import com.zelo.backend.dto.ApproveMissingPersonRequestDTO;
import com.zelo.backend.dto.ErrorResponseDTO;
import com.zelo.backend.dto.MissingPersonReportDTO;
import com.zelo.backend.dto.RejectMissingPersonRequestDTO;
import com.zelo.backend.service.MissingPersonService;
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
import java.util.UUID;

/**
 * Moderação de denúncias de pessoa desaparecida.
 *
 * <p>Protegido no SecurityConfig: {@code /api/moderation/**} exige
 * FISCAL, GESTOR ou ROOT. Fiscal/gestor só atuam na própria cidade; root
 * pode aprovar como local (qualquer cidade) ou global.
 */
@Tag(name = "8. Moderação de desaparecidos",
        description = """
                Aprovação/recusa de denúncias de pessoa desaparecida.

                **Acesso:** `FISCAL`, `GESTOR` ou `ROOT`. Fiscal/gestor só
                moderam denúncias da **própria cidade**; o root pode aprovar
                como **local** em qualquer cidade ou como **global**.
                """)
@RestController
@RequestMapping("/api/moderation/missing-alerts")
public class MissingPersonModerationController {

    private final MissingPersonService missingPersonService;

    public MissingPersonModerationController(MissingPersonService missingPersonService) {
        this.missingPersonService = missingPersonService;
    }

    @Operation(
            summary = "Listar denúncias para moderação",
            description = """
                    * `ROOT`: todas as denúncias (pendentes, aprovadas e recusadas).
                    * `FISCAL`/`GESTOR`: apenas as da própria cidade.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Denúncias no escopo do moderador.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = MissingPersonReportDTO.class)))),
            @ApiResponse(responseCode = "403", description = "Perfil sem permissão de moderação.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @GetMapping
    public ResponseEntity<List<MissingPersonReportDTO>> list(
            @AuthenticationPrincipal UserDetails details) {
        return ResponseEntity.ok(missingPersonService.listForModeration(details));
    }

    @Operation(
            summary = "Aprovar e disparar denúncia",
            description = """
                    Aprova uma denúncia pendente e a publica no modal em destaque.

                    * `FISCAL`/`GESTOR`: sempre `LOCAL` na própria cidade.
                    * `ROOT`: `GLOBAL` (todo o território) ou `LOCAL` na cidade da denúncia.

                    Em alertas locais o centro do município é resolvido pelo backend
                    e o raio padrão é 50 km (ajustável de 1 a 200 km).
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Denúncia aprovada e publicada.",
                    content = @Content(schema = @Schema(implementation = MissingPersonReportDTO.class))),
            @ApiResponse(responseCode = "400", description = "Denúncia não está pendente ou dados inválidos.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "403", description = "Denúncia de outra cidade ou perfil sem permissão.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "Denúncia inexistente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @PostMapping("/{id}/approve")
    public ResponseEntity<MissingPersonReportDTO> approve(
            @Parameter(description = "Identificador da denúncia (UUID).")
            @PathVariable UUID id,
            @Valid @RequestBody ApproveMissingPersonRequestDTO dto,
            @AuthenticationPrincipal UserDetails details) {
        return ResponseEntity.ok(missingPersonService.approve(id, dto, details));
    }

    @Operation(summary = "Recusar denúncia",
            description = "Recusa uma denúncia pendente. O motivo é opcional.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Denúncia recusada.",
                    content = @Content(schema = @Schema(implementation = MissingPersonReportDTO.class))),
            @ApiResponse(responseCode = "403", description = "Denúncia de outra cidade ou perfil sem permissão.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "Denúncia inexistente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @PostMapping("/{id}/reject")
    public ResponseEntity<MissingPersonReportDTO> reject(
            @Parameter(description = "Identificador da denúncia (UUID).")
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) RejectMissingPersonRequestDTO dto,
            @AuthenticationPrincipal UserDetails details) {
        return ResponseEntity.ok(missingPersonService.reject(id, dto, details));
    }

    @Operation(summary = "Excluir denúncia",
            description = "Remove definitivamente a denúncia (root: qualquer; fiscal/gestor: própria cidade).")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Denúncia excluída."),
            @ApiResponse(responseCode = "403", description = "Sem permissão para esta denúncia.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "Denúncia inexistente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Identificador da denúncia (UUID).")
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails details) {
        missingPersonService.delete(id, details);
        return ResponseEntity.noContent().build();
    }
}
