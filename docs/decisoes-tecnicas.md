# Decisões técnicas

Registro das principais decisões de arquitetura (ADRs). Cada decisão descreve o
contexto, a escolha e as consequências.

> As decisões refletem a versão atual do código. Documentos anteriores ao
> desenvolvimento estão em [`planejamento/`](planejamento/).

---

## ADR-01 — SPA React com mapa como tela principal

**Contexto:** o produto é essencialmente geográfico; a maioria das ações parte de
um ponto no mapa.

**Decisão:** construir uma SPA em que o mapa é a tela-base e as demais telas são
overlays derivados da rota.

**Consequências:**

- navegação fluida e contexto geográfico sempre visível;
- necessidade de cuidar de z-index e do ciclo de vida do Leaflet;
- estados de painel precisam ser derivados da URL para suportar links diretos.

---

## ADR-02 — Roteador próprio com History API

**Contexto:** o roteamento needed era simples e o time queria evitar dependência
extra.

**Decisão:** implementar `src/router.ts` com `pushState`, `replaceState`,
`popstate` e fallback para `/`.

**Consequências:**

- menos dependências e bundle menor;
- o servidor precisa de fallback de SPA (nginx já configurado);
- sem recursos avançados de routers prontos (loaders, rotas aninhadas).

---

## ADR-03 — Tailwind CSS com tema customizado

**Contexto:** consistência visual e velocidade de implementação.

**Decisão:** Tailwind 3 com escalas `emerald`, `blue` e `slate` sobrescritas pela
paleta ZELO e classes compartilhadas em `index.css`.

**Consequências:**

- rebrand centralizado no `tailwind.config.js`;
- HTML com muitas classes utilitárias;
- componentes compartilhados reduzem duplicação de estilo.

---

## ADR-04 — Leaflet + markercluster

**Contexto:** mapas com muitos marcadores e necessidade de agrupamento.

**Decisão:** Leaflet com `react-leaflet` e `leaflet.markercluster`.

**Consequências:**

- ecossistema maduro e gratuito;
- controle manual de z-index e de eventos;
- sem camada de mapas proprietária.

---

## ADR-05 — Axios com interceptor de JWT

**Contexto:** centralizar autenticação e tratamento de erros.

**Decisão:** um único cliente em `src/api.ts`, com `baseURL: '/api'`, injeção do
token e logout apenas em `401` de requisições autenticadas.

**Consequências:**

- endpoints centralizados e fáceis de auditar;
- dependência de `localStorage` para persistir sessão;
- tratamento de `401` evita logout indevido em senha errada.

---

## ADR-06 — Spring Boot 3.3 + Java 21

**Contexto:** stack definida para o trabalho final.

**Decisão:** Spring Boot 3.3.4 com Java 21, Spring MVC, Spring Data JPA,
Spring Security e Bean Validation.

**Consequências:**

- base madura e bem documentada;
- separação clara em camadas;
- maior consumo de memória quando comparado a frameworks menores.

---

## ADR-07 — PostgreSQL + PostGIS

**Contexto:** consultas por proximidade, raio de alertas e geofence.

**Decisão:** PostgreSQL com PostGIS e colunas `geometry(Point, 4326)`.

**Consequências:**

- consultas espaciais eficientes (`ST_DWithin`, `ST_Distance`);
- compatibilidade direta com as coordenadas do Leaflet;
- exige extensão e imagem Docker com PostGIS.

---

## ADR-08 — Autenticação stateless com JWT

**Contexto:** API consumida por SPA e possibilidade de múltiplos clientes.

**Decisão:** JWT assinado com HMAC, validade de 24 h, sem sessão no servidor.

**Consequências:**

- escalabilidade horizontal simples;
- revogação imediata limitada (depende da expiração);
- token no `localStorage` exige cuidado com XSS;
- `JWT_SECRET` precisa ser forte e rotacionável.

---

## ADR-09 — RBAC com escopo por cidade

**Contexto:** operação municipal exige isolamento entre cidades.

**Decisão:** papéis `USER`, `FISCAL`, `GESTOR`, `ROOT`, com validação de cidade no
service.

**Consequências:**

- gestor/fiscal só operam na própria cidade;
- cidade vazia bloqueia operação municipal (`403`);
- regras centralizadas evitam bypass pelo cliente.

---

## ADR-10 — Confirmação comunitária idempotente

**Contexto:** evitar duplicidade e inflação de apoios.

**Decisão:** tabela `incident_upvotes` com `UNIQUE (incident_id, user_id)` e
contador desnormalizado em `incidents.upvotes_count`.

