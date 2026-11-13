# Backend

API REST da ZELO em **Spring Boot 3.3 / Java 21**, responsável por autenticação,
regras de negócio, persistência geoespacial e integrações externas.

---

## 1. Stack

| Camada | Tecnologia |
|--------|------------|
| Linguagem | Java 21 |
| Framework | Spring Boot 3.3.4 (Spring MVC) |
| Persistência | Spring Data JPA / Hibernate 6 |
| Banco | PostgreSQL + PostGIS |
| Segurança | Spring Security + JWT (`jjwt` 0.12.3) |
| Validação | Jakarta Bean Validation |
| Geoespacial | Hibernate Spatial / JTS |
| Documentação | springdoc-openapi (Swagger UI) |
| Build | Maven 3.9+ |
| Container | Docker multi-stage |

---

## 2. Camadas

```
Controller  →  Service  →  Repository  →  PostgreSQL/PostGIS
     │            │
     │            └── integrações externas (Open-Meteo, Nominatim)
     └── DTOs + Bean Validation
```

| Pacote | Conteúdo |
|--------|----------|
| `controller` | Endpoints REST, validação de entrada e anotações OpenAPI |
| `service` | Regras de negócio, RBAC por cidade, transações e integrações |
| `repository` | Consultas JPA e consultas espaciais |
| `entity` | Modelo de domínio persistido |
| `dto` | Contratos de entrada/saída; entidades não são expostas |
| `config` | Segurança, JWT, CORS, OpenAPI, storage e inicialização |
| `exception` | Exceções de domínio e tratamento centralizado |

### Serviços

| Serviço | Responsabilidade |
|---------|------------------|
| `AuthService` | Cadastro, login, atualização de perfil e regras de senha |
| `JwtService` | Geração e validação de tokens |
| `UserDetailsServiceImpl` | Carrega o usuário para o Spring Security |
| `IncidentService` | Pontos críticos, geofence, upvote, status e exclusão |
| `MissingPersonService` | Denúncias, pré-alerta, moderação e comentários |
| `WeatherAlertService` | Motor de alertas climáticos e alertas oficiais |
| `ReverseGeocodingService` | Coordenada → município via Nominatim |
| `StorageService` | Gravação e URL pública das imagens |
| `AdminService` | Usuários, cargos, estatísticas e exclusões administrativas |

### Controllers

`AuthController`, `UserController`, `IncidentController`, `AdminAlertController`,
`AdminRestController`, `MissingPersonController`,
`MissingPersonModerationController` e `DocsController`.

---

## 3. Segurança

- API **stateless**: sem sessão em cookie; o token JWT é enviado no header
  `Authorization: Bearer <token>`.
- Senhas com **BCrypt**.
- `cpf` e `passwordHash` nunca são serializados nas respostas.
- Rotas públicas: `/api/auth/**`, `/api/public/**`, `/uploads/**`, `/docs`,
  `/swagger-ui/**`, `/v3/api-docs/**`.
- Rotas administrativas exigem `ROOT` ou `GESTOR`; moderação aceita `FISCAL`,
  `GESTOR` ou `ROOT`.
- O escopo por cidade é validado no serviço, não apenas no controller.
- CORS restrito a `APP_CORS_ALLOWEDORIGINS`.

### Papéis

| Papel | Permissões |
|-------|------------|
| `USER` | Cadastro, pontos, comentários e confirmações |
| `FISCAL` | Tudo de `USER` + status/notas dos pontos da própria cidade + moderação |
| `GESTOR` | Tudo de `FISCAL` + visão dos pontos da cidade, cargos `USER` ⇄ `FISCAL` e alertas locais |
| `ROOT` | Acesso irrestrito, estatísticas, cargos, exclusão de usuários e alertas globais |

Cidade vazia em fiscal/gestor impede operação municipal: a API responde `403`.

Detalhes de ameaças, dados pessoais e retenção em
[seguranca-e-lgpd.md](seguranca-e-lgpd.md).

