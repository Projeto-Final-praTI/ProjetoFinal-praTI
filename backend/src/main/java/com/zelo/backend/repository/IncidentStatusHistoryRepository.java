package com.zelo.backend.repository;

import com.zelo.backend.entity.IncidentStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Acesso ao histórico de status dos pontos críticos.
 */
@Repository
public interface IncidentStatusHistoryRepository extends JpaRepository<IncidentStatusHistory, UUID> {

    /** Linha do tempo de um incidente, mais recente primeiro. */
    List<IncidentStatusHistory> findByIncidentIdOrderByCreatedAtDesc(UUID incidentId);

    /**
     * Desvincula o autor das entradas de histórico (author_id é anulável) para
     * permitir apagar o usuário mantendo a trilha de auditoria do ponto.
     */
    @Modifying
    @Query("update IncidentStatusHistory h set h.author = null where h.author.id = :userId")
    void unlinkAuthor(@Param("userId") UUID userId);

    @Modifying
    @Query("delete from IncidentStatusHistory h where h.author.id = :userId")
    void deleteByAuthorId(@Param("userId") UUID userId);
}
