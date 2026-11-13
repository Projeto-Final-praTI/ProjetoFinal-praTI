# API REST

Base local: `http://localhost:8080`  
Prefixo dos endpoints: `/api`  
Formato: `application/json`, exceto uploads (`multipart/form-data`).

A referência interativa fica em **`/docs`** (Swagger UI) e o descritor OpenAPI em
**`/v3/api-docs`**.

---

## 1. Autenticação

A API é **stateless**. O login devolve um token JWT que deve ser enviado em todas
as requisições protegidas:

```http
Authorization: Bearer <token>
```

- Validade padrão: **24 horas** (`JWT_EXPIRATION_MS`).
- Senhas são armazenadas com BCrypt.
- Token ausente, expirado ou inválido em rota protegida retorna **401**.
- Papel insuficiente ou fora do escopo de cidade retorna **403**.

### Papéis

| Papel | Descrição |
|-------|-----------|
| `USER` | Cidadão |
| `FISCAL` | Operador municipal da própria cidade |
| `GESTOR` | Gestor municipal da própria cidade |
| `ROOT` | Administrador global |

---

## 2. Formato de erro

Todas as falhas usam o mesmo envelope:

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
| `403` | Papel insuficiente ou fora do escopo de cidade/autor |
| `404` | Recurso inexistente |
| `422` | Autor a mais de 500 m do ponto crítico |
| `500` | Erro inesperado |

---

## 3. Autenticação e usuário

### `POST /api/auth/register`

Cria uma conta `USER` e devolve o token.

**Corpo:**

```json
{
  "fullName": "Maria Silva",
  "email": "maria@example.com",
  "cpf": "12345678901",
  "password": "senha123",
  "city": "São Paulo"
}
```

