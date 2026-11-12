# ZELO — Frontend

Aplicação web do ZELO, plataforma colaborativa de monitoramento urbano. O mapa é a
tela principal: cidadãos registram pontos críticos (buracos, alagamentos, quedas de
árvore etc.), confirmam ocorrências da comunidade e recebem alertas climáticos e de
pessoas desaparecidas. Órgãos municipais usam o mesmo app para moderação e gestão.

## Tecnologias

| Camada | Tecnologia |
|--------|------------|
| UI | React 18 + TypeScript |
| Build/dev server | Vite 5 |
| Estilo | Tailwind CSS 3 (tema customizado da marca) |
| Mapa | Leaflet + react-leaflet + leaflet.markercluster |
| Ícones | lucide-react |
| HTTP | Axios |
| Roteamento | Roteador próprio com History API (`src/router.ts`), sem dependência extra |
| Deploy | Docker multi-stage (Node build → nginx) com proxy reverso para a API |

## Como rodar

Pré-requisitos: Node.js 18+ e o backend do ZELO em `http://localhost:8080`.

```bash
npm install
npm run dev
```

O Vite sobe em `http://localhost:5173` e encaminha `/api` e `/uploads` para o backend
(ver `vite.config.ts`). Não é necessário configurar variáveis de ambiente no frontend:
a URL da API é sempre relativa (`/api`).

### Scripts

| Script | O que faz |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Checagem de tipos (`tsc`) + build de produção em `dist/` |
| `npm run preview` | Serve o `dist/` localmente |
| `npm run test:filter` | Testa a regra da linha do tempo (pontos visíveis por período) |

## Organização do código

```
frontend/
├─ public/
│  ├─ brand/                 # Logo, favicons e ícones
│  └─ video/                 # Vídeos de fundo das telas de autenticação
├─ scripts/
│  └─ check-resolved-filter.mjs   # Teste isolado da regra da linha do tempo
├─ src/
│  ├─ api.ts                 # Cliente Axios, interceptors e todos os endpoints
│  ├─ types.ts               # DTOs e tipos compartilhados
│  ├─ router.ts              # Rotas e navegação (History API)
│  ├─ App.tsx                # Estado global, fetch de dados e orquestração da UI
│  ├─ main.tsx               # Ponto de entrada do React
│  ├─ index.css              # Tema, camadas de z-index e classes compartilhadas
│  ├─ components/            # Componentes de tela
│  ├─ hooks/                 # Hooks reutilizáveis (mobile, scroll lock, IBGE)
│  └─ services/
│     └─ ibge.ts             # Consulta de estados/municípios na API do IBGE
├─ Dockerfile                # Build + nginx
├─ nginx.conf                # SPA fallback, proxy /api, /uploads e Swagger
└─ tailwind.config.js        # Paleta e breakpoints da marca
```

### Componentes principais

| Componente | Responsabilidade |
|------------|------------------|
| `App.tsx` | Restaura a sessão, carrega incidentes/alertas, controla geolocalização e deriva os modais da rota atual |
| `MapView.tsx` | Mapa em tela cheia, marcadores, clusters e botão de localização |
| `Header.tsx` | Barra superior com logo, temperatura, atalho de desaparecidos e menu do usuário |
| `AlertBanner.tsx` | Empilha alertas de desaparecidos, alertas oficiais e avisos climáticos |
| `CriticalPointsPanel.tsx` | Lista lateral de pontos críticos |
| `IncidentDrawer.tsx` | Detalhe do ponto: fotos, comentários, confirmações e linha do tempo |
| `IncidentForm.tsx` | Registro de ponto crítico com upload de 1 a 5 imagens |
| `TimelineSlider.tsx` | Filtro temporal de duas pontas (início/fim) sobre o mapa |
| `AuthModal.tsx` | Login e cadastro |
| `ProfileModal.tsx` | Edição do próprio perfil |
| `AdminPanel.tsx` | Painel de gestão (usuários, pontos, alertas oficiais e estatísticas) |
| `AboutModal.tsx` | Apresentação pública da plataforma |
| `MissingPersonCenter.tsx` | Central de pessoas desaparecidas (alertas, denúncia e moderação) |
| `MissingPersonAlertModal.tsx` | Detalhe do alerta com chat atualizado periodicamente |
| `CityPicker.tsx` | Seleção de estado/município com busca no IBGE |
| `Scrim.tsx` | Véu compartilhado atrás de painéis e modais |

