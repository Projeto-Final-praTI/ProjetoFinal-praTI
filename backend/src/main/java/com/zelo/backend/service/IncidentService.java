package com.zelo.backend.service;

import com.zelo.backend.dto.IncidentCommentDTO;
import com.zelo.backend.dto.IncidentRequestDTO;
import com.zelo.backend.dto.IncidentResponseDTO;
import com.zelo.backend.dto.StatusUpdateRequestDTO;
import com.zelo.backend.entity.Incident;
import com.zelo.backend.entity.IncidentCategory;
import com.zelo.backend.entity.IncidentComment;
import com.zelo.backend.entity.IncidentEvidence;
import com.zelo.backend.entity.IncidentStatus;
import com.zelo.backend.entity.IncidentStatusHistory;
import com.zelo.backend.entity.IncidentUpvote;
import com.zelo.backend.entity.Role;
import com.zelo.backend.entity.User;
import com.zelo.backend.exception.EntityNotFoundException;
import com.zelo.backend.exception.ForbiddenOperationException;
import com.zelo.backend.exception.ProximityException;
import com.zelo.backend.repository.IncidentCommentRepository;
import com.zelo.backend.repository.IncidentEvidenceRepository;
import com.zelo.backend.repository.IncidentRepository;
import com.zelo.backend.repository.IncidentStatusHistoryRepository;
import com.zelo.backend.repository.IncidentUpvoteRepository;
import com.zelo.backend.repository.UserRepository;
import com.zelo.backend.dto.UserDTO;
import com.zelo.backend.dto.IncidentStatusHistoryDTO;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

import java.util.UUID;

/**
 * Regras de negócio dos pontos críticos: criação, consulta, status, comentários e votos.
 */
@Service
@Transactional(readOnly = true)
public class IncidentService {

    private static final double MAX_DISTANCE_METERS = 500;

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final IncidentEvidenceRepository evidenceRepository;
    private final IncidentCommentRepository commentRepository;
    private final IncidentUpvoteRepository upvoteRepository;
    private final IncidentStatusHistoryRepository historyRepository;
    private final StorageService storageService;
    private final ReverseGeocodingService reverseGeocodingService;

    public IncidentService(IncidentRepository incidentRepository,
                           UserRepository userRepository,
                           IncidentEvidenceRepository evidenceRepository,
                           IncidentCommentRepository commentRepository,
                           IncidentUpvoteRepository upvoteRepository,
                           IncidentStatusHistoryRepository historyRepository,
                           StorageService storageService,
                           ReverseGeocodingService reverseGeocodingService) {
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
        this.evidenceRepository = evidenceRepository;
        this.commentRepository = commentRepository;
        this.upvoteRepository = upvoteRepository;
        this.historyRepository = historyRepository;
        this.storageService = storageService;
        this.reverseGeocodingService = reverseGeocodingService;
    }

    @Transactional
    public IncidentResponseDTO createIncident(IncidentRequestDTO dto,
                                              List<MultipartFile> images,
                                              UserDetails userDetails) throws Exception {
        // Regras de negócio: proximidade (geofencing de 500m)
        double distanceMeters = haversineMeters(
                dto.getUserLat(), dto.getUserLng(),
                dto.getIncidentLat(), dto.getIncidentLng());
        if (distanceMeters > MAX_DISTANCE_METERS) {
            throw new ProximityException(String.format(
                    "Você está a %.0f metros do local. É necessário estar a no máximo 500 metros do problema para registrá-lo.",
                    Math.round(distanceMeters)));
        }

        if (images == null || images.isEmpty()) {
            throw new IllegalArgumentException("No mínimo 1 imagem é obrigatória para registrar o incidente");
        }

        User author = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        GeometryFactory gf = new GeometryFactory();
        Coordinate coord = new Coordinate(dto.getIncidentLng(), dto.getIncidentLat());
        Point location = gf.createPoint(coord);
        location.setSRID(4326);

        Incident incident = Incident.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .category(IncidentCategory.valueOf(dto.getCategory()))
                .status(IncidentStatus.ABERTO)
                .city(resolveCity(dto))
                .location(location)
                .author(author)
                .build();

        Incident saved = incidentRepository.save(incident);

        // Entrada inicial da linha do tempo (criação do ponto)
        historyRepository.save(IncidentStatusHistory.builder()
                .incident(saved)
                .previousStatus(null)
                .newStatus(IncidentStatus.ABERTO)
                .note("Ponto crítico registrado")
                .author(author)
                .build());

        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile file : images) {
            String url = storageService.uploadImage(saved.getId().toString(), file);
            imageUrls.add(url);
            evidenceRepository.save(IncidentEvidence.builder()
                    .incident(saved)
                    .imageUrl(url)
                    .build());
        }

