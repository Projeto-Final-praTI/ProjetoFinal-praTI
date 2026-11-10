package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Credenciais de login.
 */
@Schema(description = "Credenciais de login.")
public class LoginRequestDTO {

    @Schema(description = "E-mail cadastrado.", example = "cidadao@exemplo.com")
    @NotBlank(message = "E-mail é obrigatório")
    @Email(message = "E-mail inválido")
    private String email;

    @Schema(description = "Senha da conta.", example = "senha123", format = "password")
    @NotBlank(message = "Senha é obrigatória")
    private String password;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