## Rotas

O mapa é a tela-base; cada rota abre um overlay por cima dele. A URL é a fonte da
verdade, então links diretos e o botão "voltar" do navegador funcionam.

| URL | Abre |
|-----|------|
| `/` | Mapa |
| `/login` | Login |
| `/cadastro` | Cadastro |
| `/sobre` | Sobre o ZELO |
| `/desaparecidos` | Central na aba **Alertas ativos** |
| `/desaparecidos/denunciar` | Central na aba **Denunciar** |
| `/desaparecidos/moderacao` | Central na aba **Moderação** (fiscal/gestor/root) |
| `/desaparecidos/:id` | Detalhe de um alerta (busca pelo id se necessário) |
| `/perfil` | Perfil (exige login; sem sessão vai para `/login`) |
| `/admin` | Painel administrativo (exige gestor/root; sem permissão volta para `/`) |

Regras de navegação:

- Fechar um overlay usa `back()`: retorna à rota anterior ou substitui por `/` quando
  a rota foi aberta por link direto.
- Alternar login ↔ cadastro e trocar de aba em `/desaparecidos` usam `replaceState`
  para não poluir o histórico.
- A sessão é restaurada antes dos guardas de `/perfil` e `/admin`, evitando expulsar
  um usuário logado que abriu o link direto.
- O `nginx.conf` já tem fallback de SPA (`try_files $uri $uri/ /index.html`), então
  links diretos funcionam em produção.

## API

Todas as chamadas passam por `src/api.ts`, com `baseURL = '/api'`.

### Autenticação e usuário

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Cadastro (nome, e-mail, CPF, senha e cidade opcional) |
| POST | `/auth/login` | Login e emissão do token JWT |
| PUT | `/users/me` | Atualiza nome, cidade e/ou senha do próprio usuário |

### Pontos críticos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/public/incidents?lat&lng&radiusMeters` | Pontos próximos (raio padrão de 10 km) |
| GET | `/public/incidents/{id}` | Detalhe de um ponto |
| POST | `/incidents` | Cria ponto (multipart: `data` JSON + `images`) |
| POST | `/incidents/{id}/comments` | Adiciona comentário |
| POST | `/incidents/{id}/upvote` | Confirma/apoia o ponto |
| PUT | `/incidents/{id}/status` | Altera status e registra nota (fiscal/gestor/root) |
| DELETE | `/incidents/{id}` | Remove ponto (autor, gestor da cidade ou root) |

### Alertas climáticos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/public/alerts?lat&lng` | Alertas ativos + clima atual para a coordenada |

### Administração

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/admin/users?search&city` | Lista usuários |
| PUT | `/admin/users/{id}/role` | Define papel e cidade |
| GET | `/admin/incidents?city` | Lista pontos para gestão |
| DELETE | `/admin/incidents/{id}` | Remove ponto pelo painel |
| GET | `/admin/stats` | Estatísticas globais (root) |
| GET | `/admin/users/{id}/incident-count` | Quantidade de pontos do usuário |
| DELETE | `/admin/users/{id}` | Remove usuário (root) |
| GET | `/admin/alerts` | Lista alertas oficiais |
| POST | `/admin/alerts` | Cria alerta oficial |
| DELETE | `/admin/alerts/{id}` | Remove alerta oficial |

### Pessoas desaparecidas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/public/missing-alerts?lat&lng` | Alertas ativos na região |
| GET | `/public/missing-alerts/{id}` | Detalhe do alerta |
| POST | `/missing-alerts` | Denúncia (multipart: `data` JSON + `photo`) |
| POST | `/missing-alerts/{id}/comments` | Comentário no chat (imagem opcional) |
| GET | `/moderation/missing-alerts` | Fila de moderação (fiscal/gestor/root) |
| POST | `/moderation/missing-alerts/{id}/approve` | Aprova e publica o alerta |
| POST | `/moderation/missing-alerts/{id}/reject` | Recusa com motivo |
| DELETE | `/moderation/missing-alerts/{id}` | Remove alerta |

