package com.zelo.backend.repository;

import com.zelo.backend.entity.MissingPersonComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Acesso aos comentários das denúncias de pessoa desaparecida.
 */
@Repository
public interface MissingPersonCommentRepository extends JpaRepository<MissingPersonComment, UUID> {

    List<MissingPersonComment> findByReportIdOrderByCreatedAtAsc(UUID reportId);

    long countByReportId(UUID reportId);
}
