package com.zelo.backend.service;

import com.zelo.backend.dto.ApproveMissingPersonRequestDTO;
import com.zelo.backend.dto.MissingPersonCommentDTO;
import com.zelo.backend.dto.MissingPersonReportDTO;
import com.zelo.backend.dto.MissingPersonReportRequestDTO;
import com.zelo.backend.dto.RejectMissingPersonRequestDTO;
import com.zelo.backend.entity.AlertScope;
import com.zelo.backend.entity.Incident;
import com.zelo.backend.entity.MissingPersonComment;
import com.zelo.backend.entity.MissingPersonKind;
import com.zelo.backend.entity.MissingPersonReport;
import com.zelo.backend.entity.MissingPersonStatus;
import com.zelo.backend.entity.Role;
import com.zelo.backend.entity.User;
import com.zelo.backend.exception.EntityNotFoundException;
import com.zelo.backend.exception.ForbiddenOperationException;
import com.zelo.backend.repository.IncidentRepository;
import com.zelo.backend.repository.MissingPersonCommentRepository;
import com.zelo.backend.repository.MissingPersonReportRepository;
import com.zelo.backend.repository.UserRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Denúncias de pessoa desaparecida/sequestro.
 *
 * <p>Fluxo: cidadão envia com foto (PENDENTE) → fiscal/gestor/root aprova
 * (APROVADO) ou recusa (RECUSADO). Quando o denunciante informa a própria
 * localização, o envio já dispara um <b>pré-alerta</b> de 10 minutos num raio
 * de 1 km, antes da moderação. A aprovação amplia o alcance para a
 * abrangência/raio escolhidos, usando a localização do denunciante como
 * centro. A população pode comentar avistamentos (texto e/ou imagem) nas
 * denúncias visíveis.
 */
@Service
@Transactional(readOnly = true)
public class MissingPersonService {

    private static final double DEFAULT_RADIUS_METERS = 50000.0;

    /** Pré-alerta imediato: 1 km por 10 minutos, antes da moderação. */
    private static final double PRE_ALERT_RADIUS_METERS = 1000.0;
    private static final int PRE_ALERT_MINUTES = 10;

    private final MissingPersonReportRepository reportRepository;
    private final MissingPersonCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final IncidentRepository incidentRepository;
    private final StorageService storageService;
    private final ReverseGeocodingService reverseGeocodingService;

    private final GeometryFactory geometryFactory = new GeometryFactory();

    public MissingPersonService(MissingPersonReportRepository reportRepository,
                                MissingPersonCommentRepository commentRepository,
                                UserRepository userRepository,
                                IncidentRepository incidentRepository,
                                StorageService storageService,
                                ReverseGeocodingService reverseGeocodingService) {
        this.reportRepository = reportRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.incidentRepository = incidentRepository;
        this.storageService = storageService;
        this.reverseGeocodingService = reverseGeocodingService;
    }

    /** Cidadão envia uma denúncia com foto obrigatória. */
    @Transactional
    public MissingPersonReportDTO submit(MissingPersonReportRequestDTO dto,
                                         MultipartFile photo,
                                         UserDetails details) throws Exception {
        if (photo == null || photo.isEmpty()) {
            throw new IllegalArgumentException("A foto da pessoa é obrigatória.");
        }
        String contentType = photo.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new IllegalArgumentException("O arquivo enviado precisa ser uma imagem.");
        }

        User author = requireUser(details);
        String folder = UUID.randomUUID().toString();
        String photoUrl = storageService.uploadMissingPersonPhoto(folder, photo);

        Point center = resolveReporterLocation(dto.getLat(), dto.getLng());

        MissingPersonReport report = MissingPersonReport.builder()
                .personName(dto.getPersonName().trim())
                .kind(parseKind(dto.getKind()))
                .description(dto.getDescription().trim())
                .lastSeenInfo(trimToNull(dto.getLastSeenInfo()))
                .contact(trimToNull(dto.getContact()))
                .city(dto.getCity().trim())
                .photoUrl(photoUrl)
                .status(MissingPersonStatus.PENDENTE)
                .centerLocation(center)
                // Enquanto o pré-alerta está ativo o raio é 1 km; na aprovação
                // a equipe de moderação define o alcance final.
                .radiusMeters(center != null ? PRE_ALERT_RADIUS_METERS : null)
                .preAlertExpiresAt(center != null
                        ? OffsetDateTime.now().plusMinutes(PRE_ALERT_MINUTES)
                        : null)
                .submittedById(author.getId())
                .submittedByName(author.getFullName())
                .build();

