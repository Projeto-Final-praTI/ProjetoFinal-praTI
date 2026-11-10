package com.zelo.backend.repository;

import com.zelo.backend.entity.IncidentComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Acesso aos comentários dos pontos críticos.
 */
@Repository
public interface IncidentCommentRepository extends JpaRepository<IncidentComment, UUID> {

    List<IncidentComment> findByIncidentIdOrderByCreatedAtDesc(UUID incidentId);

    /**
     * Desvincula comentários de um usuário que será apagado (author_id é NOT NULL,
     * então não dá para apenas setar null via cascade: mantém o comentário no
     * histórico, mas sem autoria).
     */
    @Modifying
    @Query("update IncidentComment c set c.author = null where c.author.id = :userId")
    void unlinkAuthor(@Param("userId") UUID userId);

    /** Remove os comentários de um usuário quando os pontos dele também serão apagados. */
    @Modifying
    @Query("delete from IncidentComment c where c.author.id = :userId")
    void deleteByAuthorId(@Param("userId") UUID userId);
}
