package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Dados de cadastro de um novo usuário.
 */
@Schema(description = "Dados do cadastro de um novo cidadão.")
public class RegisterRequestDTO {

    @Schema(description = "Nome completo do usuário (até 150 caracteres).", example = "Maria Silva")
    @NotBlank(message = "Nome completo é obrigatório")
    @Size(max = 150, message = "Nome completo deve ter no máximo 150 caracteres")
    private String fullName;

    @Schema(description = "E-mail de acesso (único no sistema).", example = "maria@exemplo.com")
    @NotBlank(message = "E-mail é obrigatório")
    @Email(message = "E-mail inválido")
    private String email;

    @Schema(description = "CPF do usuário (único). Aceita com ou sem máscara — o backend normaliza para apenas dígitos.",
            example = "123.456.789-00")
    @NotBlank(message = "CPF é obrigatório")
    @Pattern(regexp = "\\d{3}\\.?\\d{3}\\.?\\d{3}\\-?\\d{2}|\\d{11}", message = "CPF inválido")
    private String cpf;

    @Schema(description = "Senha de acesso (mínimo de 6 caracteres).", example = "senha123", minLength = 6, format = "password")
    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    private String password;

    /**
     * Cidade/município do usuário (opcional). Identifica a área de atuação no
     * RBAC — GESTOR/FISCAL operam apenas na sua cidade. Não afeta a criação
     * de incidentes (que é por geofence, independente do perfil).
     */
    @Schema(description = "Cidade/município de atuação (opcional). Só tem efeito no RBAC (gestor/fiscal operam na própria cidade).",
            example = "São Paulo")
    private String city;

    // Getters e Setters
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
}