---

## 4. Regras de negócio

### 4.1 Pontos críticos

- Categorias: `BURACO`, `PONTE_QUEBRADA`, `ALAGAMENTO`, `QUEDA_ARVORE`,
  `DESLIZAMENTO`, `OUTROS`.
- Status: `ABERTO`, `EM_ATENDIMENTO`, `RESOLVIDO`.
- O autor deve estar a no máximo **500 m** do local; caso contrário, `422` com a
  distância calculada.
- Pelo menos uma imagem é obrigatória (máximo de 5).
- A cidade é opcional: quando ausente, o backend tenta resolvê-la por
  geocodificação reversa. Se o serviço falhar, o ponto é gravado sem cidade — o
  registro nunca é bloqueado por isso.
- Upvote é **idempotente**: a constraint `UNIQUE (incident_id, user_id)` garante
  uma confirmação por usuário.
- A mudança de status grava uma entrada imutável em `incident_status_history` com
  autor, data e nota.
- Exclusão: autor, `ROOT` ou fiscal/gestor da cidade do ponto.

### 4.2 Alertas climáticos

Fonte: previsão horária do Open-Meteo. Regras padrão em
`application.yml → alerts.rules`:

| Condição | Limite | Severidade |
|----------|--------|------------|
| Chuva forte | ≥ 7 mm em 1 h | `LARANJA` |
| Chuva extrema | ≥ 20 mm em 1 h | `VERMELHO` |
| Acumulado de chuva | ≥ 60 mm em 24 h | `AMARELO` |
| Onda de calor | ≥ 35 °C em 24 h | `LARANJA` |
| Calor extremo | ≥ 38 °C em 24 h | `VERMELHO` |
| Frio/geada | ≤ 2 °C em 24 h | `AMARELO` |
| Ventos intensos | ≥ 60 km/h | `LARANJA` |
| Ventos fortes | ≥ 90 km/h | `VERMELHO` |

Os alertas são gerados em torno da coordenada consultada, usam `fingerprint` para
evitar duplicidade e expiram automaticamente.

### 4.3 Alertas oficiais

- Publicados por `GESTOR` ou `ROOT`.
- `GESTOR` força `scope = LOCAL` e usa a própria cidade.
- `ROOT` pode criar `GLOBAL` ou `LOCAL` em qualquer cidade.
- Duração: 5 a 10080 minutos (7 dias).
- Raio local: 1 a 200 km.
- Expiram automaticamente e podem ser removidos antes do prazo.

### 4.4 Pessoas desaparecidas

- Denúncia com foto obrigatória; nasce `PENDENTE`.
- Se a localização for informada, dispara **pré-alerta de 1 km por 10 min** antes
  da moderação.
- Fiscal/gestor/root aprovam ou recusam.
- Na aprovação: duração de 5 min a 7 dias e alcance `LOCAL` (1 a 200 km) ou
  `GLOBAL` (somente `ROOT`).
- Somente denúncias `APROVADO` e não expiradas aparecem publicamente.
- Comentários de avistamento aceitam imagem opcional.

### 4.5 Uploads

- Limite de 10 MB por arquivo e 30 MB por requisição.
- Imagens servidas em `/uploads/**`.
- URLs relativas por padrão; `PUBLIC_BASE_URL` permite fixar uma base absoluta.

---

## 5. Configuração

