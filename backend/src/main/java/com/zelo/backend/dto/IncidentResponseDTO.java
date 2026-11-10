package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Representação de um ponto crítico retornada pela API.
 */
@Schema(description = "Ponto crítico completo, como devolvido pelo mapa e pelo painel.")
public class IncidentResponseDTO {

    @Schema(description = "Identificador do ponto crítico (UUID).", example = "9f1c1f5e-6a1a-4a4a-9b9b-1c1d2e3f4a5b")
    private UUID id;

    @Schema(description = "Título do problema.", example = "Buraco na avenida")
    private String title;

    @Schema(description = "Descrição do problema.", example = "Buraco de cerca de 40 cm no meio da pista.")
    private String description;

    @Schema(description = "Categoria do problema.",
            allowableValues = {"BURACO", "PONTE_QUEBRADA", "ALAGAMENTO", "QUEDA_ARVORE", "DESLIZAMENTO", "OUTROS"},
            example = "BURACO")
    private String category;

    @Schema(description = "Status operacional atual.",
            allowableValues = {"ABERTO", "EM_ATENDIMENTO", "RESOLVIDO"}, example = "ABERTO")
    private String status;

    @Schema(description = "Latitude do ponto crítico.", example = "-23.5505")
    private Double lat;

    @Schema(description = "Longitude do ponto crítico.", example = "-46.6333")
    private Double lng;

    @Schema(description = "Quem registrou o ponto (pode ser a conta técnica de sistema, se o autor foi excluído).")
    private UserDTO author;

    @Schema(description = "Quantas pessoas confirmaram o problema (*upvotes*).", example = "12")
    private Integer upvotesCount;

    @Schema(description = "Data de criação do registro.", example = "2026-10-21T12:00:00-03:00")
    private OffsetDateTime createdAt;

    @Schema(description = "Cidade do ponto crítico (`null` quando não resolvida).", example = "São Paulo")
    private String city;

    @Schema(description = "URLs relativas das imagens de evidência.", example = "/uploads/incidents/abc123.jpg")
    private List<String> images;

    @Schema(description = "Comentários do ponto crítico.")
    private List<IncidentCommentDTO> comments;

    /** Linha do tempo de status/notas (mais recente primeiro). */
    @Schema(description = "Linha do tempo de status e notas (mais recente primeiro).")
    private List<IncidentStatusHistoryDTO> statusHistory;

    public IncidentResponseDTO() {
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public UserDTO getAuthor() { return author; }
    public void setAuthor(UserDTO author) { this.author = author; }

    public Integer getUpvotesCount() { return upvotesCount; }
    public void setUpvotesCount(Integer upvotesCount) { this.upvotesCount = upvotesCount; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }

    public List<IncidentCommentDTO> getComments() { return comments; }
    public void setComments(List<IncidentCommentDTO> comments) { this.comments = comments; }

    public List<IncidentStatusHistoryDTO> getStatusHistory() { return statusHistory; }
    public void setStatusHistory(List<IncidentStatusHistoryDTO> statusHistory) { this.statusHistory = statusHistory; }
}
