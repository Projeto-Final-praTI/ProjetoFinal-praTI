package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO público do usuário. NUNCA expõe cpf nem passwordHash (LGPD).
 */
@Schema(description = "Dados públicos de um usuário. CPF e senha nunca são expostos (LGPD).")
public class UserDTO {

    @Schema(description = "Identificador único do usuário (UUID).", example = "b7142b61-f6c9-4552-9f1a-286a7444b220")
    private UUID id;

    @Schema(description = "Nome completo.", example = "Maria Silva")
    private String fullName;

    @Schema(description = "E-mail de acesso.", example = "maria@exemplo.com")
    private String email;

    @Schema(description = "Papel (RBAC).",
            allowableValues = {"USER", "FISCAL", "GESTOR", "ROOT"}, example = "USER")
    private String role;

    @Schema(description = "Cidade/município de atuação. `null` quando não definida.", example = "São Paulo")
    private String city;

    @Schema(description = "Data de criação da conta (ISO-8601 com deslocamento).", example = "2026-10-21T06:04:05.187817-03:00")
    private OffsetDateTime createdAt;

    public UserDTO() {
    }

    public UserDTO(UUID id, String fullName, String email, String role, OffsetDateTime createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.createdAt = createdAt;
    }

    public UserDTO(UUID id, String fullName, String email, String role, String city, OffsetDateTime createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.city = city;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
