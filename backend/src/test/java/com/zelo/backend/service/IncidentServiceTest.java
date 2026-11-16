package com.zelo.backend.service;

import com.zelo.backend.dto.IncidentCommentDTO;
import com.zelo.backend.dto.IncidentRequestDTO;
import com.zelo.backend.dto.IncidentResponseDTO;
import com.zelo.backend.dto.StatusUpdateRequestDTO;
import com.zelo.backend.entity.*;
import com.zelo.backend.exception.EntityNotFoundException;
import com.zelo.backend.exception.ForbiddenOperationException;
import com.zelo.backend.exception.ProximityException;
import com.zelo.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock private IncidentRepository incidentRepository;
    @Mock private UserRepository userRepository;
    @Mock private IncidentEvidenceRepository evidenceRepository;
    @Mock private IncidentCommentRepository commentRepository;
    @Mock private IncidentUpvoteRepository upvoteRepository;
    @Mock private IncidentStatusHistoryRepository historyRepository;
    @Mock private StorageService storageService;
    @Mock private ReverseGeocodingService reverseGeocodingService;

    @InjectMocks
    private IncidentService incidentService;

    private User author;
    private UserDetails authorDetails;

    @BeforeEach
    void setUp() {
        author = User.builder()
                .id(UUID.randomUUID())
                .fullName("Autor")
                .email("autor@exemplo.com")
                .role(Role.USER)
                .city("São Paulo")
                .createdAt(LocalDateTime.now())
                .build();
        authorDetails = org.springframework.security.core.userdetails.User
                .withUsername("autor@exemplo.com").password("x").roles("USER").build();
    }

    @Test
    void createIncident_shouldRejectWhenTooFar() {
        IncidentRequestDTO dto = baseRequest();
        dto.setUserLat(0.0); dto.setUserLng(0.0); // muito longe
        MultipartFile file = mock(MultipartFile.class);
        assertThrows(ProximityException.class, () -> incidentService.createIncident(dto, List.of(file), authorDetails));
        verify(incidentRepository, never()).save(any());
    }

    @Test
    void createIncident_shouldRejectWithoutImages() {
        IncidentRequestDTO dto = baseRequest();
        assertThrows(IllegalArgumentException.class, () -> incidentService.createIncident(dto, List.of(), authorDetails));
        verify(incidentRepository, never()).save(any());
    }

    @Test
    void createIncident_shouldCreateAndReturnDto() throws Exception {
        IncidentRequestDTO dto = baseRequest();
        MultipartFile file = mock(MultipartFile.class);
        when(userRepository.findByEmail("autor@exemplo.com")).thenReturn(Optional.of(author));
        when(storageService.uploadImage(anyString(), any(MultipartFile.class))).thenReturn("/uploads/img.jpg");
        when(reverseGeocodingService.resolveCity(any(), any())).thenReturn("São Paulo");
        when(incidentRepository.save(any(Incident.class))).thenAnswer(inv -> {
            Incident i = inv.getArgument(0);
            i.setId(UUID.randomUUID());
            i.setCreatedAt(LocalDateTime.now());
            i.setEvidences(new ArrayList<>());
            i.setComments(new ArrayList<>());
            return i;
        });
        when(evidenceRepository.save(any(IncidentEvidence.class))).thenAnswer(inv -> inv.getArgument(0));
        when(historyRepository.save(any(IncidentStatusHistory.class))).thenAnswer(inv -> inv.getArgument(0));
        when(historyRepository.findByIncidentIdOrderByCreatedAtDesc(any())).thenReturn(Collections.emptyList());

        IncidentResponseDTO result = incidentService.createIncident(dto, List.of(file), authorDetails);

        assertNotNull(result);
        assertEquals("Buraco", result.getTitle());
        assertEquals("ABERTO", result.getStatus());
        assertEquals("BURACO", result.getCategory());
        assertEquals(1, result.getImages().size());
        verify(incidentRepository).save(any(Incident.class));
        verify(evidenceRepository).save(any(IncidentEvidence.class));
        verify(historyRepository).save(any(IncidentStatusHistory.class));
    }

    @Test
    void upvote_shouldIncrementOnceAndBeIdempotent() {
        Incident incident = incidentWithAuthor(author);
        when(incidentRepository.findById(incident.getId())).thenReturn(Optional.of(incident));
        when(userRepository.findByEmail("autor@exemplo.com")).thenReturn(Optional.of(author));
        when(upvoteRepository.existsByIncidentIdAndUserId(incident.getId(), author.getId())).thenReturn(false).thenReturn(true);
        when(incidentRepository.save(any(Incident.class))).thenAnswer(inv -> inv.getArgument(0));
        when(historyRepository.findByIncidentIdOrderByCreatedAtDesc(incident.getId())).thenReturn(Collections.emptyList());

        incidentService.upvote(incident.getId(), authorDetails);
        assertEquals(1, incident.getUpvotesCount());

        incidentService.upvote(incident.getId(), authorDetails);
        assertEquals(1, incident.getUpvotesCount());
        verify(upvoteRepository, times(1)).save(any(IncidentUpvote.class));
    }

    @Test
    void addComment_shouldPersistAndReturnComment() {
        Incident incident = incidentWithAuthor(author);
        when(incidentRepository.findById(incident.getId())).thenReturn(Optional.of(incident));
        when(userRepository.findByEmail("autor@exemplo.com")).thenReturn(Optional.of(author));
        when(commentRepository.save(any(IncidentComment.class))).thenAnswer(inv -> {
            IncidentComment c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            c.setCreatedAt(LocalDateTime.now());
            return c;
        });

        IncidentCommentDTO dto = incidentService.addComment(incident.getId(), "Comentário", authorDetails);

        assertEquals("Comentário", dto.getContent());
        assertEquals("Autor", dto.getAuthorName());
        verify(commentRepository).save(any(IncidentComment.class));
    }

    @Test
    void updateStatus_shouldFailForRegularUser() {
        Incident incident = incidentWithAuthor(author);
        incident.setStatus(IncidentStatus.ABERTO);
        when(incidentRepository.findById(incident.getId())).thenReturn(Optional.of(incident));
        when(userRepository.findByEmail("autor@exemplo.com")).thenReturn(Optional.of(author));

        StatusUpdateRequestDTO dto = new StatusUpdateRequestDTO();
        dto.setStatus("EM_ATENDIMENTO");
        assertThrows(ForbiddenOperationException.class, () -> incidentService.updateStatus(incident.getId(), dto, authorDetails));
    }

    @Test
    void updateStatus_shouldAllowRootAndRecordHistory() {
        User root = User.builder().id(UUID.randomUUID()).fullName("Root").email("root@exemplo.com")
                .role(Role.ROOT).city("X").createdAt(LocalDateTime.now()).build();
        UserDetails rootDetails = org.springframework.security.core.userdetails.User
                .withUsername("root@exemplo.com").password("x").roles("ROOT").build();
        Incident incident = incidentWithAuthor(author);
        incident.setStatus(IncidentStatus.ABERTO);
        when(incidentRepository.findById(incident.getId())).thenReturn(Optional.of(incident));
        when(userRepository.findByEmail("root@exemplo.com")).thenReturn(Optional.of(root));
        when(historyRepository.save(any(IncidentStatusHistory.class))).thenAnswer(inv -> inv.getArgument(0));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(inv -> inv.getArgument(0));
        when(historyRepository.findByIncidentIdOrderByCreatedAtDesc(incident.getId())).thenReturn(Collections.emptyList());

        StatusUpdateRequestDTO dto = new StatusUpdateRequestDTO();
        dto.setStatus("EM_ATENDIMENTO");
        dto.setNote("Equipe acionada");
        IncidentResponseDTO result = incidentService.updateStatus(incident.getId(), dto, rootDetails);

        assertEquals("EM_ATENDIMENTO", result.getStatus());
        verify(historyRepository).save(any(IncidentStatusHistory.class));
    }

    @Test
    void deleteIncident_shouldAllowAuthor() {
        Incident incident = incidentWithAuthor(author);
        when(incidentRepository.findById(incident.getId())).thenReturn(Optional.of(incident));
        when(userRepository.findByEmail("autor@exemplo.com")).thenReturn(Optional.of(author));

        incidentService.deleteIncident(incident.getId(), authorDetails);

        verify(upvoteRepository).deleteByIncidentId(incident.getId());
        verify(incidentRepository).delete(incident);
    }

    @Test
    void deleteIncident_shouldRejectOtherRegularUser() {
        User other = User.builder().id(UUID.randomUUID()).fullName("Outro").email("outro@exemplo.com")
                .role(Role.USER).createdAt(LocalDateTime.now()).build();
        UserDetails otherDetails = org.springframework.security.core.userdetails.User
                .withUsername("outro@exemplo.com").password("x").roles("USER").build();
        Incident incident = incidentWithAuthor(author);
        when(incidentRepository.findById(incident.getId())).thenReturn(Optional.of(incident));
        when(userRepository.findByEmail("outro@exemplo.com")).thenReturn(Optional.of(other));

        assertThrows(ForbiddenOperationException.class, () -> incidentService.deleteIncident(incident.getId(), otherDetails));
        verify(incidentRepository, never()).delete(any());
    }

    @Test
    void getById_shouldThrowWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(incidentRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> incidentService.getById(id));
    }

    private IncidentRequestDTO baseRequest() {
        IncidentRequestDTO dto = new IncidentRequestDTO();
        dto.setTitle("Buraco");
        dto.setDescription("Descrição");
        dto.setCategory("BURACO");
        dto.setIncidentLat(-23.5505);
        dto.setIncidentLng(-46.6333);
        dto.setUserLat(-23.5505);
        dto.setUserLng(-46.6333);
        return dto;
    }

    private Incident incidentWithAuthor(User a) {
        GeometryFactory gf = new GeometryFactory();
        Point p = gf.createPoint(new Coordinate(-46.6333, -23.5505));
        p.setSRID(4326);
        return Incident.builder()
                .id(UUID.randomUUID())
                .title("Buraco")
                .description("Desc")
                .category(IncidentCategory.BURACO)
                .status(IncidentStatus.ABERTO)
                .city("São Paulo")
                .location(p)
                .author(a)
                .upvotesCount(0)
                .createdAt(LocalDateTime.now())
                .evidences(new ArrayList<>())
                .comments(new ArrayList<>())
                .build();
    }
}
