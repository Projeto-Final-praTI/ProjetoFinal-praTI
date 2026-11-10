package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Corpo de POST /api/admin/alerts — alerta oficial disparado por gestor/root.
 *
 * <p>O gestor sempre cria alertas {@code LOCAL} na própria cidade. O root pode
 * escolher {@code GLOBAL} (todo o território) ou {@code LOCAL} em qualquer
 * cidade. A duração é definida em minutos (o alerta some sozinho ao expirar).
 */
@Schema(description = "Dados de um alerta oficial (gestor/root).")
public class CreateAlertRequestDTO {

    @Schema(description = "Título curto exibido no banner.", example = "Interdição da Avenida Central")
    @NotBlank(message = "Título é obrigatório")
    @Size(max = 120, message = "Título deve ter no máximo 120 caracteres")
    private String title;

    @Schema(description = "Mensagem com orientações à população.",
            example = "A Avenida Central está interditada por causa de um alagamento. Evite a região.")
    @Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres")
    private String description;

    @Schema(description = "Severidade visual do alerta.",
            allowableValues = {"AMARELO", "LARANJA", "VERMELHO"}, example = "LARANJA")
    @NotNull(message = "Severidade é obrigatória")
    private String severity;

    @Schema(description = "Abrangência. Gestor só pode LOCAL; root pode GLOBAL ou LOCAL.",
            allowableValues = {"GLOBAL", "LOCAL"}, example = "LOCAL")
    private String scope;

    @Schema(description = "Cidade do alerta local (obrigatória para root; ignorada para gestor, que usa a própria cidade).",
            example = "Rio Branco")
    private String city;

    @Schema(description = "Raio de abrangência em metros para alertas locais. Padrão: 50000 (cidade inteira).",
            example = "50000")
    @Min(value = 1000, message = "Raio mínimo é 1 km")
    @Max(value = 200000, message = "Raio máximo é 200 km")
    private Double radiusMeters;

    @Schema(description = "Duração do alerta em minutos (some automaticamente ao expirar).",
            example = "60")
    @NotNull(message = "Duração é obrigatória")
    @Min(value = 5, message = "Duração mínima é 5 minutos")
    @Max(value = 10080, message = "Duração máxima é 7 dias")
    private Integer durationMinutes;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Double getRadiusMeters() { return radiusMeters; }
    public void setRadiusMeters(Double radiusMeters) { this.radiusMeters = radiusMeters; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
}