        return toDto(saved, imageUrls, List.of());
    }

    public List<IncidentResponseDTO> findNearby(Double lat, Double lng, Double radiusMeters) {
        return incidentRepository.findNearby(lat, lng, radiusMeters).stream()
                .map(this::toDto)
                .toList();
    }

    public IncidentResponseDTO getById(UUID id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Incidente não encontrado"));
        return toDto(incident);
    }

    @Transactional
    public IncidentResponseDTO upvote(UUID id, UserDetails userDetails) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Incidente não encontrado"));
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        // Máximo 1 confirmação por usuário: upvote repetido é ignorado
        boolean alreadyVoted = upvoteRepository.existsByIncidentIdAndUserId(id, user.getId());
        if (!alreadyVoted) {
            upvoteRepository.save(IncidentUpvote.builder()
                    .incident(incident)
                    .user(user)
                    .build());
            incident.setUpvotesCount(incident.getUpvotesCount() + 1);
            incidentRepository.save(incident);
        }
        return toDto(incident);
    }

    @Transactional
    public IncidentCommentDTO addComment(UUID incidentId, String content, UserDetails userDetails) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new EntityNotFoundException("Incidente não encontrado"));
        User author = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        IncidentComment comment = IncidentComment.builder()
                .incident(incident)
                .author(author)
                .content(content)
                .build();
        commentRepository.save(comment);

        return new IncidentCommentDTO(
                comment.getId(),
                author.getFullName(),
                comment.getContent(),
                comment.getCreatedAt()
        );
    }

    /**
     * Transição de status operacional + nota na linha do tempo.
     *
     * Regras RBAC:
     * - ROOT:  qualquer incidente, de qualquer cidade.
     * - GESTOR/FISCAL: apenas incidentes da MESMA cidade do usuário
     *   (case-insensitive). Incidente sem cidade não pode ser gerido por eles.
     * - USER:  proibido (403).
     */
    @Transactional
    public IncidentResponseDTO updateStatus(UUID incidentId, StatusUpdateRequestDTO dto, UserDetails userDetails) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new EntityNotFoundException("Incidente não encontrado"));
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        if (!canManageIncidents(user)) {
            throw new ForbiddenOperationException("Apenas fiscais, gestores e administradores podem alterar o status");
        }
        if (user.getRole() != Role.ROOT && !sameCity(user.getCity(), incident.getCity())) {
            throw new ForbiddenOperationException(
                    "Este ponto crítico não pertence à sua cidade de atuação (" + user.getCity() + ")");
        }

        IncidentStatus newStatus = IncidentStatus.valueOf(dto.getStatus());
        if (newStatus == incident.getStatus() && isBlank(dto.getNote())) {
            throw new IllegalArgumentException("Nenhuma alteração: informe um novo status ou uma nota");
        }

        IncidentStatusHistory entry = IncidentStatusHistory.builder()
                .incident(incident)
                .previousStatus(incident.getStatus())
                .newStatus(newStatus)
                .note(isBlank(dto.getNote()) ? null : dto.getNote().trim())
                .author(user)
                .build();
        historyRepository.save(entry);

        incident.setStatus(newStatus);
        incidentRepository.save(incident);

        return toDto(incident);
    }

    /** Histórico completo (linha do tempo) de um incidente — leitura pública. */
    public List<IncidentStatusHistoryDTO> getHistory(UUID incidentId) {
        if (!incidentRepository.existsById(incidentId)) {
            throw new EntityNotFoundException("Incidente não encontrado");
        }
        return historyRepository.findByIncidentIdOrderByCreatedAtDesc(incidentId).stream()
                .map(this::historyToDto)
                .toList();
    }

    /**
     * Apaga um ponto crítico.
     *
     * Regras: o AUTOR pode apagar o próprio ponto, ROOT pode apagar qualquer um
     * e GESTOR/FISCAL podem apagar pontos da própria cidade de atuação.
     *
     * Apaga também dependências que não estão em cascade no banco (confirmações)
     * e as demais em cascade via JPA (evidências, comentários, histórico).
     */
    @Transactional
    public void deleteIncident(UUID incidentId, UserDetails userDetails) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new EntityNotFoundException("Incidente não encontrado"));
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        boolean isAuthor = incident.getAuthor() != null
                && incident.getAuthor().getId().equals(user.getId());
        boolean isRoot = user.getRole() == Role.ROOT;
        boolean isLocalOperator = (user.getRole() == Role.GESTOR || user.getRole() == Role.FISCAL)
                && sameCity(user.getCity(), incident.getCity());

        if (!isAuthor && !isRoot && !isLocalOperator) {
            throw new ForbiddenOperationException(
                    "Você só pode apagar pontos que registrou; gestores/fiscais apenas os da própria cidade");
        }

        // FK sem cascade no banco: precisa sair antes do incidente
        upvoteRepository.deleteByIncidentId(incidentId);
        incidentRepository.delete(incident);
    }

    /** ROOT gerencia tudo; GESTOR e FISCAL gerenciam incidentes da própria cidade. */
    private boolean canManageIncidents(User user) {
        return user.getRole() == Role.ROOT
                || user.getRole() == Role.GESTOR
                || user.getRole() == Role.FISCAL;
    }

    /** Igualdade de cidade ignorando caixa/espaços; null nunca igual a cidade. */
    private boolean sameCity(String a, String b) {
        if (a == null || b == null) return false;
        return a.trim().equalsIgnoreCase(b.trim());
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private String normalizeCity(String city) {
        if (city == null) return null;
        String normalized = city.trim().replaceAll("\\s+", " ");
        return normalized.isEmpty() ? null : normalized;
    }

    /**
     * Cidade do ponto: usa a informada explicitamente (compatibilidade de API) ou
     * resolve pela coordenada via geocodificação reversa. A cidade NÃO é herdada
     * do autor — o registro é livre, limitado apenas pelo geofence de 500 m.
     */
    private String resolveCity(IncidentRequestDTO dto) {
        String explicit = normalizeCity(dto.getCity());
        if (explicit != null) return explicit;
        if (dto.getIncidentLat() == null || dto.getIncidentLng() == null) return null;
        return normalizeCity(reverseGeocodingService.resolveCity(dto.getIncidentLat(), dto.getIncidentLng()));
    }

    private IncidentStatusHistoryDTO historyToDto(IncidentStatusHistory h) {
        return new IncidentStatusHistoryDTO(
                h.getId(),
                h.getPreviousStatus() != null ? h.getPreviousStatus().name() : null,
                h.getNewStatus().name(),
                h.getNote(),
                h.getAuthor() != null ? h.getAuthor().getFullName() : null,
                h.getCreatedAt());
    }

    private IncidentResponseDTO toDto(Incident incident) {
        return toDto(incident, evidenceUrls(incident), commentDtos(incident));
    }

    private List<String> evidenceUrls(Incident incident) {
        List<String> urls = new ArrayList<>();
        if (incident.getEvidences() != null) {
            incident.getEvidences().forEach(e -> urls.add(e.getImageUrl()));
        }
        return urls;
    }

    private List<IncidentCommentDTO> commentDtos(Incident incident) {
        List<IncidentCommentDTO> dtos = new ArrayList<>();
        if (incident.getComments() != null) {
            incident.getComments().forEach(c -> dtos.add(new IncidentCommentDTO(
                    c.getId(), c.getAuthor().getFullName(), c.getContent(), c.getCreatedAt())));
        }
        return dtos;
    }

    private IncidentResponseDTO toDto(Incident incident, List<String> images, List<IncidentCommentDTO> comments) {
        IncidentResponseDTO dto = new IncidentResponseDTO();
        dto.setId(incident.getId());
        dto.setTitle(incident.getTitle());
        dto.setDescription(incident.getDescription());
        dto.setCategory(incident.getCategory().name());
        dto.setStatus(incident.getStatus().name());
        dto.setCity(incident.getCity());
        if (incident.getLocation() != null) {
            dto.setLat(incident.getLocation().getY());
            dto.setLng(incident.getLocation().getX());
        }
        if (incident.getAuthor() != null) {
            dto.setAuthor(new UserDTO(
                    incident.getAuthor().getId(),
                    incident.getAuthor().getFullName(),
                    incident.getAuthor().getEmail(),
                    incident.getAuthor().getRole().name(),
                    incident.getAuthor().getCity(),
                    incident.getAuthor().getCreatedAt()));
        }
        dto.setUpvotesCount(incident.getUpvotesCount());
        dto.setCreatedAt(incident.getCreatedAt());
        dto.setImages(images);
        dto.setComments(comments);
        dto.setStatusHistory(historyDtos(incident));
        return dto;
    }

    /** Linha do tempo do incidente (mais recente primeiro). */
    private List<IncidentStatusHistoryDTO> historyDtos(Incident incident) {
        if (incident.getId() == null) return List.of();
        return historyRepository.findByIncidentIdOrderByCreatedAtDesc(incident.getId()).stream()
                .map(this::historyToDto)
                .toList();
    }

    /**
     * Fórmula de Haversine para calcular a distância real em metros entre dois
     * pontos (latitude, longitude) na superfície da Terra.
     */
    private double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000; // raio da Terra em metros
        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);
        double deltaPhi = Math.toRadians(lat2 - lat1);
        double deltaLambda = Math.toRadians(lon2 - lon1);

        double a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2)
                + Math.cos(phi1) * Math.cos(phi2)
                * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