## Pontos centrais da aplicação

### Sessão e RBAC

- O token JWT e o usuário ficam em `localStorage` (`zelo_token` e `zelo_user`).
- O interceptor de request injeta `Authorization: Bearer <token>`.
- Um `401` só encerra a sessão quando a requisição **enviou** token e não é
  `/auth/login` ou `/auth/register` — assim, senha errada mostra a mensagem no
  formulário em vez de recarregar a página.
- Papéis: `USER` (cidadão), `FISCAL`, `GESTOR` (municipal, vinculados a uma cidade) e
  `ROOT` (superusuário). O cliente esconde ações sem permissão, mas o backend valida
  novamente.

### Geolocalização

- `App.tsx` usa `watchPosition` para acompanhar o usuário e carregar os pontos ao
  redor do centro atual.
- Sem permissão de localização, o app cai em um centro padrão e continua funcional.
- O botão de localização recentraliza o mapa e aplica zoom de rua (17).

### Registro de ponto crítico

1. O usuário logado entra no modo criação.
2. O mapa espera o clique no local exato (existe um banner com "Cancelar" para sair).
3. O formulário exige título, categoria, descrição e de 1 a 5 imagens.
4. O envio é `multipart/form-data`; o `Content-Type` **não** é definido manualmente
   para o navegador gerar o boundary corretamente.

### Linha do tempo

- `TimelineSlider` filtra os pontos por uma janela de duas pontas.
- Sem filtro, a janela vai até o presente, então pontos `RESOLVIDO` ficam ocultos.
- A regra está documentada em `TimelineSlider.tsx` e coberta por
  `npm run test:filter`.

### Alertas de pessoas desaparecidas

- Denúncias geram um **pré-alerta** imediato de 1 km por 10 minutos, antes da
  moderação.
- Após aprovação, o alerta ganha raio/duração definidos e aparece na central.
- O chat do alerta é atualizado a cada 2 segundos enquanto o modal está aberto.

### Camadas de z-index

- Toda a UI vive sobre o mapa (Leaflet), que já usa z-index internamente.
- As camadas do app estão centralizadas como variáveis em `src/index.css`
  (`--z-side`, `--z-alert`, `--z-float`, `--z-header`, `--z-modal`, `--z-toast` etc.).
- Use sempre `z-[var(--z-...)]`; números soltos acabam criando sobreposições
  inesperadas.

### Tema

- `tailwind.config.js` sobrescreve as escalas `emerald`, `blue` e `slate` com a paleta
  ZELO, permitindo o rebrand sem reescrever todos os componentes.
- Classes compartilhadas (`.zelo-field`, `.zelo-input`, `.zelo-btn-*`, `.zelo-label`)
  ficam em `src/index.css` para manter formulários e botões consistentes.

## Build e deploy

### Docker

```bash
docker build -t zelo-frontend .
docker run -p 80:80 zelo-frontend
```

O `Dockerfile` compila o app em um estágio Node e serve o `dist/` com nginx. O
`nginx.conf` faz o fallback de SPA e encaminha `/api`, `/uploads`, `/docs` e
`/swagger-ui` para o backend.

### Variáveis de ambiente

Não há variáveis obrigatórias. Em produção, o frontend espera que a API esteja
acessível no mesmo domínio em `/api` (proxy do nginx ou do provedor de hospedagem).

## Boas práticas para contribuir

- Rode `npm run build` antes de abrir PR: o `tsc` está em modo estrito e com
  `noUnusedLocals`/`noUnusedParameters`.
- Mantenha os DTOs em `src/types.ts` e os endpoints em `src/api.ts`; não espalhe
  chamadas HTTP pelos componentes.
- Comentários devem explicar **por que** uma regra existe (ex.: bordas da linha do
  tempo, camadas de z-index), não repetir o que o código já diz.
- Evite dependências novas para necessidades pequenas: o roteador, por exemplo, usa
  apenas a History API.
