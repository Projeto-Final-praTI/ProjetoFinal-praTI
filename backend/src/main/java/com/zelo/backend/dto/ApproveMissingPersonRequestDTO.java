package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Corpo da aprovação de uma denúncia de pessoa desaparecida.
 *
 * <p>Fiscal/gestor: sempre local na própria cidade. Root: pode escolher
 * {@code GLOBAL} (todo o território) ou {@code LOCAL} na cidade da denúncia.
 */
@Schema(description = "Parâmetros para aprovar e disparar uma denúncia.")
public class ApproveMissingPersonRequestDTO {

    @Schema(description = "Abrangência (root). Fiscal/gestor sempre LOCAL.",
            allowableValues = {"GLOBAL", "LOCAL"}, example = "LOCAL")
    private String scope;

    @Schema(description = "Cidade do alerta local (root). Padrão: cidade da denúncia.",
            example = "Rio Branco")
    private String city;

    @Schema(description = "Raio de abrangência em metros para alertas locais. Padrão: 50000.",
            example = "50000")
    @Min(value = 1000, message = "Raio mínimo é 1 km")
    @Max(value = 200000, message = "Raio máximo é 200 km")
    private Double radiusMeters;

    @Schema(description = "Duração do alerta em minutos.", example = "1440")
    @NotNull(message = "Duração é obrigatória")
    @Min(value = 5, message = "Duração mínima é 5 minutos")
    @Max(value = 10080, message = "Duração máxima é 7 dias")
    private Integer durationMinutes;

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Double getRadiusMeters() { return radiusMeters; }
    public void setRadiusMeters(Double radiusMeters) { this.radiusMeters = radiusMeters; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
}