**Consequências:**

- cliques repetidos não alteram o total;
- contador rápido de ler;
- necessidade de manter contador e tabela consistentes em transação.

---

## ADR-11 — Armazenamento local de imagens

**Contexto:** simplicidade de implantação no contexto acadêmico.

**Decisão:** gravar em `storage.local-path` e servir em `/uploads/**`, com URLs
relativas.

**Consequências:**

- funciona atrás de proxy e em container com volume;
- não escala horizontalmente sem storage compartilhado;
- imagens são públicas;
- evolução recomendada: S3/MinIO com URLs assinadas.

---

## ADR-12 — Schema por `ddl-auto=update`

**Contexto:** agilidade durante o desenvolvimento.

**Decisão:** deixar o Hibernate criar/atualizar o schema a partir das entidades.

**Consequências:**

- produtividade no início;
- sem histórico de migrações nem rollback controlado;
- risco de alterações destrutivas;
- evolução recomendada: Flyway ou Liquibase antes de produção.

---

## ADR-13 — Pré-alerta de pessoa desaparecida

**Contexto:** as primeiras horas são críticas em desaparecimentos.

**Decisão:** ao denunciar com localização, disparar pré-alerta de 1 km por 10 min
antes da moderação; após aprovação, o alerta ganha raio e duração definidos.

**Consequências:**

- resposta rápida à comunidade;
- risco de uso indevido, mitigado pelo prazo curto e pela moderação posterior;
- necessidade de remover o pré-alerta após a expiração.

---

## ADR-14 — Alertas climáticos derivados do Open-Meteo

**Contexto:** evitar dependência de dados proprietários e manter custo zero.

**Decisão:** consultar a previsão horária do Open-Meteo e aplicar limites
configuráveis de chuva, calor, frio e vento.

**Consequências:**

- sem chave de API e com boa cobertura;
- dependência de serviço externo;
- limites ajustáveis em `application.yml`;
- falhas externas não devem bloquear o restante da API.

---

## ADR-15 — Geocodificação reversa com Nominatim

**Contexto:** preencher a cidade do ponto sem exigir entrada manual.

**Decisão:** usar Nominatim/OpenStreetMap; se falhar, gravar o ponto sem cidade.

**Consequências:**

- menos atrito no registro;
- dependência de serviço externo e de política de uso;
- pontos sem cidade ficam restritos ao root na gestão.

---

## ADR-16 — Documentação OpenAPI com springdoc

**Contexto:** manter contrato vivo e testável.

**Decisão:** springdoc-openapi com Swagger UI em `/docs` e JSON em `/v3/api-docs`.

**Consequências:**

- documentação próxima do código;
- possibilidade de testar rotas com token;
- exige disciplina para manter anotações atualizadas.

---

## ADR-17 — Docker multi-stage e nginx

**Contexto:** builds reproduzíveis e SPA com fallback de rotas.

**Decisão:** frontend compilado em estágio Node e servido por nginx; backend
compilado com Maven e executado em JRE 21 com usuário não-root.

**Consequências:**

- imagens sem dependência de artefatos do host;
- nginx resolve SPA e faz proxy de API/uploads;
- necessidade de rede Docker e volume para uploads;
- ausência de `docker-compose.yml` exige subida manual.

---

## ADR-18 — Publicação do frontend no GitHub Pages

**Contexto:** demonstrar o frontend sem infraestrutura própria.

**Decisão:** workflow que compila e publica `dist/` no Pages a cada push na `main`.

**Consequências:**

- demonstração simples e gratuita;
- sem backend e sem fallback de SPA;
- links diretos podem retornar 404;
- não substitui a implantação completa com nginx.

---

## ADR-19 — Exclusão de usuário com preservação opcional

**Contexto:** apagar um usuário não deve necessariamente apagar o histórico
urbano.

**Decisão:** o root escolhe entre apagar os pontos ou mantê-los com autoria
transferida para uma conta técnica de sistema.

**Consequências:**

- preserva o histórico público;
- autoria deixa de identificar a pessoa (anonimização);
- a conta técnica não tem senha utilizável;
- a operação precisa ser auditada.

---

## ADR-20 — Documentação em `docs/` com planejamento histórico

**Contexto:** o projeto teve documentos de planejamento antes do código e precisa
manter rastreabilidade.

**Decisão:** documentos atuais na raiz de `docs/` e documentos iniciais em
`docs/planejamento/`, com uma nota de divergências.

**Consequências:**

- leitor entende o que existe hoje e o que foi planejado;
- divergências ficam explícitas;
- a documentação atual tem prioridade.
