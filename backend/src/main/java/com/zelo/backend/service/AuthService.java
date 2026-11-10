package com.zelo.backend.service;

import com.zelo.backend.dto.AuthResponseDTO;
import com.zelo.backend.dto.RegisterRequestDTO;
import com.zelo.backend.dto.UpdateProfileRequestDTO;
import com.zelo.backend.dto.UserDTO;
import com.zelo.backend.entity.Role;
import com.zelo.backend.entity.User;
import com.zelo.backend.exception.ForbiddenOperationException;
import com.zelo.backend.exception.ResourceNotFoundException;
import com.zelo.backend.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Regras de cadastro, login, atualização de perfil e identidade do usuário autenticado.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("E-mail já cadastrado");
        }
        String cleanCpf = dto.getCpf().replaceAll("\\D", "");
        if (userRepository.existsByCpf(cleanCpf)) {
            throw new IllegalArgumentException("CPF já cadastrado");
        }

        User user = User.builder()
                .fullName(dto.getFullName())
                .email(dto.getEmail())
                .cpf(cleanCpf)
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .role(Role.USER)
                .city(normalizeCity(dto.getCity()))
                .build();
        userRepository.save(user);

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .build();
        String token = jwtService.generateToken(userDetails);

        return new AuthResponseDTO(token, toUserDTO(user));
    }

    public AuthResponseDTO login(String email, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));
        SecurityContextHolder.clearContext();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .build();
        String token = jwtService.generateToken(userDetails);
        return new AuthResponseDTO(token, toUserDTO(user));
    }

    /**
     * Atualiza o próprio perfil: nome, cidade de atuação e (opcionalmente) senha.
     *
     * Regras:
     * - E-mail/CPF/cargo NÃO são alteráveis por aqui (cargo só via painel RBAC).
     * - Trocar a senha exige a senha atual correta e a nova com >= 6 caracteres.
     * - Cidade vazia limpa o campo (null) — a cidade só afeta o RBAC de gestão,
     *   nunca a possibilidade de registrar pontos (geofence de 500 m).
     */
    @Transactional
    public UserDTO updateProfile(UserDetails userDetails, UpdateProfileRequestDTO dto) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        String newPassword = dto.getNewPassword();
        if (newPassword != null && !newPassword.isBlank()) {
            if (newPassword.length() < 6) {
                throw new IllegalArgumentException("A nova senha deve ter no mínimo 6 caracteres");
            }
            if (dto.getCurrentPassword() == null || dto.getCurrentPassword().isBlank()) {
                throw new IllegalArgumentException("Informe a senha atual para definir uma nova senha");
            }
            if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPasswordHash())) {
                throw new ForbiddenOperationException("Senha atual incorreta");
            }
            user.setPasswordHash(passwordEncoder.encode(newPassword));
        }

        user.setFullName(dto.getFullName().trim());
        user.setCity(normalizeCity(dto.getCity()));
        userRepository.save(user);

        return toUserDTO(user);
    }

    private UserDTO toUserDTO(User user) {
        return new UserDTO(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.getCity(),
                user.getCreatedAt()
        );
    }

    /** Trim + colapso de espaços; vira null quando vazio (cidade é opcional). */
    private String normalizeCity(String city) {
        if (city == null) return null;
        String normalized = city.trim().replaceAll("\\s+", " ");
        return normalized.isEmpty() ? null : normalized;
    }
}
