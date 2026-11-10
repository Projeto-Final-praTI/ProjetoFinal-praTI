package com.zelo.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuração de segurança: rotas públicas, RBAC, CORS, sessão stateless e codificação de senhas.
 */
@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Origens permitidas por CORS, configuráveis (application.yml →
     * app.cors.allowed-origins, separadas por vírgula). Necessário porque
     * atrás de nginx/tunnel o backend vê a requisição como http:// (interno),
     * então o navegador NÃO é reconhecido como same-origin e o Spring aplica
     * a checagem de CORS em todo POST (browsers enviam header Origin sempre).
     */
    private final List<String> allowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          @Value("${app.cors.allowed-origins:http://localhost:5173,https://zelo.apps.log.br}")
                          String allowedOrigins) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        // Imagens de evidência são públicas (senão dão 403 "acesso negado")
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        // Documentação da API (Swagger UI em /docs + JSON OpenAPI).
                        // Precisa ser pública para os colegas conseguirem abrir a
                        // documentação; o conteúdo é apenas metadados da API.
                        .requestMatchers("/docs", "/docs/**").permitAll()
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**").permitAll()
                        .requestMatchers("/v3/api-docs", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/webjars/**").permitAll()
                        // Painel administrativo RBAC: só gestores e root.
                        // Escopo por cidade (gestor só vê a própria) é validado no AdminService.
                        .requestMatchers("/api/admin/**").hasAnyRole("ROOT", "GESTOR")
                        // Moderação de denúncias de pessoa desaparecida:
                        // fiscal/gestor/root. O escopo por cidade é validado no service.
                        .requestMatchers("/api/moderation/**").hasAnyRole("ROOT", "GESTOR", "FISCAL")
                        // Envio de denúncia + comentários: qualquer usuário autenticado.
                        .requestMatchers("/api/missing-alerts/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/incidents").authenticated()
                        // Inclui PUT /api/incidents/{id}/status (RBAC de papel/cidade no service)
                        .requestMatchers("/api/incidents/**").authenticated()
                        .anyRequest().authenticated()
                )
                // Requisição sem autenticação válida em rota protegida → 401
                // (em vez de 403). Assim o frontend distingue "token expirado/
                // inválido" (encerra a sessão) de "sem permissão" (RBAC).
                .exceptionHandling(ex -> ex.authenticationEntryPoint(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
