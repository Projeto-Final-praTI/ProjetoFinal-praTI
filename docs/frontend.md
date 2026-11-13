# Frontend

Aplicação web da ZELO em **React 18 + TypeScript + Vite**. O mapa é a tela
principal; as demais telas são painéis e modais abertos sobre ele.

---

## 1. Stack

| Camada | Tecnologia |
|--------|------------|
| UI | React 18 + TypeScript |
| Build / dev server | Vite 5 |
| Estilo | Tailwind CSS 3 com tema customizado |
| Mapa | Leaflet + react-leaflet + leaflet.markercluster |
| Ícones | lucide-react |
| HTTP | Axios |
| Roteamento | Roteador próprio com History API (`src/router.ts`) |
| Deploy | Docker multi-stage (Node build → nginx) |

Não há dependência de biblioteca de roteamento, gerenciador de estado global ou
biblioteca de componentes. O estado da aplicação fica em `App.tsx`.

---

## 2. Pré-requisitos e scripts

Pré-requisitos: **Node.js 18+** e o backend em `http://localhost:8080`.

```bash
cd frontend
npm install
npm run dev
```

O Vite sobe em `http://localhost:5173` e encaminha `/api` e `/uploads` para o
backend (`vite.config.ts`). A URL da API é sempre relativa (`/api`), então não há
variável de ambiente obrigatória.

| Script | O que faz |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Checagem de tipos (`tsc`) + build de produção em `dist/` |
| `npm run preview` | Serve o `dist/` localmente |
| `npm run test:filter` | Testa a regra da linha do tempo (pontos visíveis por período) |

O `tsc` roda em modo estrito, com `noUnusedLocals` e `noUnusedParameters`. O build
falha se houver variável, import ou parâmetro não utilizado.

---

## 3. Organização do código

```
frontend/
├─ public/
│  ├─ brand/                 # Logo, favicons e ícones
│  └─ video/                 # Vídeos de fundo das telas de autenticação
├─ scripts/
│  └─ check-resolved-filter.mjs   # Teste isolado da regra da linha do tempo
├─ src/
│  ├─ api.ts                 # Cliente Axios, interceptors e endpoints
│  ├─ types.ts               # DTOs e tipos compartilhados
│  ├─ router.ts              # Rotas e navegação (History API)
│  ├─ App.tsx                # Estado global, fetch de dados e orquestração
│  ├─ main.tsx               # Ponto de entrada do React
│  ├─ index.css              # Tema, camadas de z-index e classes compartilhadas
│  ├─ components/            # Componentes de tela
│  ├─ hooks/                 # Hooks reutilizáveis (mobile, scroll lock, IBGE)
│  └─ services/
│     └─ ibge.ts             # Estados/municípios via API do IBGE
├─ Dockerfile
├─ nginx.conf
└─ tailwind.config.js
```

### Componentes principais

| Componente | Responsabilidade |
|------------|------------------|
| `App.tsx` | Restaura a sessão, carrega pontos/alertas, controla geolocalização e deriva modais da rota |
| `MapView.tsx` | Mapa em tela cheia, marcadores, clusters e botão de localização |
| `Header.tsx` | Logo, temperatura, atalho de desaparecidos e menu do usuário |
| `AlertBanner.tsx` | Empilha alertas de desaparecidos, oficiais e climáticos |
| `CriticalPointsPanel.tsx` | Lista lateral de pontos críticos |
| `IncidentDrawer.tsx` | Detalhe do ponto: fotos, comentários, confirmações e linha do tempo |
| `IncidentForm.tsx` | Registro de ponto com upload de 1 a 5 imagens |
| `TimelineSlider.tsx` | Filtro temporal de duas pontas sobre o mapa |
| `AuthModal.tsx` | Login e cadastro |
| `ProfileModal.tsx` | Edição do próprio perfil |
| `AdminPanel.tsx` | Gestão de usuários, pontos, alertas oficiais e estatísticas |
| `AboutModal.tsx` | Apresentação pública da plataforma |
| `MissingPersonCenter.tsx` | Central de desaparecidos (alertas, denúncia e moderação) |
| `MissingPersonAlertModal.tsx` | Detalhe do alerta com chat atualizado periodicamente |
| `CityPicker.tsx` | Seleção de estado/município com busca no IBGE |
| `Scrim.tsx` | Véu compartilhado atrás de painéis e modais |

---

## 4. Rotas

O mapa é a tela-base; cada rota abre um overlay. A URL é a fonte da verdade, então
links diretos e o botão "voltar" funcionam.

| URL | Abre |
|-----|------|
| `/` | Mapa |
| `/login` | Login |
| `/cadastro` | Cadastro |
| `/sobre` | Sobre o ZELO |
| `/desaparecidos` | Central na aba **Alertas ativos** |
| `/desaparecidos/denunciar` | Central na aba **Denunciar** |
| `/desaparecidos/moderacao` | Central na aba **Moderação** (fiscal/gestor/root) |
| `/desaparecidos/:id` | Detalhe de um alerta |
| `/perfil` | Perfil (exige login) |
| `/admin` | Painel administrativo (exige gestor/root) |

Regras de navegação:

- Fechar um overlay usa `back()`: volta à rota anterior ou substitui por `/`
  quando a rota foi aberta por link direto.
