package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * Resposta única do endpoint /api/public/alerts:
 * clima atual (real, Open-Meteo) + alertas ativos próximos
 * (gerados automaticamente pelo motor de regras ZELO).
 */
@Schema(description = "Pacote com o clima atual e os alertas ativos da região.")
public class WeatherBundleDTO {

    @Schema(description = "Alertas ativos próximos da coordenada consultada.")
    private List<WeatherAlertDTO> alerts;

    @Schema(description = "Condições climáticas atuais na coordenada consultada.")
    private CurrentWeatherDTO currentWeather;

    public WeatherBundleDTO(List<WeatherAlertDTO> alerts, CurrentWeatherDTO currentWeather) {
        this.alerts = alerts;
        this.currentWeather = currentWeather;
    }

    public List<WeatherAlertDTO> getAlerts() {
        return alerts;
    }

    public CurrentWeatherDTO getCurrentWeather() {
        return currentWeather;
    }
}
