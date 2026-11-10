package com.zelo.backend.controller;

import com.zelo.backend.dto.ErrorResponseDTO;
import com.zelo.backend.dto.WeatherBundleDTO;
import com.zelo.backend.service.WeatherAlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Clima e alertas climáticos.
 *
 * <p>Endpoint **público** (usado pelo banner de alerta e pelo cabeçalho do app).
 */
@Tag(name = "4. Alertas climáticos",
        description = """
                Clima atual real (fonte: Open-Meteo) e alertas ativos próximos.

                A consulta avalia a previsão horária da localização e **gera os alertas
                automaticamente** pelas regras de risco configuradas no backend (chuva
                forte, calor extremo, vento, frio). Endpoint público.
                """)
@RestController
@RequestMapping("/api/public")
public class WeatherAlertController {

    private final WeatherAlertService weatherAlertService;

    public WeatherAlertController(WeatherAlertService weatherAlertService) {
        this.weatherAlertService = weatherAlertService;
    }

    @Operation(
            summary = "Clima atual + alertas ativos",
            description = """
                    Retorna, para a coordenada informada:

                    * `currentWeather` — temperatura (°C), precipitação (mm), código do
                      clima e velocidade do vento (km/h), vindos do Open-Meteo;
                    * `alerts` — alertas ativos próximos, com severidade
                      (`AMARELO`, `LARANJA`, `VERMELHO`), raio de abrangência e validade.

                    Sem coordenada não há alerta: sempre envie `lat` e `lng`.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Clima e alertas da região.",
                    content = @Content(schema = @Schema(implementation = WeatherBundleDTO.class))),
            @ApiResponse(responseCode = "400", description = "Coordenadas ausentes ou inválidas.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @SecurityRequirements // público: o app mostra o clima antes do login
    @GetMapping("/alerts")
    public ResponseEntity<WeatherBundleDTO> alerts(
            @Parameter(description = "Latitude da consulta (WGS84).", example = "-23.5505")
            @RequestParam Double lat,
            @Parameter(description = "Longitude da consulta (WGS84).", example = "-46.6333")
            @RequestParam Double lng) {
        return ResponseEntity.ok(weatherAlertService.getWeatherBundle(lat, lng));
    }
}
