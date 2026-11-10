package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Condições meteorológicas atuais exibidas no cabeçalho do aplicativo.
 */
@Schema(description = "Condições climáticas atuais (fonte: Open-Meteo).")
public class CurrentWeatherDTO {

    @Schema(description = "Temperatura atual em graus Celsius.", example = "21.4")
    private Double temperature;

    @Schema(description = "Precipitação em milímetros.", example = "3.2")
    private Double precipitation;

    @Schema(description = "Código do tempo segundo a tabela de códigos do Open-Meteo.", example = "61")
    private Integer weatherCode;

    @Schema(description = "Velocidade do vento em km/h.", example = "12.7")
    private Double windSpeed;

    public CurrentWeatherDTO() {
    }

    public CurrentWeatherDTO(Double temperature, Double precipitation, Integer weatherCode, Double windSpeed) {
        this.temperature = temperature;
        this.precipitation = precipitation;
        this.weatherCode = weatherCode;
        this.windSpeed = windSpeed;
    }

    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }

    public Double getPrecipitation() { return precipitation; }
    public void setPrecipitation(Double precipitation) { this.precipitation = precipitation; }

    public Integer getWeatherCode() { return weatherCode; }
    public void setWeatherCode(Integer weatherCode) { this.weatherCode = weatherCode; }

    public Double getWindSpeed() { return windSpeed; }
    public void setWindSpeed(Double windSpeed) { this.windSpeed = windSpeed; }
}
