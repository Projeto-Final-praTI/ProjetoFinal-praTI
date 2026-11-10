# ZELO — Backend

API REST da **ZELO**, plataforma colaborativa de monitoramento de infraestrutura
urbana e alertas climáticos. Cidadãos registram problemas da cidade (buracos,
alagamentos, quedas de árvore etc.) com foto e localização; fiscais e gestores
municipais acompanham e atualizam os pontos; a população recebe alertas
climáticos automáticos e alertas oficiais da gestão.

> Este diretório contém apenas o backend (Spring Boot). O front-end React e os
> scripts de banco ficam nas pastas `frontend/` e `database/` do repositório.

---

## Sumário

- [Visão geral](#visão-geral)
- [Principais recursos](#principais-recursos)
- [Stack tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Papéis e permissões (RBAC)](#papéis-e-permissões-rbac)
- [Regras de negócio](#regras-de-negócio)
- [Endpoints](#endpoints)
- [Configuração](#configuração)
- [Como executar](#como-executar)
- [Docker](#docker)
- [Documentação interativa](#documentação-interativa)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Formato de erro](#formato-de-erro)
- [Segurança e LGPD](#segurança-e-lgpd)

---

## Visão geral

O backend expõe uma API JSON stateless autenticada por **JWT** e usa
**PostgreSQL + PostGIS** para consultas geoespaciais (pontos próximos, raio de
abrangência de alertas e geofence de 500 m no registro de ocorrências).

Além do CRUD de pontos críticos, a API concentra:

- **Motor de alertas climáticos** — consulta a previsão horária do
  [Open-Meteo](https://open-meteo.com/) e gera alertas automáticos por regras de
  chuva, calor, frio e vento.
- **Alertas oficiais** — gestores e root publicam avisos com duração e alcance
  (global ou local).
- **Denúncias de pessoa desaparecida** — envio pela população, moderação por
  fiscal/gestor/root e comentários de avistamento.
- **Painel administrativo** — gestão de usuários, cargos, pontos críticos e
  indicadores, com escopo por cidade.

---

## Principais recursos

- Cadastro e login com token JWT (validade padrão de 24 h).
- Registro de pontos críticos com **uma ou mais fotos** e validação de
  proximidade (máximo 500 m entre autor e ocorrência).
- Mapa público de ocorrências próximas, com filtro por raio.
- Comentários e confirmações (*upvotes*) idempotentes.
- Linha do tempo de status (`ABERTO` → `EM_ATENDIMENTO` → `RESOLVIDO`).
- Moderação de denúncias de pessoa desaparecida com pré-alerta de 10 min / 1 km.
- Alertas climáticos automáticos e alertas oficiais com expiração automática.
- Armazenamento local das imagens, servidas em `/uploads/**`.
- Documentação OpenAPI/Swagger em `/docs`.

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Linguagem | Java 21 |
| Framework | Spring Boot 3.3.4 |
| Web | Spring MVC |
| Persistência | Spring Data JPA / Hibernate 6 |
| Banco | PostgreSQL + PostGIS |
| Segurança | Spring Security + JWT (`jjwt` 0.12.3) |
| Validação | Jakarta Bean Validation (Hibernate Validator) |
| Geoespacial | Hibernate Spatial / JTS |
| Documentação | springdoc-openapi (Swagger UI) |
| Build | Maven 3.9+ |
| Container | Docker (build multi-stage) |

---

## Arquitetura

O projeto segue a separação em camadas típica do Spring Boot:

```
Controller  →  Service  →  Repository  →  PostgreSQL/PostGIS
     │            │
     │            └── integrações externas (Open-Meteo, Nominatim)
     └── DTOs + Bean Validation
```

- **`controller`** — expõe as rotas, valida a entrada e documenta a API com
  anotações OpenAPI.
- **`service`** — concentra as regras de negócio, o RBAC por cidade e as
  integrações externas.
- **`repository`** — consultas JPA, incluindo consultas espaciais com PostGIS.
- **`entity`** — modelo de domínio persistido.
- **`dto`** — contratos de entrada/saída; entidades nunca são expostas
  diretamente.
- **`config`** — segurança, CORS, JWT, OpenAPI, armazenamento e inicialização.
- **`exception`** — exceções de domínio e tratamento centralizado de erros.

---

## Papéis e permissões (RBAC)

| Papel | Permissões |
|---|---|
| `USER` | Cadastro, registro de pontos, comentários e confirmações. |
| `FISCAL` | Tudo de `USER` + alterar status/notas dos pontos da **própria cidade**. |
| `GESTOR` | Tudo de `FISCAL` + ver todos os pontos da **própria cidade**, promover/rebaixar cidadãos (`USER` ⇄ `FISCAL`) e disparar alertas locais. |
| `ROOT` | Acesso irrestrito: todas as cidades, visão global, gestão de cargos/usuários e alertas globais. |

O escopo por cidade usa o campo `city` do usuário. **Cidade vazia significa
"sem cidade"**: um gestor ou fiscal sem cidade não consegue operar (a API
responde `403`).

---

## Regras de negócio

### Pontos críticos

- Categorias: `BURACO`, `PONTE_QUEBRADA`, `ALAGAMENTO`, `QUEDA_ARVORE`,
  `DESLIZAMENTO`, `OUTROS`.
- Status: `ABERTO`, `EM_ATENDIMENTO`, `RESOLVIDO`.
- O autor deve estar a no máximo **500 m** do local informado; caso contrário a
  API responde `422` com a distância calculada.
- A cidade é opcional: quando ausente, o backend tenta resolvê-la por
  geocodificação reversa (Nominatim/OpenStreetMap). Se a fonte falhar, o ponto é
  gravado sem cidade — o registro nunca é bloqueado por isso.
- As fotos são obrigatórias (pelo menos uma) e ficam em `storage.local-path`.

### Alertas climáticos

As regras padrão (configuráveis em `application.yml` → `alerts.rules`) são:

| Condição | Limite | Severidade |
|---|---|---|
| Chuva forte | ≥ 7 mm em 1 h | `LARANJA` |
| Chuva extrema | ≥ 20 mm em 1 h | `VERMELHO` |
| Acumulado de chuva | ≥ 60 mm em 24 h | `AMARELO` |
| Onda de calor | ≥ 35 °C em 24 h | `LARANJA` |
| Calor extremo | ≥ 38 °C em 24 h | `VERMELHO` |
| Frio/geada | ≤ 2 °C em 24 h | `AMARELO` |
| Ventos intensos | ≥ 60 km/h | `LARANJA` |
| Ventos fortes | ≥ 90 km/h | `VERMELHO` |

Os alertas são gerados em torno da coordenada consultada e expiram
automaticamente.

### Pessoa desaparecida

- O cidadão envia foto obrigatória + dados; a denúncia nasce `PENDENTE`.
- Se a localização do denunciante for informada, é disparado um **pré-alerta de
  10 minutos num raio de 1 km**, antes da moderação.
- Fiscal/gestor/root aprovam (`APROVADO`) ou recusam (`RECUSADO`).
- Na aprovação, o moderador define duração (5 min a 7 dias) e alcance:
  - `LOCAL`: raio padrão de 50 km (ajustável de 1 a 200 km) a partir do centro
    do município;
  - `GLOBAL`: todo o território (somente `ROOT`).
- Somente denúncias aprovadas e não expiradas aparecem publicamente.

### Uploads

- Limite de **10 MB por arquivo** e **30 MB por requisição**.
- Imagens servidas publicamente em `/uploads/**`.
- As URLs retornadas são relativas por padrão (`/uploads/...`), funcionando
  atrás de proxy, Docker e túnel. A base pública pode ser fixada com
  `PUBLIC_BASE_URL`.

---

## Endpoints

Legenda: 🔓 público · 🔒 autenticado · 👑 `ROOT` · 🏛️ `GESTOR` · 🧭 `FISCAL`

### Autenticação

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/register` | 🔓 | Cria conta `USER` e devolve o token. |
| `POST` | `/api/auth/login` | 🔓 | Autentica e devolve o token JWT. |

### Usuário

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `PUT` | `/api/users/me` | 🔒 | Atualiza nome, cidade e, opcionalmente, a senha. |

### Pontos críticos

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/incidents` | 🔒 | Registra ponto crítico (`multipart/form-data`: `data` + `images`). |
| `GET` | `/api/public/incidents` | 🔓 | Lista pontos próximos (`lat`, `lng`, `radiusMeters`). |
| `GET` | `/api/public/incidents/{id}` | 🔓 | Detalhe do ponto com autor, imagens e comentários. |
| `POST` | `/api/incidents/{id}/comments` | 🔒 | Comenta em um ponto. |
| `POST` | `/api/incidents/{id}/upvote` | 🔒 | Confirma o problema (idempotente). |
| `PUT` | `/api/incidents/{id}/status` | 🔒 | Altera status e registra nota (RBAC por cidade/autor). |
| `GET` | `/api/public/incidents/{id}/history` | 🔓 | Linha do tempo de status. |
| `DELETE` | `/api/incidents/{id}` | 🔒 | Exclui ponto (autor, root ou fiscal/gestor da cidade). |

### Alertas climáticos e oficiais

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/public/alerts` | 🔓 | Clima atual + alertas ativos (`lat`, `lng`). |
| `GET` | `/api/admin/alerts` | 🏛️/👑 | Lista alertas oficiais ativos. |
| `POST` | `/api/admin/alerts` | 🏛️/👑 | Dispara alerta oficial. |
| `DELETE` | `/api/admin/alerts/{id}` | 🏛️/👑 | Remove alerta oficial. |

### Pessoa desaparecida

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/missing-alerts` | 🔒 | Envia denúncia (`multipart/form-data`: `data` + `photo`). |
| `POST` | `/api/missing-alerts/{id}/comments` | 🔒 | Comenta/avistamento com imagem opcional. |
| `GET` | `/api/public/missing-alerts` | 🔓 | Lista alertas ativos próximos (`lat`, `lng`). |
| `GET` | `/api/public/missing-alerts/{id}` | 🔓 | Detalhe público da denúncia. |
| `GET` | `/api/moderation/missing-alerts` | 🧭/🏛️/👑 | Lista denúncias para moderação. |
| `POST` | `/api/moderation/missing-alerts/{id}/approve` | 🧭/🏛️/👑 | Aprova e dispara a denúncia. |
| `POST` | `/api/moderation/missing-alerts/{id}/reject` | 🧭/🏛️/👑 | Recusa a denúncia. |
| `DELETE` | `/api/moderation/missing-alerts/{id}` | 🧭/🏛️/👑 | Exclui a denúncia. |

### Painel administrativo

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/admin/users` | 🏛️/👑 | Lista usuários (`search`, `city`). |
| `PUT` | `/api/admin/users/{id}/role` | 🏛️/👑 | Altera cargo e/ou cidade. |
| `GET` | `/api/admin/incidents` | 🏛️/👑 | Lista pontos do escopo (`city`). |
| `GET` | `/api/admin/stats` | 👑 | Indicadores globais. |
| `DELETE` | `/api/admin/incidents/{id}` | 🏛️/👑 | Exclui ponto crítico. |
| `GET` | `/api/admin/users/{id}/incident-count` | 👑 | Conta pontos de um usuário. |
| `DELETE` | `/api/admin/users/{id}` | 👑 | Exclui usuário (opcionalmente apaga os pontos). |

### Documentação

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/docs` | 🔓 | Redireciona para o Swagger UI. |
| `GET` | `/v3/api-docs` | 🔓 | Descritor OpenAPI em JSON. |

---

## Configuração

As configurações ficam em `src/main/resources/application.yml` e podem ser
sobrescritas por variáveis de ambiente (recomendado em produção).

| Variável | Padrão | Descrição |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/zelo_db` | URL JDBC do PostgreSQL. |
| `DB_USER` | `zelo_user` | Usuário do banco. |
| `DB_PASSWORD` | `zelo_pass` | Senha do banco. |
| `JPA_SHOW_SQL` | `false` | Exibe o SQL do Hibernate no log. |
| `STORAGE_LOCAL_PATH` | `./uploads` | Diretório local das imagens. |
| `PUBLIC_BASE_URL` | *(vazio)* | Base pública das URLs de imagem; vazio = URLs relativas. |
| `JWT_SECRET` | chave de desenvolvimento | Segredo HMAC do JWT (**obrigatório trocar em produção**). |
| `JWT_EXPIRATION_MS` | `86400000` | Validade do token em milissegundos (24 h). |
| `APP_CORS_ALLOWEDORIGINS` | `http://localhost:5173,https://zelo.apps.log.br` | Origens permitidas por CORS, separadas por vírgula. |
| `GEOCODING_BASE_URL` | `https://nominatim.openstreetmap.org` | Serviço de geocodificação reversa. |
| `SERVER_PORT` | `8080` | Porta HTTP da API. |
| `LOG_LEVEL_ZELO` | `INFO` | Nível de log do pacote `com.zelo.backend`. |

> O `JWT_SECRET` deve ter pelo menos 32 bytes (256 bits). Nunca versione o
> segredo real; use variáveis de ambiente ou um cofre de segredos.

As regras do motor de alertas também são configuráveis em `alerts.rules` no
`application.yml`.

---

## Como executar

### Pré-requisitos

- **Java 21**
- **Maven 3.9+**
- **PostgreSQL 16+ com PostGIS**

### Banco de dados

Crie o banco e habilite o PostGIS:

```sql
CREATE DATABASE zelo_db;
\c zelo_db
CREATE EXTENSION IF NOT EXISTS postgis;
```

O schema é criado/atualizado automaticamente pelo Hibernate
(`spring.jpa.hibernate.ddl-auto=update`). Em produção, avalie substituir por
migrações versionadas (Flyway/Liquibase).

### Executar em desenvolvimento

```bash
# na pasta backend/
mvn spring-boot:run
```

Ou gerando o jar:

```bash
mvn clean package
java -jar target/backend-1.0.0.jar
```

A API sobe em `http://localhost:8080` e a documentação em
`http://localhost:8080/docs`.

### Exemplo rápido

```bash
# 1. criar conta
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Maria Silva",
    "email": "maria@example.com",
    "cpf": "12345678901",
    "password": "senha123",
    "city": "São Paulo"
  }'

# 2. usar o token retornado
curl http://localhost:8080/api/public/incidents?lat=-23.5505&lng=-46.6333&radiusMeters=5000
```

---

## Docker

O `Dockerfile` usa **build multi-stage**: o Maven compila o jar dentro da imagem,
sem depender de artefatos pré-compilados no host.

```bash
# na pasta backend/
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

No Windows (PowerShell), ajuste o volume para um caminho absoluto:

```powershell
docker run --rm -p 8080:8080 `
  -e DB_URL="jdbc:postgresql://host.docker.internal:5432/zelo_db" `
  -e JWT_SECRET="troque-por-um-segredo-forte-de-32-bytes" `
  -v "${PWD}/uploads:/app/uploads" `
  zelo-backend
```

A imagem roda com usuário não-root (`zelo`, UID 1001) e o diretório
`/app/uploads` já possui permissão de escrita.

---

## Documentação interativa

Com a aplicação em execução, acesse:

- **Swagger UI:** <http://localhost:8080/docs>
- **OpenAPI JSON:** <http://localhost:8080/v3/api-docs>

Para testar rotas protegidas, faça login, copie o campo `token` e use o botão
**Authorize** do Swagger UI. O token é persistido no navegador.

---

## Estrutura do projeto

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/zelo/backend/
│   │   │   ├── ZeloApplication.java
│   │   │   ├── config/        # segurança, CORS, JWT, OpenAPI, storage
│   │   │   ├── controller/    # endpoints REST
│   │   │   ├── dto/           # contratos de entrada/saída
│   │   │   ├── entity/        # modelo de domínio
│   │   │   ├── exception/     # exceções e handler global
│   │   │   ├── repository/    # acesso a dados (JPA/PostGIS)
│   │   │   └── service/       # regras de negócio e integrações
│   │   └── resources/
│   │       └── application.yml
│   └── test/                  # testes automatizados (opcional)
├── Dockerfile
├── .dockerignore
├── .gitignore
└── pom.xml
```

---

## Formato de erro

Todas as falhas (4xx/5xx) usam o mesmo formato:

```json
{
  "timestamp": "2026-11-09T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "email: E-mail inválido",
  "path": "/api/auth/login"
}
```

| Código | Quando acontece |
|---|---|
| `400` | Validação de entrada ou regra de negócio simples. |
| `401` | Token ausente, expirado ou inválido. |
| `403` | Papel insuficiente ou ação fora do escopo (cidade/autor). |
| `404` | Recurso inexistente. |
| `422` | Autor a mais de 500 m do local do ponto crítico. |
| `500` | Erro inesperado (detalhe no log do servidor). |

---

## Segurança e LGPD

- Autenticação **stateless** por JWT; não há cookie de sessão.
- Senhas armazenadas com **BCrypt**.
- `cpf` e `passwordHash` **nunca** são expostos nas respostas.
- Rotas administrativas e de moderação são protegidas por papel e por escopo de
  cidade.
- O CORS precisa listar explicitamente a origem do front-end, inclusive atrás de
  proxy/túnel.
- Ao excluir um usuário, o `ROOT` pode optar por manter os pontos críticos,
  anonimizando a autoria por meio de uma conta técnica de sistema sem senha
  utilizável.

---

## Licença

Projeto acadêmico desenvolvido para o trabalho final da trilha **Dev. Full Stack**
da **+praTI & Codifica**. Uso educacional.