        reportRepository.save(report);
        return toDto(report, true);
    }

    /** Alertas aprovados e ativos próximos da coordenada (inclui globais). */
    public List<MissingPersonReportDTO> findActiveNearby(Double lat, Double lng) {
        return reportRepository.findActiveNearby(lat, lng).stream()
                .map(r -> toDto(r, false))
                .toList();
    }

    /** Detalhe público: denúncias aprovadas/válidas ou em pré-alerta ativo. */
    public MissingPersonReportDTO getPublic(UUID id) {
        MissingPersonReport report = reportRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Denúncia não encontrada"));
        if (!isPubliclyVisible(report)) {
            throw new EntityNotFoundException("Denúncia não encontrada");
        }
        return toDto(report, false);
    }

    /**
     * Comentário/avistamento da população em uma denúncia visível (aprovada ou
     * em pré-alerta). Aceita texto, imagem ou ambos.
     */
    @Transactional
    public MissingPersonCommentDTO addComment(UUID id,
                                              String content,
                                              MultipartFile image,
                                              UserDetails details) throws Exception {
        MissingPersonReport report = reportRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Denúncia não encontrada"));
        if (!isPubliclyVisible(report)) {
            throw new ForbiddenOperationException("Esta denúncia não está mais ativa.");
        }

        String text = trimToNull(content);
        boolean hasImage = image != null && !image.isEmpty();
        if (text == null && !hasImage) {
            throw new IllegalArgumentException("Escreva um comentário ou envie uma imagem.");
        }

        String imageUrl = null;
        if (hasImage) {
            String contentType = image.getContentType();
            if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
                throw new IllegalArgumentException("O arquivo enviado precisa ser uma imagem.");
            }
            imageUrl = storageService.uploadMissingPersonCommentImage(
                    report.getId().toString(), image);
        }

        User author = requireUser(details);
        MissingPersonComment comment = MissingPersonComment.builder()
                .report(report)
                .authorId(author.getId())
                .authorName(author.getFullName())
                .content(text != null ? text : "")
                .imageUrl(imageUrl)
                .build();
        commentRepository.save(comment);
        return new MissingPersonCommentDTO(
                comment.getId(),
                author.getFullName(),
                comment.getContent(),
                comment.getImageUrl(),
                author.getId().equals(report.getSubmittedById()),
                comment.getCreatedAt());
    }

    /** Fila de moderação: root vê tudo; fiscal/gestor só a própria cidade. */
    public List<MissingPersonReportDTO> listForModeration(UserDetails details) {
        User caller = requireModerator(details);
        List<MissingPersonReport> reports = caller.getRole() == Role.ROOT
                ? reportRepository.findAllByOrderByCreatedAtDesc()
                : reportRepository.findByCityIgnoreCaseOrderByCreatedAtDesc(requireCity(caller));
        return reports.stream().map(r -> toDto(r, true)).toList();
    }

    /** Aprova e dispara a denúncia (local ou global). */
    @Transactional
    public MissingPersonReportDTO approve(UUID id,
                                          ApproveMissingPersonRequestDTO dto,
                                          UserDetails details) {
        User caller = requireModerator(details);
        MissingPersonReport report = reportRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Denúncia não encontrada"));
        if (report.getStatus() != MissingPersonStatus.PENDENTE) {
            throw new IllegalArgumentException("Somente denúncias pendentes podem ser aprovadas.");
        }
        requireSameCity(caller, report.getCity());

        AlertScope scope = caller.getRole() == Role.ROOT
                ? parseScope(dto.getScope())
                : AlertScope.LOCAL;
        String city = caller.getRole() == Role.ROOT
                ? normalizeCity(dto.getCity() != null ? dto.getCity() : report.getCity())
                : requireCity(caller);
        if (city == null) {
            throw new IllegalArgumentException("Informe a cidade do alerta local.");
        }

        int duration = dto.getDurationMinutes() != null ? dto.getDurationMinutes() : 1440;
        if (duration < 5 || duration > 10080) {
            throw new IllegalArgumentException("Duração deve estar entre 5 minutos e 7 dias.");
        }

        // Mantém o ponto do denunciante mesmo em alertas globais para exibir
        // a ocorrência no mapa. O alcance global não depende desse centro.
        Point center = report.getCenterLocation();
        Double radius = null;
        if (scope == AlertScope.LOCAL) {
            // Prefere a localização informada pelo denunciante; só geocodifica
            // a cidade quando ele não compartilhou a posição.
            if (center == null) {
                double[] coords = resolveCityCenter(city);
                if (coords == null) {
                    throw new IllegalArgumentException(
                            "Não foi possível localizar a cidade \"" + city + "\". Tente novamente em instantes.");
                }
                center = geometryFactory.createPoint(new Coordinate(coords[1], coords[0]));
                center.setSRID(4326);
            }
            Double requestedRadius = dto.getRadiusMeters() != null
                    ? dto.getRadiusMeters()
                    : report.getRequestedRadiusMeters();
            radius = requestedRadius != null ? requestedRadius : DEFAULT_RADIUS_METERS;
            if (radius < 1000 || radius > 200000) {
                throw new IllegalArgumentException("Raio deve estar entre 1 km e 200 km.");
            }
        }

        report.setStatus(MissingPersonStatus.APROVADO);
        report.setScope(scope);
        report.setCity(city);
        report.setCenterLocation(center);
        report.setRadiusMeters(radius);
        // A aprovação substitui o pré-alerta pelo alerta ampliado.
        report.setPreAlertExpiresAt(null);
        report.setExpiresAt(OffsetDateTime.now().plusMinutes(duration));
        report.setApprovedByName(caller.getFullName());
        report.setApprovedAt(OffsetDateTime.now());
        report.setRejectionReason(null);
        reportRepository.save(report);
        return toDto(report, true);
    }

    /** Recusa uma denúncia pendente. */
    @Transactional
    public MissingPersonReportDTO reject(UUID id,
                                         RejectMissingPersonRequestDTO dto,
                                         UserDetails details) {
        User caller = requireModerator(details);
        MissingPersonReport report = reportRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Denúncia não encontrada"));
        if (report.getStatus() != MissingPersonStatus.PENDENTE) {
            throw new IllegalArgumentException("Somente denúncias pendentes podem ser recusadas.");
        }
        requireSameCity(caller, report.getCity());

        report.setStatus(MissingPersonStatus.RECUSADO);
        report.setPreAlertExpiresAt(null);
        report.setRejectionReason(dto != null ? trimToNull(dto.getReason()) : null);
        reportRepository.save(report);
        return toDto(report, true);
    }

    /** Remove uma denúncia (root: qualquer; fiscal/gestor: própria cidade). */
    @Transactional
    public void delete(UUID id, UserDetails details) {
        User caller = requireModerator(details);
        MissingPersonReport report = reportRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Denúncia não encontrada"));
        requireSameCity(caller, report.getCity());
        reportRepository.delete(report);
    }

    // ------------------------------------------------------------------
    // Regras e mapeamento
    // ------------------------------------------------------------------

    private User requireUser(UserDetails details) {
        return userRepository.findByEmail(details.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
    }

    private User requireModerator(UserDetails details) {
        User user = requireUser(details);
        if (user.getRole() != Role.FISCAL
                && user.getRole() != Role.GESTOR
                && user.getRole() != Role.ROOT) {
            throw new ForbiddenOperationException(
                    "Apenas fiscais, gestores e root podem moderar denúncias.");
        }
        return user;
    }

    private void requireSameCity(User caller, String reportCity) {
        if (caller.getRole() == Role.ROOT) return;
        String city = requireCity(caller);
        if (reportCity == null || !reportCity.equalsIgnoreCase(city)) {
            throw new ForbiddenOperationException(
                    "Esta denúncia pertence a outra cidade (" + reportCity + ").");
        }
    }

    private String requireCity(User user) {
        String city = normalizeCity(user.getCity());
        if (city == null) {
            throw new ForbiddenOperationException("Usuário sem cidade de atuação definida.");
        }
        return city;
    }

    private MissingPersonKind parseKind(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Tipo da ocorrência é obrigatório.");
        }
        try {
            return MissingPersonKind.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Tipo inválido. Use DESAPARECIMENTO ou SEQUESTRO.");
        }
    }

    private AlertScope parseScope(String value) {
        if (value == null || value.isBlank()) return AlertScope.LOCAL;
        try {
            return AlertScope.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Abrangência inválida. Use GLOBAL ou LOCAL.");
        }
    }

    /**
     * Converte a localização informada pelo denunciante em um ponto WGS84.
     * Retorna {@code null} quando ausente/inválida — nesse caso não há
     * pré-alerta e o centro só é resolvido na aprovação.
     */
    private Point resolveReporterLocation(Double lat, Double lng) {
        if (lat == null || lng == null) return null;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new IllegalArgumentException("Localização inválida.");
        }
        Point point = geometryFactory.createPoint(new Coordinate(lng, lat));
        point.setSRID(4326);
        return point;
    }

    private double[] resolveCityCenter(String city) {
        double[] geocoded = reverseGeocodingService.resolveCityCenter(city);
        if (geocoded != null) return geocoded;

        List<Incident> incidents = incidentRepository.findByCityIgnoreCase(city);
        double lat = 0;
        double lng = 0;
        int count = 0;
        for (Incident incident : incidents) {
            if (incident.getLocation() != null) {
                lat += incident.getLocation().getY();
                lng += incident.getLocation().getX();
                count++;
            }
        }
        return count > 0 ? new double[]{lat / count, lng / count} : null;
    }

    private MissingPersonReportDTO toDto(MissingPersonReport report, boolean includeContact) {
        List<MissingPersonComment> comments =
                commentRepository.findByReportIdOrderByCreatedAtAsc(report.getId());

        MissingPersonReportDTO dto = new MissingPersonReportDTO();
        dto.setId(report.getId());
        dto.setPersonName(report.getPersonName());
        dto.setKind(report.getKind() != null ? report.getKind().name() : null);
        dto.setTitle(buildTitle(report));
        dto.setDescription(report.getDescription());
        dto.setLastSeenInfo(report.getLastSeenInfo());
        dto.setContact(includeContact ? report.getContact() : null);
        dto.setCity(report.getCity());
        dto.setPhotoUrl(report.getPhotoUrl());
        dto.setStatus(report.getStatus() != null ? report.getStatus().name() : null);
        dto.setScope(report.getScope() != null ? report.getScope().name() : null);
        Point center = report.getCenterLocation();
        dto.setLat(center != null ? center.getY() : null);
        dto.setLng(center != null ? center.getX() : null);
        dto.setRadiusMeters(report.getRadiusMeters());
        dto.setRequestedRadiusMeters(report.getRequestedRadiusMeters());
        dto.setPreAlert(isPreAlert(report));
        dto.setPreAlertExpiresAt(report.getPreAlertExpiresAt());
        dto.setExpiresAt(report.getExpiresAt());
        dto.setSubmittedByName(report.getSubmittedByName());
        dto.setApprovedByName(report.getApprovedByName());
        dto.setApprovedAt(report.getApprovedAt());
        dto.setRejectionReason(report.getRejectionReason());
        dto.setCreatedAt(report.getCreatedAt());
        dto.setExpired(isExpired(report));
        dto.setCommentCount(comments.size());
        dto.setComments(comments.stream()
                .map(c -> new MissingPersonCommentDTO(
                        c.getId(),
                        c.getAuthorName(),
                        c.getContent(),
                        c.getImageUrl(),
                        c.getAuthorId() != null && c.getAuthorId().equals(report.getSubmittedById()),
                        c.getCreatedAt()))
                .toList());
        return dto;
    }

    private String buildTitle(MissingPersonReport report) {
        String prefix = report.getKind() == MissingPersonKind.SEQUESTRO
                ? "Sequestro"
                : "Pessoa desaparecida";
        return prefix + ": " + report.getPersonName();
    }

    private boolean isExpired(MissingPersonReport report) {
        return report.getStatus() == MissingPersonStatus.APROVADO
                && report.getExpiresAt() != null
                && report.getExpiresAt().isBefore(OffsetDateTime.now());
    }

    /** Pré-alerta de 1 km ainda dentro dos 10 minutos e com centro definido. */
    private boolean isPreAlert(MissingPersonReport report) {
        return report.getStatus() == MissingPersonStatus.PENDENTE
                && report.getCenterLocation() != null
                && report.getPreAlertExpiresAt() != null
                && report.getPreAlertExpiresAt().isAfter(OffsetDateTime.now());
    }

    /** Visível ao público: aprovada/válida ou pendente em pré-alerta ativo. */
    private boolean isPubliclyVisible(MissingPersonReport report) {
        if (report.getStatus() == MissingPersonStatus.APROVADO) {
            return !isExpired(report);
        }
        return isPreAlert(report);
    }

    private String normalizeCity(String city) {
        String trimmed = trimToNull(city);
        return trimmed;
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
