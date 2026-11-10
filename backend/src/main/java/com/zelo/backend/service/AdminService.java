package com.zelo.backend.service;

import com.zelo.backend.dto.AdminStatsDTO;
import com.zelo.backend.dto.DeleteUserRequestDTO;
import com.zelo.backend.dto.IncidentResponseDTO;
import com.zelo.backend.dto.SetRoleRequestDTO;
import com.zelo.backend.dto.UserDTO;
import com.zelo.backend.entity.Incident;
import com.zelo.backend.entity.Role;
import com.zelo.backend.entity.User;
import com.zelo.backend.exception.EntityNotFoundException;
import com.zelo.backend.exception.ForbiddenOperationException;
import com.zelo.backend.repository.IncidentCommentRepository;
import com.zelo.backend.repository.IncidentRepository;
import com.zelo.backend.repository.IncidentStatusHistoryRepository;
import com.zelo.backend.repository.IncidentUpvoteRepository;
import com.zelo.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Serviço do painel administrativo (RBAC):
 *
 * - ROOT:  acesso irrestrito — lista usuários/incidentes de qualquer cidade,
 *          promove gestores e altera qualquer cargo.
 * - GESTOR: escopo estrito à própria cidade — busca cidadãos da SUA cidade e
 *          só alterna USER <-> FISCAL (nunca cria gestores nem toca em
 *          ROOT/GESTOR de nenhuma cidade).
 */
@Service
@Transactional(readOnly = true)
public class AdminService {

    /**
     * Conta técnica que assume a autoria dos pontos quando um usuário é apagado
     * com "manter pontos". Não é um usuário real; é criada/garantida no startup
     * (ver {@code SystemUserInitializer}).
     */
    public static final String SYSTEM_OWNER_EMAIL = "sistema@zelo.local";

    private final UserRepository userRepository;
    private final IncidentRepository incidentRepository;
    private final IncidentService incidentService;
    private final IncidentUpvoteRepository upvoteRepository;
    private final IncidentCommentRepository commentRepository;
    private final IncidentStatusHistoryRepository historyRepository;

    public AdminService(UserRepository userRepository,
                        IncidentRepository incidentRepository,
                        IncidentService incidentService,
                        IncidentUpvoteRepository upvoteRepository,
                        IncidentCommentRepository commentRepository,
                        IncidentStatusHistoryRepository historyRepository) {
        this.userRepository = userRepository;
        this.incidentRepository = incidentRepository;
        this.incidentService = incidentService;
        this.upvoteRepository = upvoteRepository;
        this.commentRepository = commentRepository;
        this.historyRepository = historyRepository;
    }

    /**
     * Lista usuários com escopo do chamador.
     * - ROOT: todos (filtro opcional por city).
     * - GESTOR: somente os da própria cidade (city param é ignorado/forçado).
     */
    public List<UserDTO> listUsers(UserDetails details, String search, String city) {
        User caller = requireUser(details);

        if (caller.getRole() == Role.ROOT) {
            return filterUsers(userRepository.findAll(), search, city);
        }
        requireGestor(caller);
        if (caller.getCity() == null) {
            throw new ForbiddenOperationException("Gestor sem cidade de atuação definida");
        }
        // Escopo forçado à cidade do gestor — nunca enxerga outras localidades
        return filterUsers(userRepository.findAll(), search, caller.getCity());
    }

    /**
     * Promove/rebaixar cargo com as regras RBAC:
     * - ROOT: qualquer usuário e cargo (USER/FISCAL/GESTOR/ROOT).
     * - GESTOR: alvo DEVE ter a mesma cidade que ele; só USER <-> FISCAL;
     *           não pode alterar a si mesmo nem gestores/root.
     */
    @Transactional
    public UserDTO setRole(UUID userId, SetRoleRequestDTO dto, UserDetails details) {
        User caller = requireUser(details);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        if (target.getId().equals(caller.getId())) {
            throw new ForbiddenOperationException("Você não pode alterar o próprio cargo");
        }

        Role newRole;
        try {
            newRole = Role.valueOf(dto.getRole());
        } catch (Exception e) {
            throw new IllegalArgumentException("Cargo inválido: " + dto.getRole());
        }
        String city = normalizeCity(dto.getCity());

        if (caller.getRole() == Role.ROOT) {
            applyRole(target, newRole, city, true);
            userRepository.save(target);
            return toDto(target);
        }

        // --- daqui pra baixo só chega GESTOR (o controller já exige o papel) ---
        requireGestor(caller);
        if (caller.getCity() == null) {
            throw new ForbiddenOperationException("Gestor sem cidade de atuação definida");
        }
        if (!sameCity(caller.getCity(), target.getCity())) {
            throw new ForbiddenOperationException(
                    "Gestores só podem alterar usuários da própria cidade (" + caller.getCity() + ")");
        }
        if (target.getRole() == Role.GESTOR || target.getRole() == Role.ROOT) {
            throw new ForbiddenOperationException("Gestores não podem alterar cargos de outros gestores/root");
        }
        // Gestor apenas alterna USER <-> FISCAL
        boolean validTransition =
                (target.getRole() == Role.USER && newRole == Role.FISCAL)
                        || (target.getRole() == Role.FISCAL && newRole == Role.USER);
        if (!validTransition) {
            throw new ForbiddenOperationException(
                    "Gestores só podem promover a fiscal ou remover o fiscal da própria cidade");
        }
        // Fica na mesma cidade do gestor (evita promover para outra localidade)
        applyRole(target, newRole, caller.getCity(), false);
        userRepository.save(target);
        return toDto(target);
    }

