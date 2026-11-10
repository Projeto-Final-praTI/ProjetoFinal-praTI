package com.zelo.backend.repository;

import com.zelo.backend.entity.WeatherAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Acesso aos alertas climáticos e oficiais.
 */
@Repository
public interface WeatherAlertRepository extends JpaRepository<WeatherAlert, UUID> {

    /**
     * Busca alertas climáticos ativos (expires_at > NOW()) onde a localização do
     * usuário esteja dentro do radiusMeters do alerta, utilizando PostGIS nativo
     * com ST_DWithin sobre geography (SRID 4326).
     */
    @Query(
            nativeQuery = true,
            value = """
                    SELECT wa.*
                    FROM weather_alerts wa
                    WHERE wa.expires_at > NOW()
                      AND (
                          wa.scope = 'GLOBAL'
                          OR ST_DWithin(
                                  wa.center_location::geography,
                                  ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                                  wa.radius_meters
                              )
                      )
                    ORDER BY
                          CASE WHEN wa.scope IS NOT NULL THEN 1 ELSE 0 END DESC,
                          CASE wa.severity
                              WHEN 'VERMELHO' THEN 3
                              WHEN 'LARANJA' THEN 2
                              WHEN 'AMARELO' THEN 1
                              ELSE 0
                          END DESC,
                          wa.created_at DESC
                    """
    )
    List<WeatherAlert> findActiveNearby(
            @Param("lat") Double lat,
            @Param("lng") Double lng);

    /** Deduplicação de alertas gerados pelo motor automático. */
    java.util.Optional<WeatherAlert> findFirstByFingerprintAndExpiresAtAfter(
            String fingerprint, OffsetDateTime now);

    /** Alertas oficiais ativos (root vê todos). */
    @Query(
            nativeQuery = true,
            value = """
                    SELECT wa.*
                    FROM weather_alerts wa
                    WHERE wa.scope IS NOT NULL
                      AND wa.expires_at > NOW()
                    ORDER BY wa.created_at DESC
                    """
    )
    List<WeatherAlert> findManualActive();

    /**
     * Alertas oficiais ativos visíveis para um gestor: os globais (somente
     * leitura) + os locais da própria cidade.
     */
    @Query(
            nativeQuery = true,
            value = """
                    SELECT wa.*
                    FROM weather_alerts wa
                    WHERE wa.scope IS NOT NULL
                      AND wa.expires_at > NOW()
                      AND (wa.scope = 'GLOBAL' OR LOWER(wa.city) = LOWER(:city))
                    ORDER BY wa.created_at DESC
                    """
    )
    List<WeatherAlert> findManualActiveForCity(@Param("city") String city);
}
