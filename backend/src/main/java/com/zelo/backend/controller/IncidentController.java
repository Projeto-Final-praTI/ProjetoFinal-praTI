package com.zelo.backend.controller;

import com.zelo.backend.dto.CommentRequestDTO;
import com.zelo.backend.dto.ErrorResponseDTO;
import com.zelo.backend.dto.IncidentCommentDTO;
import com.zelo.backend.dto.IncidentRequestDTO;
import com.zelo.backend.dto.IncidentResponseDTO;
import com.zelo.backend.dto.IncidentStatusHistoryDTO;
import com.zelo.backend.dto.StatusUpdateRequestDTO;
import com.zelo.backend.service.IncidentService;
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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Pontos críticos (ocorrências de infraestrutura urbana).
 *
 * <p>As rotas sob {@code /api/public/**} são abertas (consulta do mapa sem
 * login). As demais exigem token JWT.
 */
@Tag(name = "3. Pontos críticos",
        description = """
                Registro, consulta, comentário, confirmação (*upvote*), mudança de status
                e exclusão de pontos críticos.

                As consultas do mapa (`/api/public/incidents...`) são públicas; as demais
                exigem token. A alteração de status e a exclusão são restritas por papel
                (ver RBAC na descrição da API).
                """)
@RestController
@RequestMapping("/api")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @Operation(
            summary = "Registrar ponto crítico",
            description = """
                    Cria um ponto crítico a partir de **um ou mais tipos de ocorrência**.

                    A requisição é `multipart/form-data` com duas partes:

                    | parte | tipo | conteúdo |
                    |---|---|---|
                    | `data` | `application/json` | os campos do incidente (veja o modelo) |
                    | `images` | arquivo(s) | evidência fotográfica (obrigatória, no mínimo 1) |

                    **Geofence de 500 m:** o autor precisa estar a no máximo 500 m do
                    local informado em `incidentLat`/`incidentLng`. Se estiver mais longe,
                    a API responde `422` com a distância calculada.

                    A `city` é opcional — quando ausente, o backend tenta resolver a
                    município pela coordenada (geocodificação reversa); se a fonte falhar,
                    o ponto é gravado sem cidade (o registro nunca é bloqueado por isso).
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Parte `data` em JSON + parte `images` com o(s) arquivo(s) de evidência.",
                    required = true,
                    content = {
                            @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                                    schema = @Schema(implementation = IncidentMultipartSchema.class))
                    }))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ponto crítico registrado.",
                    content = @Content(schema = @Schema(implementation = IncidentResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Campos inválidos ou nenhuma imagem enviada.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "Token ausente ou inválido.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "422", description = "Autor a mais de 500 m do local informado.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @PostMapping(value = "/incidents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<IncidentResponseDTO> create(
            @RequestPart("data") IncidentRequestDTO data,
            @RequestPart("images") List<MultipartFile> images,
            @org.springframework.security.core.annotation.AuthenticationPrincipal UserDetails userDetails) throws Exception {
        return ResponseEntity.ok(incidentService.createIncident(data, images, userDetails));
    }

    @Operation(
            summary = "Listar pontos críticos próximos",
            description = """
                    Retorna os pontos dentro de um raio (em metros) ao redor da
                    coordenada informada. É a chamada usada pelo mapa na tela inicial.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de pontos próximos.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = IncidentResponseDTO.class)))),
            @ApiResponse(responseCode = "400", description = "Coordenadas inválidas.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @SecurityRequirements // público: o mapa abre sem login
    @GetMapping("/public/incidents")
    public ResponseEntity<List<IncidentResponseDTO>> findNearby(
            @Parameter(description = "Latitude do centro da busca (WGS84).", example = "-23.5505")
            @RequestParam Double lat,
            @Parameter(description = "Longitude do centro da busca (WGS84).", example = "-46.6333")
            @RequestParam Double lng,
            @Parameter(description = "Raio de busca em metros.", example = "10000")
            @RequestParam(defaultValue = "10000") Double radiusMeters) {
        return ResponseEntity.ok(incidentService.findNearby(lat, lng, radiusMeters));
    }

    @Operation(
            summary = "Detalhe de um ponto crítico",
            description = "Retorna o ponto crítico completo: autor, imagens, comentários e linha do tempo de status.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ponto crítico encontrado.",
                    content = @Content(schema = @Schema(implementation = IncidentResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "Ponto crítico inexistente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @SecurityRequirements // público: o mapa abre sem login
    @GetMapping("/public/incidents/{id}")
    public ResponseEntity<IncidentResponseDTO> getById(
            @Parameter(description = "Identificador do ponto crítico (UUID).")
            @PathVariable UUID id) {
        return ResponseEntity.ok(incidentService.getById(id));
    }

    @Operation(
            summary = "Comentar em um ponto crítico",
            description = "Adiciona um comentário do usuário logado. O retorno é o comentário criado (com autor e data).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Comentário registrado.",
                    content = @Content(schema = @Schema(implementation = IncidentCommentDTO.class))),
            @ApiResponse(responseCode = "400", description = "Comentário vazio ou com mais de 1000 caracteres.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "Token ausente ou inválido.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "Ponto crítico inexistente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @PostMapping("/incidents/{id}/comments")
    public ResponseEntity<IncidentCommentDTO> addComment(
            @Parameter(description = "Identificador do ponto crítico (UUID).")
            @PathVariable UUID id,
            @Valid @RequestBody CommentRequestDTO dto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(incidentService.addComment(id, dto.getContent(), userDetails));
    }

    @Operation(
            summary = "Confirmar (upvote)",
            description = """
                    Marca que o usuário também observou o problema — é o que alimenta o
                    contador de confirmações no mapa.

                    Idempotente: confirmar duas vezes não soma em dobro.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Confirmação registrada. Retorna o ponto atualizado.",
                    content = @Content(schema = @Schema(implementation = IncidentResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "Token ausente ou inválido.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "Ponto crítico inexistente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @PostMapping("/incidents/{id}/upvote")
    public ResponseEntity<IncidentResponseDTO> upvote(
            @Parameter(description = "Identificador do ponto crítico (UUID).")
            @PathVariable UUID id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(incidentService.upvote(id, userDetails));
    }

    @Operation(
            summary = "Alterar status / registrar nota",
            description = """
                    Move o ponto crítico na linha do tempo e (opcionalmente) registra uma
                    nota operacional.

                    Status possíveis: `ABERTO`, `EM_ATENDIMENTO`, `RESOLVIDO`.

                    **RBAC:** `ROOT` em qualquer cidade; `GESTOR`/`FISCAL` somente nos pontos
                    da **própria cidade** (o `user.city` precisa estar preenchido).
                    O autor do ponto também pode alterar o próprio registro.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Novo status e nota (opcional).",
                    required = true,
                    content = @Content(schema = @Schema(implementation = StatusUpdateRequestDTO.class))))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status alterado. Retorna o ponto com a linha do tempo atualizada.",
                    content = @Content(schema = @Schema(implementation = IncidentResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Nenhuma alteração informada (status igual ao atual e sem nota).",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "Token ausente ou inválido.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "403", description = "Papel insuficiente (só fiscais/gestores/root alteram status).",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "Ponto crítico inexistente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @PutMapping("/incidents/{id}/status")
    public ResponseEntity<IncidentResponseDTO> updateStatus(
            @Parameter(description = "Identificador do ponto crítico (UUID).")
            @PathVariable UUID id,
            @Valid @RequestBody StatusUpdateRequestDTO dto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(incidentService.updateStatus(id, dto, userDetails));
    }

    @Operation(
            summary = "Linha do tempo de status",
            description = "Histórico de mudanças de status e notas do ponto crítico (mais recente primeiro). Público.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Histórico de status.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = IncidentStatusHistoryDTO.class)))),
            @ApiResponse(responseCode = "404", description = "Ponto crítico inexistente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @SecurityRequirements // público: mesma leitura do detalhe
    @GetMapping("/public/incidents/{id}/history")
    public ResponseEntity<List<IncidentStatusHistoryDTO>> history(
            @Parameter(description = "Identificador do ponto crítico (UUID).")
            @PathVariable UUID id) {
        return ResponseEntity.ok(incidentService.getHistory(id));
    }

    @Operation(
            summary = "Excluir ponto crítico",
            description = """
                    Apaga um ponto crítico e seus comentários/confirmações.

                    **RBAC:** o autor do ponto, o `ROOT` (qualquer ponto) ou o
                    `GESTOR`/`FISCAL` da mesma cidade.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Ponto crítico excluído."),
            @ApiResponse(responseCode = "401", description = "Token ausente ou inválido.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "403", description = "Sem permissão para excluir este ponto.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "Ponto crítico inexistente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @DeleteMapping("/incidents/{id}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Identificador do ponto crítico (UUID).")
            @PathVariable UUID id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal UserDetails userDetails) {
        incidentService.deleteIncident(id, userDetails);
        return ResponseEntity.noContent().build();
    }

    /**
     * Modelo auxiliar (só documentação): descreve as partes do multipart.
     * Não é usado em tempo de execução.
     */
    @Schema(description = "Partes do formulário multipart do registro de ponto crítico.")
    static class IncidentMultipartSchema {
        @Schema(description = "Parte `data`: JSON com os dados do incidente.")
        public IncidentRequestDTO data;

        @Schema(description = "Parte `images`: um ou mais arquivos de evidência (até 10 MB cada).")
        public List<MultipartFile> images;
    }
}
