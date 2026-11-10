package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Representação pública de uma denúncia de pessoa desaparecida.
 */
@Schema(description = "Denúncia de pessoa desaparecida/sequestro e seu estado de moderação.")
public class MissingPersonReportDTO {

    private UUID id;
    private String personName;
    private String kind;
    private String title;
    private String description;
    private String lastSeenInfo;
    /** Só é preenchido para moderadores/autores; nunca no endpoint público. */
    private String contact;
    private String city;
    private String photoUrl;
    private String status;
    private String scope;
    private Double lat;
    private Double lng;
    private Double radiusMeters;
    /** Raio final solicitado pelo denunciante (padrão da aprovação). */
    private Double requestedRadiusMeters;
    /** Pré-alerta de 1 km / 10 min ativo antes da moderação. */
    private boolean preAlert;
    private OffsetDateTime preAlertExpiresAt;
    private OffsetDateTime expiresAt;
    private String submittedByName;
    private String approvedByName;
    private OffsetDateTime approvedAt;
    private String rejectionReason;
    private OffsetDateTime createdAt;
    private boolean expired;
    private int commentCount;
    private List<MissingPersonCommentDTO> comments;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getPersonName() { return personName; }
    public void setPersonName(String personName) { this.personName = personName; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLastSeenInfo() { return lastSeenInfo; }
    public void setLastSeenInfo(String lastSeenInfo) { this.lastSeenInfo = lastSeenInfo; }

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public Double getRadiusMeters() { return radiusMeters; }
    public void setRadiusMeters(Double radiusMeters) { this.radiusMeters = radiusMeters; }

    public Double getRequestedRadiusMeters() { return requestedRadiusMeters; }
    public void setRequestedRadiusMeters(Double requestedRadiusMeters) { this.requestedRadiusMeters = requestedRadiusMeters; }

    public boolean isPreAlert() { return preAlert; }
    public void setPreAlert(boolean preAlert) { this.preAlert = preAlert; }

    public OffsetDateTime getPreAlertExpiresAt() { return preAlertExpiresAt; }
    public void setPreAlertExpiresAt(OffsetDateTime preAlertExpiresAt) { this.preAlertExpiresAt = preAlertExpiresAt; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public String getSubmittedByName() { return submittedByName; }
    public void setSubmittedByName(String submittedByName) { this.submittedByName = submittedByName; }

    public String getApprovedByName() { return approvedByName; }
    public void setApprovedByName(String approvedByName) { this.approvedByName = approvedByName; }

    public OffsetDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(OffsetDateTime approvedAt) { this.approvedAt = approvedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isExpired() { return expired; }
    public void setExpired(boolean expired) { this.expired = expired; }

    public int getCommentCount() { return commentCount; }
    public void setCommentCount(int commentCount) { this.commentCount = commentCount; }

    public List<MissingPersonCommentDTO> getComments() { return comments; }
    public void setComments(List<MissingPersonCommentDTO> comments) { this.comments = comments; }
}