    /** Lista de incidentes no escopo do chamador (gestor: própria cidade). */
    public List<IncidentResponseDTO> listIncidents(UserDetails details, String city) {
        User caller = requireUser(details);

        if (caller.getRole() == Role.ROOT) {
            List<Incident> all = incidentRepository.findAll();
            String filter = normalizeCity(city);
            return all.stream()
                    .filter(i -> filter == null || filter.equalsIgnoreCase(i.getCity()))
                    .map(this::toDto)
                    .toList();
        }
        requireGestor(caller);
        if (caller.getCity() == null) {
            throw new ForbiddenOperationException("Gestor sem cidade de atuação definida");
        }
        return incidentRepository.findByCityIgnoreCase(caller.getCity()).stream()
                .map(this::toDto)
                .toList();
    }

    /** Visão global (painel root): contagens por papel/status e cidades. */
    public AdminStatsDTO stats(UserDetails details) {        User caller = requireUser(details);
        if (caller.getRole() != Role.ROOT) {
            throw new ForbiddenOperationException("Apenas o root pode ver a visão global");
        }

        List<User> users = userRepository.findAll();
        List<Incident> incidents = incidentRepository.findAll();

        Map<String, Long> usersByRole = users.stream()
                .collect(Collectors.groupingBy(u -> u.getRole().name(), Collectors.counting()));
        Map<String, Long> incidentsByStatus = incidents.stream()
                .collect(Collectors.groupingBy(i -> i.getStatus().name(), Collectors.counting()));
        List<String> cities = users.stream()
                .map(User::getCity)
                .filter(c -> c != null && !c.isBlank())
                .distinct()
                .sorted()
                .toList();

        AdminStatsDTO stats = new AdminStatsDTO();
        stats.setTotalUsers(users.size());
        stats.setTotalIncidents(incidents.size());
        stats.setUsersByRole(usersByRole);
        stats.setIncidentsByStatus(incidentsByStatus);
        stats.setCities(cities);
        return stats;
    }

    /**
     * Apaga um ponto crítico pelo painel.
     * - ROOT: qualquer ponto, de qualquer cidade.
     * - GESTOR: somente pontos da própria cidade (403 fora do escopo).
     */
    @Transactional
    public void deleteIncident(UUID incidentId, UserDetails details) {
        User caller = requireUser(details);
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new EntityNotFoundException("Incidente não encontrado"));

        if (caller.getRole() == Role.ROOT) {
            incidentService.deleteIncident(incidentId, details);
            return;
        }

