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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private RegisterRequestDTO registerDto;

    @BeforeEach
    void setUp() {
        registerDto = new RegisterRequestDTO();
        registerDto.setFullName("Maria Silva");
        registerDto.setEmail("maria@exemplo.com");
        registerDto.setCpf("123.456.789-00");
        registerDto.setPassword("senha123");
        registerDto.setCity(" São Paulo ");
    }

    @Test
    void register_shouldCreateUserAndReturnToken() {
        when(userRepository.existsByEmail("maria@exemplo.com")).thenReturn(false);
        when(userRepository.existsByCpf("12345678900")).thenReturn(false);
        when(passwordEncoder.encode("senha123")).thenReturn("hash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            u.setCreatedAt(LocalDateTime.now());
            return u;
        });
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("jwt-token");

        AuthResponseDTO response = authService.register(registerDto);

        assertEquals("jwt-token", response.getToken());
        assertNotNull(response.getUser());
        assertEquals("Maria Silva", response.getUser().getFullName());
        assertEquals("maria@exemplo.com", response.getUser().getEmail());
        assertEquals("USER", response.getUser().getRole());
        assertEquals("São Paulo", response.getUser().getCity());
        verify(userRepository).save(any(User.class));
        verify(passwordEncoder).encode("senha123");
    }

    @Test
    void register_shouldRejectDuplicateEmail() {
        when(userRepository.existsByEmail("maria@exemplo.com")).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> authService.register(registerDto));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldRejectDuplicateCpf() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByCpf("12345678900")).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> authService.register(registerDto));
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_shouldAuthenticateAndReturnToken() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .fullName("Maria Silva")
                .email("maria@exemplo.com")
                .cpf("12345678900")
                .passwordHash("hash")
                .role(Role.USER)
                .city("São Paulo")
                .createdAt(LocalDateTime.now())
                .build();
        when(userRepository.findByEmail("maria@exemplo.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("jwt-token");

        AuthResponseDTO response = authService.login("maria@exemplo.com", "senha123");

        assertEquals("jwt-token", response.getToken());
        assertEquals("maria@exemplo.com", response.getUser().getEmail());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_shouldFailWhenUserNotFoundAfterAuth() {
        when(userRepository.findByEmail("ghost@exemplo.com")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> authService.login("ghost@exemplo.com", "x"));
    }

    @Test
    void updateProfile_shouldUpdateNameCityAndPassword() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .fullName("Antigo")
                .email("maria@exemplo.com")
                .cpf("12345678900")
                .passwordHash("old-hash")
                .role(Role.USER)
                .city("Campinas")
                .createdAt(LocalDateTime.now())
                .build();
        when(userRepository.findByEmail("maria@exemplo.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("senha123", "old-hash")).thenReturn(true);
        when(passwordEncoder.encode("novaSenha1")).thenReturn("new-hash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateProfileRequestDTO dto = new UpdateProfileRequestDTO();
        dto.setFullName("  Maria Nova  ");
        dto.setCity("  Rio  de  Janeiro ");
        dto.setCurrentPassword("senha123");
        dto.setNewPassword("novaSenha1");

        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername("maria@exemplo.com").password("x").roles("USER").build();

        UserDTO updated = authService.updateProfile(principal, dto);

        assertEquals("Maria Nova", updated.getFullName());
        assertEquals("Rio de Janeiro", updated.getCity());
        assertEquals("new-hash", user.getPasswordHash());
    }

    @Test
    void updateProfile_shouldRejectWrongCurrentPassword() {
        User user = User.builder()
                .id(UUID.randomUUID()).fullName("Maria").email("maria@exemplo.com")
                .cpf("1").passwordHash("old-hash").role(Role.USER).createdAt(LocalDateTime.now()).build();
        when(userRepository.findByEmail("maria@exemplo.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("errada", "old-hash")).thenReturn(false);

        UpdateProfileRequestDTO dto = new UpdateProfileRequestDTO();
        dto.setFullName("Maria");
        dto.setCurrentPassword("errada");
        dto.setNewPassword("novaSenha1");
        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername("maria@exemplo.com").password("x").roles("USER").build();

        assertThrows(ForbiddenOperationException.class, () -> authService.updateProfile(principal, dto));
    }

    @Test
    void updateProfile_shouldRejectShortNewPassword() {
        User user = User.builder()
                .id(UUID.randomUUID()).fullName("Maria").email("maria@exemplo.com")
                .cpf("1").passwordHash("old-hash").role(Role.USER).createdAt(LocalDateTime.now()).build();
        when(userRepository.findByEmail("maria@exemplo.com")).thenReturn(Optional.of(user));

        UpdateProfileRequestDTO dto = new UpdateProfileRequestDTO();
        dto.setFullName("Maria");
        dto.setCurrentPassword("senha123");
        dto.setNewPassword("123");
        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername("maria@exemplo.com").password("x").roles("USER").build();

        assertThrows(IllegalArgumentException.class, () -> authService.updateProfile(principal, dto));
    }
}