**Resposta `201`:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "4f1c...",
    "fullName": "Maria Silva",
    "email": "maria@example.com",
    "role": "USER",
    "city": "São Paulo",
    "createdAt": "2026-11-09T12:00:00Z"
  }
}
```

### `POST /api/auth/login`

**Corpo:**

```json
{
  "email": "maria@example.com",
  "password": "senha123"
}
```

**Resposta `200`:** mesmo formato do cadastro (`token` + `user`).

### `PUT /api/users/me` 🔒

Atualiza o próprio perfil.

```json
{
  "fullName": "Maria Silva",
  "city": "Campinas",
  "currentPassword": "senha123",
  "newPassword": "novaSenha123"
}
```

- `currentPassword` é obrigatória apenas quando `newPassword` é enviada.
- `newPassword` deve ter no mínimo 6 caracteres.
- Cidade vazia limpa o campo.

---

## 4. Pontos críticos

### `POST /api/incidents` 🔒

Registra um ponto crítico. **Multipart/form-data** com duas partes:

| Parte | Tipo | Descrição |
|-------|------|-----------|
| `data` | JSON (`application/json`) | Dados do ponto |
| `images` | arquivo(s) | 1 a 5 imagens, até 10 MB cada |

**Exemplo do `data`:**

```json
{
  "title": "Buraco na Av. Paulista",
  "description": "Buraco profundo na faixa da direita.",
  "category": "BURACO",
  "incidentLat": -23.5614,
  "incidentLng": -46.6559,
  "userLat": -23.5610,
  "userLng": -46.6555
}
```

**Regras:**

- Categoria válida: `BURACO`, `PONTE_QUEBRADA`, `ALAGAMENTO`,
  `QUEDA_ARVORE`, `DESLIZAMENTO`, `OUTROS`.
- O autor deve estar a no máximo **500 m** do ponto; caso contrário, `422` com a
  distância calculada.
- Pelo menos uma imagem é obrigatória.
- A cidade é resolvida por geocodificação reversa quando não informada; se a
  fonte falhar, o ponto é gravado sem cidade.

**Resposta `201`:** `IncidentResponseDTO`.

### `GET /api/public/incidents` 🔓

Lista pontos próximos.

| Query | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `lat` | double | — | Latitude do centro |
| `lng` | double | — | Longitude do centro |
| `radiusMeters` | int | `10000` | Raio em metros |

### `GET /api/public/incidents/{id}` 🔓

Detalhe do ponto com autor, imagens, comentários e histórico.

### `POST /api/incidents/{id}/comments` 🔒

```json
{ "content": "O buraco aumentou depois da chuva." }
```

- Conteúdo obrigatório, máximo de 1000 caracteres.

### `POST /api/incidents/{id}/upvote` 🔒

Confirma o ponto. É **idempotente**: a segunda confirmação do mesmo usuário é
ignorada e não incrementa o contador.

### `PUT /api/incidents/{id}/status` 🔒

Transição de status com nota.

```json
{
  "status": "EM_ATENDIMENTO",
  "note": "Equipe de manutenção acionada."
}
```

- Permitido para `FISCAL`, `GESTOR` e `ROOT`.
- Fiscal/gestor só alteram pontos da própria cidade.
- Ponto sem cidade só é gerido por `ROOT`.
- A mudança gera uma entrada em `incident_status_history`.

### `GET /api/public/incidents/{id}/history` 🔓

Linha do tempo de status/notas, mais recente primeiro.

### `DELETE /api/incidents/{id}` 🔒

Exclui o ponto. Permitido para:

- o autor do ponto;
- `ROOT`, para qualquer ponto;
- `FISCAL`/`GESTOR`, para pontos da própria cidade.

---

## 5. Alertas

### `GET /api/public/alerts` 🔓

Retorna o clima atual e os alertas ativos para a coordenada.

| Query | Tipo | Descrição |
|-------|------|-----------|
| `lat` | double | Latitude |
| `lng` | double | Longitude |

**Resposta:**

```json
{
  "currentWeather": {
    "temperature": 24.5,
    "precipitation": 0.0,
    "weatherCode": 1,
    "windSpeed": 8.2
  },
  "alerts": [
    {
      "id": "8a7...",
      "title": "Chuva forte",
      "description": "Previsão de 12 mm em 1 hora.",
      "severity": "LARANJA",
      "source": "OPEN_METEO",
      "scope": "LOCAL",
      "city": "São Paulo",
      "radiusMeters": 50000,
      "expiresAt": "2026-11-09T15:00:00Z"
    }
  ]
}
```

### `GET /api/admin/alerts` 🏛️/👑

Lista alertas oficiais ativos. `ROOT` vê todos; `GESTOR` vê os globais e os
locais da própria cidade.

### `POST /api/admin/alerts` 🏛️/👑

```json
{
  "title": "Interdição da Ponte das Bandeiras",
  "description": "Ponte interditada por tempo indeterminado.",
  "severity": "VERMELHO",
  "scope": "LOCAL",
  "city": "São Paulo",
  "radiusMeters": 50000,
  "durationMinutes": 720
}
```

- `GESTOR` força `scope = LOCAL` e usa a cidade do próprio perfil.
- `ROOT` pode criar `GLOBAL` ou `LOCAL` em qualquer cidade.
- `durationMinutes`: 5 a 10080 (7 dias).
- `radiusMeters`: 1000 a 200000.

### `DELETE /api/admin/alerts/{id}` 🏛️/👑

Remove um alerta oficial antes do prazo.

---

## 6. Pessoas desaparecidas

### `POST /api/missing-alerts` 🔒

Envia uma denúncia. **Multipart/form-data**:

| Parte | Tipo | Descrição |
|-------|------|-----------|
| `data` | JSON | Dados da denúncia |
| `photo` | arquivo | Foto obrigatória da pessoa |

**Exemplo do `data`:**

```json
{
  "personName": "João da Silva",
  "kind": "DESAPARECIMENTO",
  "description": "Visto pela última vez na região central.",
  "lastSeenInfo": "Camiseta azul e calça jeans.",
  "contact": "(11) 99999-9999",
  "city": "São Paulo",
  "lat": -23.5505,
  "lng": -46.6333
}
```

- A denúncia nasce `PENDENTE`.
- Se `lat`/`lng` forem informados, dispara o **pré-alerta de 1 km por 10 min**.

### `GET /api/public/missing-alerts` 🔓

Lista alertas aprovados e não expirados próximos.

| Query | Tipo |
|-------|------|
| `lat` | double |
| `lng` | double |

### `GET /api/public/missing-alerts/{id}` 🔓

Detalhe público do alerta, incluindo comentários.

### `POST /api/missing-alerts/{id}/comments` 🔒

Comentário/avistamento. **Multipart/form-data**:

| Parte | Tipo | Descrição |
|-------|------|-----------|
| `data` | JSON | `{ "content": "..." }` |
| `image` | arquivo | Imagem opcional |

### `GET /api/moderation/missing-alerts` 🧭/🏛️/👑

Fila de moderação. `ROOT` vê todas; fiscal/gestor veem apenas a própria cidade.

### `POST /api/moderation/missing-alerts/{id}/approve` 🧭/🏛️/👑

```json
{
  "scope": "LOCAL",
  "city": "São Paulo",
  "radiusMeters": 50000,
  "durationMinutes": 1440
}
```

- Apenas denúncias `PENDENTE` podem ser aprovadas.
- Duração: 5 a 10080 minutos.
- Raio local: 1 a 200 km.
- `GLOBAL` é exclusivo do `ROOT`.

### `POST /api/moderation/missing-alerts/{id}/reject` 🧭/🏛️/👑

```json
{ "reason": "Dados insuficientes para confirmação." }
```

### `DELETE /api/moderation/missing-alerts/{id}` 🧭/🏛️/👑

Remove a denúncia. `ROOT` remove qualquer uma; fiscal/gestor apenas da própria
cidade.

---

## 7. Painel administrativo

### `GET /api/admin/users` 🏛️/👑

Lista usuários.

| Query | Descrição |
|-------|-----------|
| `search` | Nome ou e-mail |
| `city` | Filtro por cidade (ignorado/forçado para gestor) |

### `PUT /api/admin/users/{id}/role` 🏛️/👑

```json
{ "role": "FISCAL", "city": "São Paulo" }
```

- `ROOT`: qualquer cargo e cidade.
- `GESTOR`: apenas `USER` ⇄ `FISCAL`, na própria cidade, e não altera a si
  mesmo nem gestores/root.

### `GET /api/admin/incidents` 🏛️/👑

Lista pontos no escopo. `ROOT` pode filtrar por `city`; gestor vê apenas a
própria cidade.

### `DELETE /api/admin/incidents/{id}` 🏛️/👑

Exclui um ponto no escopo do painel.

### `GET /api/admin/stats` 👑

Indicadores globais:

```json
{
  "totalUsers": 120,
  "totalIncidents": 340,
  "usersByRole": { "USER": 100, "FISCAL": 12, "GESTOR": 7, "ROOT": 1 },
  "incidentsByStatus": { "ABERTO": 180, "EM_ATENDIMENTO": 60, "RESOLVIDO": 100 },
  "cities": ["São Paulo", "Campinas"]
}
```

### `GET /api/admin/users/{id}/incident-count` 👑

Retorna `{ "count": 12 }` com a quantidade de pontos do usuário.

### `DELETE /api/admin/users/{id}` 👑

```json
{ "deleteIncidents": false }
```

- `true`: apaga também os pontos do usuário.
- `false`: mantém os pontos com autoria anonimizada.

---

## 8. Documentação

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| `GET` | `/docs` | 🔓 | Redireciona para o Swagger UI |
| `GET` | `/v3/api-docs` | 🔓 | Descritor OpenAPI em JSON |
| `GET` | `/swagger-ui/**` | 🔓 | Recursos da interface |

Para testar rotas protegidas no Swagger:

1. Faça login em `POST /api/auth/login`.
2. Copie o `token` retornado.
3. Clique em **Authorize** e informe o token.
