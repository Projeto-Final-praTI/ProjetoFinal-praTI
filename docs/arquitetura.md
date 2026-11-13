# Arquitetura

## 1. Visão geral

A ZELO é uma aplicação web dividida em três blocos principais:

- **Frontend SPA** em React/TypeScript, servido como arquivos estáticos.
- **Backend REST** em Spring Boot, responsável por regras de negócio,
  autenticação e persistência.
- **PostgreSQL + PostGIS**, responsável pelos dados relacionais e geoespaciais.

O frontend conversa com o backend por HTTP/JSON em `/api`. Em produção, um proxy
reverso (nginx) serve o SPA, encaminha `/api` e `/uploads` para o backend e
garante o fallback de rotas do React.

```mermaid
flowchart LR
    U[Usuário<br/>navegador] -->|HTTPS| N[nginx / proxy reverso]
    N -->|arquivos estáticos| F[Frontend React SPA]
    N -->|/api| B[Backend Spring Boot]
    N -->|/uploads| B
    B -->|JPA / PostGIS| D[(PostgreSQL + PostGIS)]
    B -->|previsão horária| OM[Open-Meteo]
    B -->|geocodificação reversa| NM[Nominatim / OSM]
    B -->|arquivos locais| S[(Storage de imagens)]
```

## 2. Componentes

| Componente | Responsabilidade |
|------------|------------------|
| **Frontend** | Interface, mapa, formulários, modais, roteamento e estado da sessão |
| **nginx** | Entrega do SPA, fallback de rotas, proxy de API/uploads e limite de upload |
| **Backend** | API REST, RBAC, validações, regras de negócio e integrações externas |
| **PostgreSQL/PostGIS** | Persistência relacional e consultas por proximidade |
| **Storage local** | Imagens de ocorrências e fotos de desaparecidos |
| **Open-Meteo** | Fonte da previsão horária usada pelo motor de alertas |
| **Nominatim** | Geocodificação reversa de coordenada para município |
| **GitHub Actions** | Build e publicação do frontend (GitHub Pages) |

## 3. Arquitetura do frontend

O frontend segue uma organização por responsabilidade:

```
src/
├─ api.ts          # cliente Axios + endpoints
├─ types.ts        # DTOs compartilhados
├─ router.ts       # rotas com History API
├─ App.tsx         # estado global e orquestração
├─ components/     # telas e componentes
├─ hooks/          # comportamentos reutilizáveis
└─ services/       # integrações externas (IBGE)
```

Características:

- **Mapa como tela-base:** os demais painéis são overlays derivados da rota.
- **Estado centralizado em `App.tsx`:** sessão, dados do mapa, filtros e modais.
- **Roteamento sem dependência extra:** `pushState`/`popstate` com fallback para
  `/` e navegação `back()`.
- **Tema centralizado:** Tailwind com paleta ZELO e classes compartilhadas em
  `index.css`.
- **Camadas de z-index documentadas:** evitam conflito com o Leaflet.

Detalhes em [frontend.md](frontend.md).

## 4. Arquitetura do backend

O backend segue a separação em camadas do Spring Boot:

```mermaid
flowchart TB
    C[Controller<br/>rotas + validação] --> S[Service<br/>regras + RBAC]
    S --> R[Repository<br/>JPA + PostGIS]
    R --> DB[(PostgreSQL)]
    S --> X[Integrações<br/>Open-Meteo / Nominatim]
    S --> ST[Storage<br/>uploads locais]
    C --> DTO[DTOs de entrada/saída]
```

| Camada | Conteúdo |
|--------|----------|
| `controller` | Endpoints REST, validação de entrada e anotações OpenAPI |
| `service` | Regras de negócio, RBAC por cidade, integrações e transações |
| `repository` | Consultas JPA e consultas espaciais |
| `entity` | Modelo de domínio persistido |
| `dto` | Contratos de entrada/saída (entidades não são expostas) |
| `config` | Segurança, JWT, CORS, OpenAPI, storage e inicialização |
| `exception` | Exceções de domínio e tratamento centralizado |

