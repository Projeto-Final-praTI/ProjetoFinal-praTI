package com.zelo.backend.repository;

import com.zelo.backend.entity.MissingPersonReport;
import com.zelo.backend.entity.MissingPersonStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Acesso às denúncias de pessoa desaparecida.
 */
@Repository
public interface MissingPersonReportRepository extends JpaRepository<MissingPersonReport, UUID> {

    /**
     * Denúncias visíveis ao público próximas da coordenada consultada:
     * <ul>
     *   <li>pré-alertas (PENDENTE, 1 km / 10 min) do entorno imediato;</li>
     *   <li>aprovadas e ainda válidas, incluindo as globais (root).</li>
     * </ul>
     * PostGIS sobre geography (SRID 4326). Pré-alertas vêm primeiro.
     */
    @Query(
            nativeQuery = true,
            value = """
                    SELECT r.*
                    FROM missing_person_reports r
                    WHERE (
                        (
                            r.status = 'PENDENTE'
                            AND r.pre_alert_expires_at > NOW()
                            AND r.center_location IS NOT NULL
                            AND ST_DWithin(
                                    r.center_location::geography,
                                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                                    r.radius_meters
                                )
                        )
                        OR
                        (
                            r.status = 'APROVADO'
                            AND r.expires_at > NOW()
                            AND (
                                r.scope = 'GLOBAL'
                                OR ST_DWithin(
                                        r.center_location::geography,
                                        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                                        r.radius_meters
                                    )
                            )
                        )
                    )
                    ORDER BY
                          CASE WHEN r.status = 'PENDENTE' THEN 1 ELSE 0 END DESC,
                          CASE WHEN r.scope = 'GLOBAL' THEN 1 ELSE 0 END DESC,
                          COALESCE(r.approved_at, r.created_at) DESC
                    """
    )
    List<MissingPersonReport> findActiveNearby(
            @Param("lat") Double lat,
            @Param("lng") Double lng);

    List<MissingPersonReport> findAllByOrderByCreatedAtDesc();

    List<MissingPersonReport> findByCityIgnoreCaseOrderByCreatedAtDesc(String city);

    List<MissingPersonReport> findByStatusOrderByCreatedAtAsc(MissingPersonStatus status);

    List<MissingPersonReport> findByStatusAndCityIgnoreCaseOrderByCreatedAtAsc(
            MissingPersonStatus status, String city);
}
