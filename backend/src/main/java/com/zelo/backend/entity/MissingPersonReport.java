package com.zelo.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Denúncia de pessoa desaparecida/sequestro enviada por um cidadão.
 *
 * <p>A denúncia nasce {@link MissingPersonStatus#PENDENTE} e, quando o
 * denunciante informa a própria localização, dispara imediatamente um
 * <b>pré-alerta</b> de 10 minutos num raio de 1 km ({@link #preAlertExpiresAt}).
 * Depois que um fiscal, gestor ou root aprova, o alerta é ampliado para a
 * abrangência/raio escolhidos. Na aprovação também são definidos o centro
 * (preferindo a localização do denunciante), a validade e o autor.
 */
@Entity
@Table(name = "missing_person_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MissingPersonReport {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "person_name", nullable = false)
    private String personName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MissingPersonKind kind;

    @Column(columnDefinition = "text", nullable = false)
    private String description;

    /** Onde/desde quando a pessoa foi vista pela última vez. */
    @Column(name = "last_seen_info", columnDefinition = "text")
    private String lastSeenInfo;

    /** Contato do denunciante (não é exposto publicamente). */
    @Column(name = "contact")
    private String contact;

    @Column(nullable = false)
    private String city;

    @Column(name = "photo_url", nullable = false)
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MissingPersonStatus status;

    /** Preenchido na aprovação: GLOBAL (root) ou LOCAL (região). */
    @Enumerated(EnumType.STRING)
    @Column(name = "scope")
    private AlertScope scope;

    @Column(name = "center_location", columnDefinition = "geometry(Point, 4326)")
    private Point centerLocation;

    @Column(name = "radius_meters")
    private Double radiusMeters;

    /** Raio final pedido pelo denunciante; vira o padrão da aprovação. */
    @Column(name = "requested_radius_meters")
    private Double requestedRadiusMeters;

    /**
     * Fim do pré-alerta de 1 km disparado no envio (10 minutos), antes da
     * moderação. Nulo quando o denunciante não informou a localização.
     */
    @Column(name = "pre_alert_expires_at")
    private OffsetDateTime preAlertExpiresAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    /** Autor da denúncia (UUID sem FK para não travar a exclusão de usuários). */
    @Column(name = "submitted_by_id")
    private UUID submittedById;

    @Column(name = "submitted_by_name")
    private String submittedByName;

    @Column(name = "approved_by_name")
    private String approvedByName;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MissingPersonComment> comments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (status == null) status = MissingPersonStatus.PENDENTE;
    }
}