Detalhes em [backend.md](backend.md).

## 5. Fluxos principais

### 5.1 Registro de ponto crítico

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant B as Backend
    participant G as Nominatim
    participant D as PostgreSQL

    U->>F: clica no mapa e envia formulário + imagens
    F->>B: POST /api/incidents (multipart)
    B->>B: valida JWT, campos e geofence de 500 m
    alt cidade ausente
        B->>G: geocodificação reversa
        G-->>B: município
    end
    B->>D: salva incidente, imagens e histórico inicial
    B-->>F: 201 com o incidente
    F->>F: fecha formulário e recarrega o mapa
```

### 5.2 Consulta de alertas

```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    participant OM as Open-Meteo
    participant D as PostgreSQL

    F->>B: GET /api/public/alerts?lat&lng
    B->>OM: previsão horária
    OM-->>B: dados de chuva, temperatura e vento
    B->>B: aplica regras de severidade
    B->>D: consulta alertas oficiais ativos
    B-->>F: clima atual + alertas
    F->>F: monta o banner por prioridade
```

### 5.3 Moderação de pessoa desaparecida

```mermaid
sequenceDiagram
    participant C as Cidadão
    participant B as Backend
    participant M as Moderador
    participant P as Público

    C->>B: POST /api/missing-alerts (foto + dados)
    B->>B: cria PENDENTE + pré-alerta 1 km/10 min
    M->>B: GET /api/moderation/missing-alerts
    B-->>M: denúncias da cidade
    M->>B: POST /{id}/approve (duração + raio)
    B->>B: status APROVADO + expiração
    P->>B: GET /api/public/missing-alerts?lat&lng
    B-->>P: alertas aprovados e não expirados
```

## 6. Implantação

### 6.1 Containers

```mermaid
flowchart LR
    subgraph Docker
        N[nginx :80]
        B[backend :8080]
        D[(postgres :5432)]
        N -->|/api e /uploads| B
        B --> D
    end
    U[Usuário] -->|HTTP/HTTPS| N
```

- O frontend é compilado em um estágio Node e servido pelo nginx.
- O backend é compilado com Maven e executado em JRE 21 com usuário não-root.
- O banco usa a imagem PostGIS e volume persistente.
- O `nginx.conf` faz `try_files ... /index.html` para as rotas do React.

### 6.2 GitHub Pages

O workflow `.github/workflows/deploy.yml` compila o frontend e publica `dist/` no
GitHub Pages a cada push na `main`.

> **Atenção:** GitHub Pages não aplica fallback de SPA. Links diretos como
> `/login` podem retornar 404 nesse ambiente. Para suportar todas as rotas, use
> a implantação com nginx/Docker ou adicione um `404.html` que redirecione para
> `index.html`.

## 7. Decisões arquiteturais

As principais decisões estão registradas em
[decisoes-tecnicas.md](decisoes-tecnicas.md). Resumo:

- SPA React + TypeScript com Vite.
- Tailwind CSS com paleta customizada.
- Leaflet para mapa e clusters.
- Roteador próprio com History API.
- Axios com interceptors para JWT e tratamento de 401.
- Spring Boot 3.3 + Java 21.
- PostgreSQL + PostGIS para geolocalização.
- JWT stateless e BCrypt.
- Armazenamento local de imagens com URLs relativas.
- OpenAPI/Swagger para documentação viva da API.
- Docker multi-stage para frontend e backend.

## 8. Limitações e evoluções recomendadas

| Limitação | Evolução recomendada |
|-----------|----------------------|
| Schema criado por `ddl-auto=update` | Adotar Flyway ou Liquibase |
| Storage local de imagens | Migrar para object storage (S3/MinIO) |
| Sem testes automatizados no backend | Criar testes de integração com Testcontainers |
| Sem notificações push | Adicionar Web Push ou e-mail |
| Sem rate limiting explícito | Adicionar limite por IP/usuário no gateway |
| GitHub Pages sem fallback de SPA | Usar nginx ou configurar `404.html` |
