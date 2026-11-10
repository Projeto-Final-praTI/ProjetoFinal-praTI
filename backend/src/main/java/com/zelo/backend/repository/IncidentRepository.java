package com.zelo.backend.repository;

import com.zelo.backend.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Acesso aos pontos críticos, incluindo consultas geoespaciais.
 */
@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID> {

    /**
     * Busca incidentes num raio (metros) a partir do centro do mapa,
     * utilizando PostGIS nativo com ST_DWithin sobre geography (SRID 4326).
     */
    @Query(
            nativeQuery = true,
            value = """
                    SELECT i.*
                    FROM incidents i
                    WHERE ST_DWithin(
                              i.location::geography,
                              ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                              :radiusMeters
                          )
                    ORDER BY i.created_at DESC
                    """
    )
    List<Incident> findNearby(
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("radiusMeters") Double radiusMeters);

    /** Escopo de gestão por cidade (painel do gestor), ignorando caixa. */
    List<Incident> findByCityIgnoreCase(String city);

    /** Pontos criados por um usuário (para contagem e exclusão em cascata manual). */
    List<Incident> findByAuthorId(UUID authorId);

    long countByAuthorId(UUID authorId);
}
