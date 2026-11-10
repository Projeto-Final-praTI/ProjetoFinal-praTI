package com.zelo.backend.controller;

import com.zelo.backend.dto.CreateAlertRequestDTO;
import com.zelo.backend.dto.ErrorResponseDTO;
import com.zelo.backend.dto.WeatherAlertDTO;
import com.zelo.backend.service.WeatherAlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Alertas oficiais disparados por gestor municipal ou root.
 *
 * <p>Protegido no SecurityConfig por {@code /api/admin/**} (ROOT ou GESTOR).
 * O gestor só atua na própria cidade; o root pode criar alertas globais ou
 * locais em qualquer cidade. Os alertas aparecem no banner público junto com
 * os alertas climáticos automáticos e expiram sozinhos.
 */
@Tag(name = "6. Alertas oficiais",
        description = """
                Alertas customizados disparados por gestor/root.

                **Acesso:** `ROOT` ou `GESTOR`. O gestor só cria alertas locais
                na **própria cidade**; o root pode criar alertas **globais** ou
                locais em qualquer cidade. A duração é definida em minutos e o
                alerta desaparece automaticamente ao expirar.
                """)
@RestController
@RequestMapping("/api/admin/alerts")
public class AdminAlertController {

    private final WeatherAlertService weatherAlertService;

    public AdminAlertController(WeatherAlertService weatherAlertService) {
        this.weatherAlertService = weatherAlertService;
    }

    @Operation(
            summary = "Listar alertas oficiais ativos",
            description = """
                    Lista os alertas oficiais ainda ativos.

                    * `ROOT`: todos.
                    * `GESTOR`: os globais (somente leitura) e os locais da própria cidade.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Alertas oficiais ativos.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = WeatherAlertDTO.class)))),
            @ApiResponse(responseCode = "401", description = "Token ausente ou inválido.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "403", description = "Perfil sem acesso ao painel.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @GetMapping
    public ResponseEntity<List<WeatherAlertDTO>> list(@AuthenticationPrincipal UserDetails details) {
        return ResponseEntity.ok(weatherAlertService.listManualAlerts(details));
    }

    @Operation(
            summary = "Disparar alerta oficial",
            description = """
                    Cria um alerta no banner público.

                    * `GESTOR`: força `scope = LOCAL` e usa a cidade do próprio perfil.
                    * `ROOT`: aceita `scope = GLOBAL` (todo o território) ou `LOCAL`
                      com a `city` informada.

                    Em alertas locais, o backend resolve o centro do município e
                    aplica o `radiusMeters` (padrão 50 km, ajustável de 1 a 200 km).
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Alerta criado.",
                    content = @Content(schema = @Schema(implementation = WeatherAlertDTO.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos ou cidade não localizada.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "403", description = "Sem permissão para este escopo.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @PostMapping
    public ResponseEntity<WeatherAlertDTO> create(
            @Valid @RequestBody CreateAlertRequestDTO dto,
            @AuthenticationPrincipal UserDetails details) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(weatherAlertService.createManualAlert(dto, details));
    }

    @Operation(
            summary = "Remover alerta oficial",
            description = """
                    Remove um alerta oficial antes do prazo.

                    * `ROOT`: qualquer alerta oficial.
                    * `GESTOR`: apenas alertas locais da própria cidade.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Alerta removido."),
            @ApiResponse(responseCode = "403", description = "Sem permissão para este alerta.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "Alerta inexistente.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Identificador do alerta (UUID).")
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails details) {
        weatherAlertService.deleteManualAlert(id, details);
        return ResponseEntity.noContent().build();
    }
}
