package com.zelo.backend.controller;

import com.zelo.backend.dto.AuthResponseDTO;
import com.zelo.backend.dto.ErrorResponseDTO;
import com.zelo.backend.dto.LoginRequestDTO;
import com.zelo.backend.dto.RegisterRequestDTO;
import com.zelo.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Autenticação e cadastro.
 *
 * <p>Endpoints **públicos** (não exigem token). O token JWT devolvido aqui é
 * o mesmo que deve ser enviado no header `Authorization: Bearer &lt;token&gt;`
 * em todas as demais rotas.
 */
@Tag(name = "1. Autenticação",
        description = "Cadastro de novos usuários e login. Ambos os endpoints são públicos e devolvem o token JWT usado nas demais chamadas.")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(
            summary = "Criar conta",
            description = """
                    Registra um novo **cidadão** (`role = USER`) e já devolve a sessão iniciada
                    (token JWT + dados do usuário), dispensando um login logo em seguida.

                    Regras:
                    * e-mail e CPF são únicos no sistema (CPF é normalizado para apenas dígitos);
                    * a senha precisa ter no mínimo 6 caracteres;
                    * `city` é **opcional** — só passa a valer para quem for promovido a
                      fiscal/gestor depois (escopo do RBAC). Ela **não** restringe o
                      registro de pontos críticos, que é por geofence (500 m).
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Dados da nova conta.",
                    required = true,
                    content = @Content(schema = @Schema(implementation = RegisterRequestDTO.class))))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Conta criada. Retorna o token JWT e os dados do usuário.",
                    content = @Content(schema = @Schema(implementation = AuthResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos (CPF/e-mail/senha) ou e-mail/CPF já cadastrado.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @SecurityRequirements // endpoint público: sem cadeado na UI
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterRequestDTO dto) {
        return ResponseEntity.ok(authService.register(dto));
    }

    @Operation(
            summary = "Entrar na conta",
            description = """
                    Autentica e devolve o **token JWT** (validade de 24 h) junto com os
                    dados do usuário (id, nome, e-mail, papel e cidade).

                    Use o campo `token` da resposta no botão **Authorize** do Swagger UI
                    ou no header `Authorization: Bearer <token>` dos seus clientes.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Credenciais.",
                    required = true,
                    content = @Content(schema = @Schema(implementation = LoginRequestDTO.class))))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login efetuado. Retorna o token JWT.",
                    content = @Content(schema = @Schema(implementation = AuthResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "E-mail ou senha inválidos.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "Credenciais não conferem.",
                    content = @Content(schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    @SecurityRequirements // endpoint público: sem cadeado na UI
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
        return ResponseEntity.ok(authService.login(dto.getEmail(), dto.getPassword()));
    }
}
