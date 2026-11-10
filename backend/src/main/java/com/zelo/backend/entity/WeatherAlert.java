package com.zelo.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Alerta climático automático ou alerta oficial criado pela gestão.
 */
@Entity
@Table(name = "weather_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeatherAlert {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertSeverity severity;

    @Column(name = "source")
    private String source;

    /**
     * Abrangência de alertas oficiais (gestor/root). Nulo nos alertas
     * automáticos do motor climático, que continuam locais por coordenada.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "scope")
    private AlertScope scope;

    /** Cidade do alerta local oficial (nula em alertas globais e automáticos). */
    @Column(name = "city")
    private String city;

    /** Nome de quem disparou o alerta oficial (nulo nos alertas automáticos). */
    @Column(name = "created_by_name")
    private String createdByName;

    @Column(name = "center_location", columnDefinition = "geometry(Point, 4326)")
    private Point centerLocation;

    @Column(name = "radius_meters")
    private Double radiusMeters;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    /**
     * Impressão digital do alerta gerado automaticamente (regra|lat|lng),
     * usada para não duplicar o mesmo alerta a cada consulta.
     */
    @Column(name = "fingerprint")
    private String fingerprint;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
