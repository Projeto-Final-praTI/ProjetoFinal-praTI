package com.zelo.backend.controller;

import com.zelo.backend.dto.ErrorResponseDTO;
import com.zelo.backend.dto.MissingPersonCommentDTO;
import com.zelo.backend.dto.MissingPersonCommentRequestDTO;
import com.zelo.backend.dto.MissingPersonReportDTO;
import com.zelo.backend.dto.MissingPersonReportRequestDTO;
import com.zelo.backend.service.MissingPersonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Denúncias de pessoa desaparecida/sequestro.
 *
 * <p>Consultas em {@code /api/public/missing-alerts} são públicas (qualquer
 * visitante vê os alertas aprovados da região). O envio da denúncia e os
 * comentários exigem login. A moderação fica em {@link MissingPersonModerationController}.
 */
@Tag(name = "7. Pessoa desaparecida",
        description = """
                Denúncias de pessoa desaparecida/sequestro enviadas pela população.

                O cidadão envia **foto obrigatória** + dados. A denúncia fica
                **pendente** até um fiscal, gestor ou root aprovar. Só as aprovadas
                e não expiradas aparecem no endpoint público e no modal em destaque.
                A população pode comentar avistamentos nas denúncias aprovadas.
                """)
@RestController
@RequestMapping("/api")
public class MissingPersonController {

    private final MissingPersonService missingPersonService;

    public MissingPersonController(MissingPersonService missingPersonService) {
        this.missingPersonService = missingPersonService;
    }

    @Operation(
            summary = "Enviar denúncia de pessoa desaparecida",
            description = """
                    Cria uma denúncia **pendente** de moderação.

                    A requisição é `multipart/form-data` com duas partes:

                    | parte | tipo | conteúdo |
                    |---|---|---|
                    | `data` | `application/json` | dados da pessoa/ocorrência |
                    | `photo` | arquivo | foto da pessoa (**obrigatória**) |

                    Quando `data.lat`/`data.lng` são informados (localização do
                    denunciante), o envio **já dispara um pré-alerta de 10
                    minutos num raio de 1 km**, antes da moderação. Depois da
                    aprovação a equipe de moderação define o alcance final
                    (raio padrão de 50 km, ajustável de 1 a 200 km).
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Parte `data` em JSON + parte `photo` com a foto da pessoa.",
                    required = true,
                    content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE)))
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Denúncia enviada para moderação.",
                    content = @Content(schema = @Schema(implementation = MissingPersonReportDTO.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos ou foto ausente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "Token ausente ou inválido.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @PostMapping(value = "/missing-alerts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MissingPersonReportDTO> submit(
            @RequestPart("data") @Valid MissingPersonReportRequestDTO data,
            @RequestPart("photo") MultipartFile photo,
            @AuthenticationPrincipal UserDetails details) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(missingPersonService.submit(data, photo, details));
    }

    @Operation(
            summary = "Comentar/avistamento em denúncia visível",
            description = """
                    Registra um comentário/avistamento da população (ex.: "vi a
                    pessoa perto da rodoviária"), com **imagem opcional**.

                    A requisição é `multipart/form-data`:

                    | parte | tipo | conteúdo |
                    |---|---|---|
                    | `data` | `application/json` | `{"content": "..."}` (pode ser vazio se houver imagem) |
                    | `image` | arquivo | imagem opcional (JPG/PNG) |

                    Funciona em denúncias aprovadas e nas que estão em
                    **pré-alerta** (1 km / 10 min). Comentários do denunciante
                    original voltam com `reporter: true`.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Parte `data` em JSON + parte `image` opcional.",
                    required = true,
                    content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE)))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Comentário registrado.",
                    content = @Content(schema = @Schema(implementation = MissingPersonCommentDTO.class))),
            @ApiResponse(responseCode = "400", description = "Sem texto nem imagem, ou imagem inválida.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "403", description = "Denúncia não está ativa.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "Denúncia inexistente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @PostMapping(value = "/missing-alerts/{id}/comments",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MissingPersonCommentDTO> comment(
            @Parameter(description = "Identificador da denúncia (UUID).")
            @PathVariable UUID id,
            @RequestPart("data") @Valid MissingPersonCommentRequestDTO dto,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserDetails details) throws Exception {
        return ResponseEntity.ok(
                missingPersonService.addComment(id, dto.getContent(), image, details));
    }

    @Operation(
            summary = "Listar alertas de pessoa desaparecida ativos",
            description = """
                    Denúncias **aprovadas** e ainda válidas próximas da coordenada,
                    incluindo as globais disparadas pelo root, mais os
                    **pré-alertas** (PENDENTE, 1 km / 10 min) do entorno. Endpoint
                    público; pré-alertas vêm primeiro e com `preAlert: true`.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Alertas ativos da região.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = MissingPersonReportDTO.class)))),
            @ApiResponse(responseCode = "400", description = "Coordenadas inválidas.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @SecurityRequirements
    @GetMapping("/public/missing-alerts")
    public ResponseEntity<List<MissingPersonReportDTO>> active(
            @Parameter(description = "Latitude da consulta (WGS84).", example = "-9.97499")
            @RequestParam Double lat,
            @Parameter(description = "Longitude da consulta (WGS84).", example = "-67.8243")
            @RequestParam Double lng) {
        return ResponseEntity.ok(missingPersonService.findActiveNearby(lat, lng));
    }

    @Operation(
            summary = "Detalhe público de um alerta de pessoa desaparecida",
            description = "Retorna a denúncia aprovada com a foto e os comentários/avistamentos.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detalhe da denúncia.",
                    content = @Content(schema = @Schema(implementation = MissingPersonReportDTO.class))),
            @ApiResponse(responseCode = "404", description = "Denúncia inexistente, pendente ou expirada.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @SecurityRequirements
    @GetMapping("/public/missing-alerts/{id}")
    public ResponseEntity<MissingPersonReportDTO> detail(
            @Parameter(description = "Identificador da denúncia (UUID).")
            @PathVariable UUID id) {
        return ResponseEntity.ok(missingPersonService.getPublic(id));
    }
}
