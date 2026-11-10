package com.zelo.backend.controller;

import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Publica a documentação interativa da API em {@code /docs}.
 *
 * <p>O Swagger UI em si é servido pelo springdoc em
 * {@code /swagger-ui/index.html}; este controller existe para que a URL
 * oficial do projeto continue sendo {@code /docs} — inclusive quando o
 * backend é acessado direto (dev), sem passar pelo nginx.
 *
 * <p>Através do nginx o acesso a {@code /docs} é reescrito internamente para
 * {@code /swagger-ui/index.html}, de modo que o endereço na barra do navegador
 * permanece {@code /docs}.
 */
@Controller
@Hidden // não documenta o próprio redirecionamento na UI
public class DocsController {

    /** Caminho da UI do Swagger UI servida pelo springdoc. */
    private static final String SWAGGER_UI_PATH = "/swagger-ui/index.html";

    /** URL do descritor OpenAPI (JSON) consumido pela UI. */
    private static final String CONFIG_URL = "/v3/api-docs/swagger-config";

    /**
     * Redireciona {@code /docs} para a interface do Swagger UI.
     *
     * @return redirecionamento (302) para a UI com a URL do OpenAPI anexada.
     */
    @GetMapping(value = {"/docs", "/docs/"})
    public ResponseEntity<Void> docs() {
        return ResponseEntity.status(302)
                .header(HttpHeaders.LOCATION, SWAGGER_UI_PATH + "?configUrl=" + CONFIG_URL)
                .build();
    }
}
