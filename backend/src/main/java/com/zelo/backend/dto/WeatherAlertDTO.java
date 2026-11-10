package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Representação de um alerta climático automático ou de um alerta oficial.
 */
@Schema(description = "Alerta climático ativo na região consultada.")
public class WeatherAlertDTO {

    @Schema(description = "Identificador do alerta (UUID).")
    private UUID id;

    @Schema(description = "Título do alerta.", example = "Chuva forte na região")
    private String title;

    @Schema(description = "Descrição do alerta.", example = "Precipitação intensa em até 1 hora.")
    private String description;

    @Schema(description = "Severidade do alerta.",
            allowableValues = {"AMARELO", "LARANJA", "VERMELHO"}, example = "LARANJA")
    private String severity;

    @Schema(description = "Origem do alerta.", example = "MOTOR_REGRAS")
    private String source;

    @Schema(description = "Abrangência de alertas oficiais.",
            allowableValues = {"GLOBAL", "LOCAL"}, example = "LOCAL")
    private String scope;

    @Schema(description = "Cidade do alerta local oficial.", example = "Rio Branco")
    private String city;

    @Schema(description = "Nome de quem disparou o alerta oficial.", example = "Maria Silva")
    private String createdByName;

    @Schema(description = "Verdadeiro quando o alerta foi disparado por gestor/root.",
            example = "true")
    private boolean custom;

    @Schema(description = "Latitude do centro do alerta.", example = "-23.5505")
    private Double lat;

    @Schema(description = "Longitude do centro do alerta.", example = "-46.6333")
    private Double lng;

    @Schema(description = "Raio de abrangência do alerta, em metros.", example = "15000")
    private Double radiusMeters;

    @Schema(description = "Validade do alerta (ISO-8601 com deslocamento).", example = "2026-10-21T18:00:00-03:00")
    private OffsetDateTime expiresAt;

    @Schema(description = "Data de criação do alerta.", example = "2026-10-21T12:00:00-03:00")
    private OffsetDateTime createdAt;

    public WeatherAlertDTO() {
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public boolean isCustom() { return custom; }
    public void setCustom(boolean custom) { this.custom = custom; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public Double getRadiusMeters() { return radiusMeters; }
    public void setRadiusMeters(Double radiusMeters) { this.radiusMeters = radiusMeters; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
