package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Dados de criação de um ponto crítico (parte {@code data} do multipart).
 */
@Schema(description = "Dados do ponto crítico na parte `data` do registro (multipart/form-data).")
public class IncidentRequestDTO {

    @Schema(description = "Título curto do problema.", example = "Buraco na avenida")
    @NotBlank(message = "Título é obrigatório")
    private String title;

    @Schema(description = "Descrição do problema.", example = "Buraco de cerca de 40 cm no meio da pista.")
    @NotBlank(message = "Descrição é obrigatória")
    private String description;

    @Schema(description = "Categoria do problema.",
            allowableValues = {"BURACO", "PONTE_QUEBRADA", "ALAGAMENTO", "QUEDA_ARVORE", "DESLIZAMENTO", "OUTROS"},
            example = "BURACO")
    @NotNull(message = "Categoria é obrigatória")
    private String category;

    @Schema(description = "Latitude do local do problema (WGS84).", example = "-23.5505")
    @NotNull(message = "Latitude do incidente é obrigatória")
    private Double incidentLat;

    @Schema(description = "Longitude do local do problema (WGS84).", example = "-46.6333")
    @NotNull(message = "Longitude do incidente é obrigatória")
    private Double incidentLng;

    @Schema(description = "Latitude de quem está registrando (WGS84). Usada no geofence de 500 m.",
            example = "-23.5506")
    @NotNull(message = "Latitude do usuário é obrigatória")
    private Double userLat;

    @Schema(description = "Longitude de quem está registrando (WGS84). Usada no geofence de 500 m.",
            example = "-46.6334")
    @NotNull(message = "Longitude do usuário é obrigatória")
    private Double userLng;

    /**
     * Cidade/município do ponto crítico (opcional). Desvinculada do perfil do
     * autor — quando ausente, é resolvida automaticamente pela coordenada
     * (geocodificação reversa) e usada só para o filtro de gestão por cidade
     * (GESTOR/FISCAL). A validação geográfica é exclusivamente o geofence de
     * 500m (userLat/Lng vs incidentLat/Lng).
     */
    @Schema(description = "Cidade do ponto crítico (opcional). Se omitida, o backend resolve pela coordenada.",
            example = "São Paulo")
    private String city;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Double getIncidentLat() { return incidentLat; }
    public void setIncidentLat(Double incidentLat) { this.incidentLat = incidentLat; }

    public Double getIncidentLng() { return incidentLng; }
    public void setIncidentLng(Double incidentLng) { this.incidentLng = incidentLng; }

    public Double getUserLat() { return userLat; }
    public void setUserLat(Double userLat) { this.userLat = userLat; }

    public Double getUserLng() { return userLng; }
    public void setUserLng(Double userLng) { this.userLng = userLng; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
}