        requireGestor(caller);
        if (caller.getCity() == null) {
            throw new ForbiddenOperationException("Gestor sem cidade de atuação definida");
        }
        if (!sameCity(caller.getCity(), incident.getCity())) {
            throw new ForbiddenOperationException(
                    "Este ponto crítico não pertence à sua cidade de atuação (" + caller.getCity() + ")");
        }
        // Delega a checagem final de autorização + remoção das dependências
        incidentService.deleteIncident(incidentId, details);
    }

    /**
     * Apaga um usuário. EXCLUSIVO do ROOT (o controller já exige o papel).
     *
     * Como o root decide o destino dos pontos críticos do usuário apagado:
     * - {@code deleteIncidents = true}:  apaga TODOS os pontos registrados por
     *   ele (com comentários/histórico/upvotes das FKs sem cascade).
     * - {@code deleteIncidents = false}: MANTÉM os pontos no mapa e transfere a
     *   autoria para uma conta técnica de sistema (anonimização) — a FK
     *   {@code incidents.author_id} é NOT NULL, então não dá para apenas anular.
     *
     * Em ambos os casos remove os upvotes feitos pelo usuário e desvincula/limpa
     * comentários e entradas de histórico escritos por ele.
     */
    @Transactional
    public void deleteUser(UUID userId, DeleteUserRequestDTO dto, UserDetails details) {
        User caller = requireUser(details);
        if (caller.getRole() != Role.ROOT) {
            throw new ForbiddenOperationException("Apenas o root pode excluir usuários");
        }

        User target = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        if (target.getId().equals(caller.getId())) {
            throw new ForbiddenOperationException("Você não pode excluir a própria conta");
        }
        if (isLastRoot(target)) {
            throw new ForbiddenOperationException("Não é possível excluir o único root do sistema");
        }

        boolean deleteIncidents = dto != null && dto.isDeleteIncidents();

        // FKs sem ON DELETE CASCADE: remove os upvotes FEITOS pelo usuário primeiro.
        upvoteRepository.deleteByUserId(target.getId());

        if (deleteIncidents) {
            // Apaga os pontos dele e tudo que pende deles.
            for (Incident incident : incidentRepository.findByAuthorId(target.getId())) {
                upvoteRepository.deleteByIncidentId(incident.getId());
                incidentRepository.delete(incident);
            }
            // Comentários/histórico escritos por ele em OUTROS pontos também saem.
            commentRepository.deleteByAuthorId(target.getId());
            historyRepository.deleteByAuthorId(target.getId());
        } else {
            // Mantém os pontos: transfere a autoria para a conta de sistema.
            User system = systemOwner(caller);
            for (Incident incident : incidentRepository.findByAuthorId(target.getId())) {
                incident.setAuthor(system);
                incidentRepository.save(incident);
            }
            // Mantém comentários/histórico, apenas sem autoria.
            commentRepository.unlinkAuthor(target.getId());
            historyRepository.unlinkAuthor(target.getId());
        }

        userRepository.delete(target);
    }

    /** Quantos pontos o usuário registrou (para o aviso/checkbox do painel). */
    public long countIncidentsByAuthor(UUID userId, UserDetails details) {
        User caller = requireUser(details);
        if (caller.getRole() != Role.ROOT) {
            throw new ForbiddenOperationException("Apenas o root pode consultar este dado");
        }
        return incidentRepository.countByAuthorId(userId);
    }

    // ---------------------------------------------------------------- helpers

    /** Conta técnica que assume a autoria de pontos órfãos (evita author_id nulo). */
    private User systemOwner(User caller) {
        return userRepository.findByEmail(SYSTEM_OWNER_EMAIL).orElse(caller);
    }

    /** Verdadeiro se o alvo é o único ROOT restante. */
    private boolean isLastRoot(User target) {
        if (target.getRole() != Role.ROOT) return false;
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ROOT)
                .count() <= 1;
    }

    private void applyRole(User target, Role newRole, String city, boolean rootMode) {
        if (newRole == Role.GESTOR || newRole == Role.ROOT) {
            if (!rootMode) {
                throw new ForbiddenOperationException("Apenas o root pode criar gestores/root");
            }
            if (city == null) {
                throw new IllegalArgumentException("Cargo " + newRole.name() + " exige uma cidade");
            }
        }
        if (newRole == Role.FISCAL && city == null) {
            throw new IllegalArgumentException("Promover a fiscal exige informar a cidade");
        }
        target.setRole(newRole);
        if (city != null) {
            target.setCity(city);
        }
    }

    private List<UserDTO> filterUsers(Collection<User> users, String search, String city) {
        String term = search == null ? "" : search.trim().toLowerCase();
        String cityFilter = normalizeCity(city);
        return users.stream()
                .filter(u -> cityFilter == null || cityFilter.equalsIgnoreCase(u.getCity()))
                .filter(u -> term.isEmpty()
                        || u.getFullName().toLowerCase().contains(term)
                        || u.getEmail().toLowerCase().contains(term))
                .map(this::toDto)
                .toList();
    }

    private User requireUser(UserDetails details) {
        return userRepository.findByEmail(details.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
    }

    private void requireGestor(User user) {
        if (user.getRole() != Role.GESTOR && user.getRole() != Role.ROOT) {
            throw new ForbiddenOperationException("Apenas gestores podem acessar este recurso");
        }
    }

    private boolean sameCity(String a, String b) {
        if (a == null || b == null) return false;
        return a.trim().equalsIgnoreCase(b.trim());
    }

    private String normalizeCity(String city) {
        if (city == null) return null;
        String normalized = city.trim().replaceAll("\\s+", " ");
        return normalized.isEmpty() ? null : normalized;
    }

    private UserDTO toDto(User u) {
        return new UserDTO(u.getId(), u.getFullName(), u.getEmail(), u.getRole().name(),
                u.getCity(), u.getCreatedAt());
    }

    private IncidentResponseDTO toDto(Incident i) {
        // reusa a serialização completa do IncidentService (inclui histórico)
        return incidentService.getById(i.getId());
    }
}
