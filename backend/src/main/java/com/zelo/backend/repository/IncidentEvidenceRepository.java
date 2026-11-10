package com.zelo.backend.repository;

import com.zelo.backend.entity.IncidentEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Acesso às evidências (imagens) dos pontos críticos.
 */
@Repository
public interface IncidentEvidenceRepository extends JpaRepository<IncidentEvidence, UUID> {

    List<IncidentEvidence> findByIncidentIdOrderByUploadedAtDesc(UUID incidentId);
}
