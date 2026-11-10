package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Resposta de autenticação: token JWT e dados do usuário autenticado.
 */
@Schema(description = "Resposta de autenticação: o token JWT e os dados do usuário que acabou de entrar.")
public class AuthResponseDTO {

    @Schema(description = "Token JWT para o header `Authorization: Bearer <token>`. Validade de 24 h.",
            example = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJqb2huQGZvb28uY29tIn0...")
    private String token;

    @Schema(description = "Dados do usuário autenticado (sem CPF e sem hash de senha — LGPD).")
    private UserDTO user;

    public AuthResponseDTO() {
    }

    public AuthResponseDTO(String token, UserDTO user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public UserDTO getUser() { return user; }
    public void setUser(UserDTO user) { this.user = user; }
}
