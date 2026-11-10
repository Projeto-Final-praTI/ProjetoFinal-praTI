package com.zelo.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * Formato padrão de erro retornado pela API.
 */
@Schema(description = "Formato padrão de erro devolvido pela API (4xx e 5xx).")
public class ErrorResponseDTO {

    @Schema(description = "Momento em que o erro ocorreu.", example = "2026-10-21T12:00:00")
    private LocalDateTime timestamp;

    @Schema(description = "Código HTTP.", example = "400")
    private int status;

    @Schema(description = "Motivo HTTP.", example = "Bad Request")
    private String error;

    @Schema(description = "Mensagem legível com o detalhe do erro.", example = "email: E-mail inválido")
    private String message;

    @Schema(description = "Caminho da requisição que falhou.", example = "/api/auth/login")
    private String path;

    public ErrorResponseDTO() {
    }

    public ErrorResponseDTO(LocalDateTime timestamp, int status, String error, String message, String path) {
        this.timestamp = timestamp;
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
    }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
}