- Alternar login ↔ cadastro e trocar de aba em `/desaparecidos` usam
  `replaceState` para não poluir o histórico.
- A sessão é restaurada antes dos guardas de `/perfil` e `/admin`, evitando expulsar
  um usuário logado que abriu o link direto.
- O `nginx.conf` tem fallback de SPA (`try_files $uri $uri/ /index.html`), então
  links diretos funcionam em produção com nginx.

---

## 5. Integração com a API

Todas as chamadas passam por `src/api.ts`, com `baseURL = '/api'`.

| Grupo | Endpoints |
|-------|-----------|
| Autenticação | `POST /auth/register`, `POST /auth/login`, `PUT /users/me` |
| Pontos críticos | `GET /public/incidents`, `GET /public/incidents/{id}`, `POST /incidents`, `POST /incidents/{id}/comments`, `POST /incidents/{id}/upvote`, `PUT /incidents/{id}/status`, `DELETE /incidents/{id}` |
| Alertas | `GET /public/alerts` |
| Administração | `GET/PUT/DELETE /admin/users*`, `GET/DELETE /admin/incidents*`, `GET /admin/stats`, `GET/POST/DELETE /admin/alerts*` |
| Desaparecidos | `GET /public/missing-alerts*`, `POST /missing-alerts`, `POST /missing-alerts/{id}/comments`, `GET/POST/DELETE /moderation/missing-alerts*` |

A referência completa, com corpos e regras, está em [api.md](api.md).

---

## 6. Comportamentos centrais

### 6.1 Sessão e RBAC

- Token JWT e usuário ficam em `localStorage` (`zelo_token` e `zelo_user`).
- O interceptor de request injeta `Authorization: Bearer <token>`.
- Um `401` só encerra a sessão quando a requisição **enviou** token e não é
  `/auth/login` ou `/auth/register` — assim, senha errada mostra a mensagem no
  formulário em vez de recarregar a página.
- Papéis: `USER`, `FISCAL`, `GESTOR` e `ROOT`. O cliente esconde ações sem
  permissão, mas o backend valida novamente.

### 6.2 Geolocalização

- `App.tsx` usa `watchPosition` para acompanhar o usuário e recarregar os pontos
  ao redor do centro atual.
- Sem permissão de localização, o app usa um centro padrão e continua funcional.
- O botão de localização recentraliza o mapa e aplica zoom de rua (17).

### 6.3 Registro de ponto crítico

1. O usuário logado entra no modo criação.
2. O mapa espera o clique no local exato, com banner de "Cancelar".
3. O formulário exige título, categoria, descrição e de 1 a 5 imagens.
4. O envio é `multipart/form-data`; o `Content-Type` **não** é definido
   manualmente, para o navegador gerar o boundary correto.

### 6.4 Linha do tempo

- `TimelineSlider` filtra os pontos por uma janela de duas pontas.
- Sem filtro, a janela vai até o presente; pontos `RESOLVIDO` ficam ocultos.
- A regra está documentada em `TimelineSlider.tsx` e coberta por
  `npm run test:filter`.

### 6.5 Pessoas desaparecidas

- Denúncias geram um **pré-alerta** imediato de 1 km por 10 minutos, antes da
  moderação.
- Após aprovação, o alerta ganha raio/duração definidos e aparece na central.
- O chat do alerta é atualizado a cada 2 segundos enquanto o modal está aberto.

### 6.6 Camadas de z-index

- Toda a UI vive sobre o mapa (Leaflet), que já usa z-index internamente.
- As camadas estão centralizadas em `src/index.css`
  (`--z-side`, `--z-alert`, `--z-float`, `--z-header`, `--z-modal`, `--z-toast`).
- Use sempre `z-[var(--z-...)]`; números soltos criam sobreposições inesperadas.

### 6.7 Tema

- `tailwind.config.js` sobrescreve as escalas `emerald`, `blue` e `slate` com a
  paleta ZELO, permitindo rebrand sem reescrever os componentes.
- Classes compartilhadas (`.zelo-field`, `.zelo-input`, `.zelo-btn-*`,
  `.zelo-label`) ficam em `src/index.css`.

---

## 7. Build e deploy

```bash
# produção local
npm run build
npm run preview

# imagem Docker (nginx)
docker build -t zelo-frontend .
docker run -p 80:80 zelo-frontend
```

O `Dockerfile` compila em um estágio Node e serve o `dist/` com nginx. O
`nginx.conf` faz o fallback de SPA e encaminha `/api`, `/uploads`, `/docs`,
`/swagger-ui`, `/v3/api-docs` e `/webjars` para o backend.

O workflow `.github/workflows/deploy.yml` publica o frontend no GitHub Pages a
cada push na `main`. Veja as limitações dessa publicação em [deploy.md](deploy.md).

---

## 8. Boas práticas para contribuir

- Rode `npm run build` antes de abrir PR.
- Mantenha DTOs em `src/types.ts` e endpoints em `src/api.ts`; não espalhe chamadas
  HTTP pelos componentes.
- Comentários devem explicar **por que** uma regra existe, não repetir o código.
- Evite dependências novas para necessidades pequenas: o roteador usa apenas a
  History API.
- Respeite as variáveis de z-index e as classes de tema existentes.
