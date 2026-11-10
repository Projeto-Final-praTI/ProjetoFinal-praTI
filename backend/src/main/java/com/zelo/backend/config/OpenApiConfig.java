package com.zelo.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Metadados da documentação OpenAPI da API ZELO.
 *
 * A UI do Swagger (publicada em {@code /docs}) é montada a partir deste bean:
 * título, descrição, contato, servidores e o esquema de segurança JWT.
 *
 * <p>As anotações {@code @Tag}/{@code @Operation} ficam nos controllers e o
 * {@code @Schema} nos DTOs — a descrição abaixo é a "capa" da documentação.
 */
@Configuration
public class OpenApiConfig {

    /** Nome do esquema de segurança usado no botão "Authorize" do Swagger UI. */
    public static final String SECURITY_SCHEME = "bearerAuth";

    /**
     * Texto de capa da documentação (markdown). Aparece na tela inicial do
     * Swagger UI, logo abaixo do título.
     */
    private static final String DESCRIPTION = """
            API REST da plataforma **ZELO** — monitoramento colaborativo de
            infraestrutura urbana com alertas climáticos em tempo real.

            Todas as respostas são JSON, exceto o registro de ponto crítico
            (`POST /api/incidents`), que é `multipart/form-data`.

            ---

            ## 🔐 Autenticação

            A API usa **JWT (Bearer)**. Não há cookie de sessão: o cliente
            guarda o token e o envia em cada requisição.

            1. Faça `POST /api/auth/login` (ou `POST /api/auth/register`) e
               copie o campo `token` da resposta.
            2. Clique em **Authorize** no topo do Swagger UI, cole o token no
               campo e confirme.
            3. Todas as requisições passarão a enviar
               `Authorization: Bearer <token>`.

            O token expira em **24 h**. Para renovar, basta fazer login de novo.

            > O Swagger UI guarda o token no navegador (`persistAuthorization`),
            > então ele continua válido entre abas da mesma máquina.

            ---

            ## 👥 Papéis (RBAC)

            | Papel | O que pode fazer |
            |---|---|
            | `USER` | Cadastrar-se, registrar pontos críticos, comentar e confirmar (*upvote*). |
            | `FISCAL` | Tudo do `USER` **+** alterar status/notas dos pontos da **própria cidade**. |
            | `GESTOR` | Tudo do `FISCAL` **+** ver todos os pontos da **própria cidade** e promover/rebaixar cidadãos dentro dela (`USER` ⇄ `FISCAL`). |
            | `ROOT` | Acesso irrestrito: todas as cidades, painel global, gestão de cargos e exclusão de usuários. |

            O escopo por cidade usa o campo `city` do usuário. **Cidade vazia
            significa "sem cidade"** — e um gestor sem cidade não consegue
            operar (a API responde `403`).

            ---

            ## ⚠️ Formato dos erros

            Toda falha (4xx/5xx) devolve o mesmo formato:

            ```json
            {
              "timestamp": "2026-10-21T12:00:00",
              "status": 400,
              "error": "Bad Request",
              "message": "email: E-mail inválido",
              "path": "/api/auth/login"
            }
            ```

            | Código | Quando acontece |
            |---|---|
            | `400` | Validação de entrada (CPF/e-mail/senha/campos obrigatórios) ou regra de negócio simples. |
            | `401` | Token ausente, expirado ou inválido. |
            | `403` | Papel insuficiente ou ação fora do escopo (cidade/autor). |
            | `404` | Recurso inexistente. |
            | `422` | Você está a mais de **500 m** do local do problema. |
            | `500` | Erro inesperado (detalhe no log do servidor). |

            ---

            ## 📏 Convenções

            * **Coordenadas** — `lat`/`lng` em graus decimais (WGS84). Ex.: `-23.5505, -46.6333`.
            * **Categorias** — `BURACO`, `PONTE_QUEBRADA`, `ALAGAMENTO`, `QUEDA_ARVORE`, `DESLIZAMENTO`, `OUTROS`.
            * **Status** — `ABERTO`, `EM_ATENDIMENTO`, `RESOLVIDO`.
            * **Severidade de alerta** — `AMARELO`, `LARANJA`, `VERMELHO`.
            * **Datas** — ISO-8601 com deslocamento (`2026-10-21T12:00:00-03:00`).
            * **Imagens** — até 10 MB por arquivo; o limite total da requisição é 30 MB.
            * **LGPD** — `cpf` e `passwordHash` **nunca** são expostos nas respostas.
            """;

    @Bean
    public OpenAPI zeloOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("ZELO API")
                        .version("1.0.0")
                        .description(DESCRIPTION)
                        .summary("API da plataforma ZELO: pontos críticos, RBAC e alertas climáticos")
                        .contact(new Contact()
                                .name("Equipe ZELO")
                                .email("tecnologia@zelo.local")
                                .url("https://zelo.apps.log.br"))
                        .license(new License()
                                .name("Uso interno — projeto ZELO")
                                .url("https://zelo.apps.log.br")))
                .servers(List.of(
                        new Server()
                                .url("/")
                                .description("Servidor atual (URL relativa — funciona atrás do proxy nginx)"),
                        new Server()
                                .url("http://localhost:8080")
                                .description("Backend local (desenvolvimento)"),
                        new Server()
                                .url("https://zelo.apps.log.br")
                                .description("Produção")))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("""
                                        Token JWT obtido em `POST /api/auth/login` ou
                                        `POST /api/auth/register`.

                                        Cole **apenas o token**, sem o prefixo `Bearer ` —
                                        o próprio Swagger UI adiciona o prefixo.

                                        Validade: 24 horas.
                                        """)));
    }
}