Configurações em `src/main/resources/application.yml`, sobrescritas por variáveis
de ambiente.

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `DB_URL` | `jdbc:postgresql://localhost:5432/zelo_db` | URL JDBC |
| `DB_USER` | `zelo_user` | Usuário do banco |
| `DB_PASSWORD` | `zelo_pass` | Senha do banco |
| `JPA_SHOW_SQL` | `false` | Exibe SQL no log |
| `STORAGE_LOCAL_PATH` | `./uploads` | Diretório das imagens |
| `PUBLIC_BASE_URL` | *(vazio)* | Base pública das imagens |
| `JWT_SECRET` | chave de desenvolvimento | Segredo HMAC (**trocar em produção**) |
| `JWT_EXPIRATION_MS` | `86400000` | Validade do token (24 h) |
| `APP_CORS_ALLOWEDORIGINS` | `http://localhost:5173,https://zelo.apps.log.br` | Origens CORS |
| `GEOCODING_BASE_URL` | `https://nominatim.openstreetmap.org` | Geocodificação reversa |
| `SERVER_PORT` | `8080` | Porta HTTP |
| `LOG_LEVEL_ZELO` | `INFO` | Nível de log |

> O `JWT_SECRET` deve ter pelo menos 32 bytes. Nunca versione o segredo real.

As integrações com Open-Meteo e Nominatim, incluindo URLs, limites, cache e
fallback, estão detalhadas em [apis-externas.md](apis-externas.md).

O schema é criado/atualizado por `spring.jpa.hibernate.ddl-auto=update`. Para
produção, recomenda-se substituir por Flyway ou Liquibase.

---

## 6. Formato de erro

```json
{
  "timestamp": "2026-11-09T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "email: E-mail inválido",
  "path": "/api/auth/login"
}
```

| Código | Quando ocorre |
|--------|---------------|
| `400` | Validação de entrada ou regra de negócio |
| `401` | Token ausente, expirado ou inválido |
| `403` | Papel insuficiente ou fora do escopo (cidade/autor) |
| `404` | Recurso inexistente |
| `422` | Autor a mais de 500 m do ponto |
| `500` | Erro inesperado (detalhe no log) |

O tratamento centralizado fica em `exception/GlobalExceptionHandler`.

---

## 7. Execução

```bash
cd backend
mvn spring-boot:run

# ou
mvn clean package
java -jar target/backend-1.0.0.jar
```

Requisitos: Java 21, Maven 3.9+ e PostgreSQL com PostGIS. O passo a passo completo
está em [instalacao.md](instalacao.md).

### Docker

```bash
docker build -t zelo-backend .

docker run --rm -p 8080:8080 \
  -e DB_URL="jdbc:postgresql://host.docker.internal:5432/zelo_db" \
  -e DB_USER=zelo_user \
  -e DB_PASSWORD=zelo_pass \
  -e JWT_SECRET="troque-por-um-segredo-forte-de-32-bytes" \
  -e APP_CORS_ALLOWEDORIGINS="http://localhost:5173" \
  -v "$(pwd)/uploads:/app/uploads" \
  zelo-backend
```

A imagem roda com usuário não-root (`zelo`, UID 1001) e `/app/uploads` com
permissão de escrita.

---

## 8. Documentação interativa

Com a API em execução:

- Swagger UI: `http://localhost:8080/docs`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

Para testar rotas protegidas: faça login, copie o `token` e use **Authorize**.

---

## 9. Estrutura

```
backend/
├── src/main/java/com/zelo/backend/
│   ├── ZeloApplication.java
│   ├── config/        # segurança, JWT, CORS, OpenAPI, storage
│   ├── controller/    # endpoints REST
│   ├── dto/           # contratos de entrada/saída
│   ├── entity/        # modelo de domínio
│   ├── exception/     # exceções e handler global
│   ├── repository/    # acesso a dados (JPA/PostGIS)
│   └── service/       # regras de negócio e integrações
├── src/main/resources/application.yml
├── Dockerfile
├── .dockerignore
├── .gitignore
└── pom.xml
```

---

## 10. Limitações conhecidas

- Sem migrações versionadas de schema.
- Sem testes automatizados de backend no repositório.
- Armazenamento local de imagens (não distribuído).
- Sem rate limiting explícito.
- Integrações externas sem cache persistente; falhas são tratadas de forma
  tolerante, mas reduzem a funcionalidade de alertas/geocodificação.
