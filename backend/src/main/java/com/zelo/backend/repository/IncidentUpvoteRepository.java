package com.zelo.backend.repository;

import com.zelo.backend.entity.IncidentUpvote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Acesso aos votos de confirmação dos pontos críticos.
 */
@Repository
public interface IncidentUpvoteRepository extends JpaRepository<IncidentUpvote, UUID> {

    boolean existsByIncidentIdAndUserId(UUID incidentId, UUID userId);

    /**
     * Remove as confirmações de um incidente antes de apagá-lo — a FK
     * incident_upvotes.incident_id não tem ON DELETE CASCADE, então sem isso o
     * DELETE falharia com violação de chave estrangeira.
     */
    @Modifying
    @Query("delete from IncidentUpvote u where u.incident.id = :incidentId")
    void deleteByIncidentId(@Param("incidentId") UUID incidentId);

    /**
     * Remove os upvotes feitos por um usuário que será apagado — a FK
     * incident_upvotes.user_id não tem ON DELETE CASCADE.
     */
    @Modifying
    @Query("delete from IncidentUpvote u where u.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
