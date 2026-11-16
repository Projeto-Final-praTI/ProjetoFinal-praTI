# Projeto Final +praTI (ZELO)

## Sobre o projeto

Aplicação web desenvolvida como trabalho final da trilha **Dev. Full Stack** da **+praTi & Codifica**. O projeto implementa uma plataforma colaborativa com mapa de ocorrências/pontos críticos, autenticação e autorização, moderação, alertas e painel administrativo.

**Stack principal:** React + TypeScript + Vite (frontend), Spring Boot + Java 21 (backend), PostgreSQL + PostGIS (banco), Git/GitHub (versionamento).

## Requisitos atendidos (resumo)

- **CRUD:** operações de criação, leitura, atualização e exclusão em recursos da aplicação (ex.: incidentes/pontos críticos, comentários/confirmações/status, alertas e gestão administrativa).
- **Autenticação e autorização:** cadastro/login com JWT, senhas com BCrypt, controle de acesso por papéis (RBAC) no backend.
- **API RESTful:** endpoints documentados (Swagger/OpenAPI em `/docs` no backend) com validação e tratamento de erros.
- **Banco relacional:** PostgreSQL + PostGIS com modelo documentado (`docs/modelo-de-dados.md`, `database/schema.sql`).
- **Testes unitários e cobertura:**
  - **Backend (JUnit 5 + Mockito + JaCoCo):** testes de serviços críticos de autenticação e CRUD/regras de negócio (`backend/src/test/java`), com verificação de cobertura mínima de 70% no `verify`.
  - **Frontend (Jest + ts-jest):** testes unitários de lógica crítica (`frontend/src/__tests__`), com relatório/limiar de cobertura configurado.
- **Documentação técnica:** instruções de execução, arquitetura, funcionalidades e decisões em `docs/`.

## Como executar localmente

### Pré-requisitos
- Java 21, Maven 3.9+
- Node.js 18+, npm 9+
- PostgreSQL 16+ com PostGIS

### 1) Banco de dados
```sql
CREATE DATABASE zelo_db;
\c zelo_db
CREATE EXTENSION IF NOT EXISTS postgis;
```
> O schema é gerenciado pela aplicação/Hibernate (`ddl-auto=update`). Veja `docs/instalacao.md` para detalhes.

### 2) Backend
```bash
cd backend
mvn spring-boot:run
```
- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/docs`

### 3) Frontend
```bash
cd frontend
npm install
npm run dev
```
- App: `http://localhost:5173` (proxy para `/api` e `/uploads`)

> Guia completo: [`docs/instalacao.md`](docs/instalacao.md)

## Testes e cobertura

### Backend (JUnit + cobertura JaCoCo)
```bash
cd backend
mvn test          # executa testes unitários
mvn verify        # executa testes + relatório + checagem de cobertura (>= 70%)
```
Relatório: `backend/target/site/jacoco/index.html`

### Frontend (Jest)
```bash
cd frontend
npm install
npm test          # testes unitários
npm run test:coverage
npm run test:filter
```

## Documentação

- Visão geral: [`docs/visao-geral.md`](docs/visao-geral.md)
- Instalação local: [`docs/instalacao.md`](docs/instalacao.md)
- Arquitetura: [`docs/arquitetura.md`](docs/arquitetura.md)
- API: [`docs/api.md`](docs/api.md)
- Funcionalidades/requisitos: [`docs/requisitos.md`](docs/requisitos.md), [`docs/manual-do-usuario.md`](docs/manual-do-usuario.md)
- Modelo de dados: [`docs/modelo-de-dados.md`](docs/modelo-de-dados.md)
- Testes e qualidade: [`docs/testes-e-qualidade.md`](docs/testes-e-qualidade.md)
- Decisões e aspectos relevantes: [`docs/decisoes-tecnicas.md`](docs/decisoes-tecnicas.md)
- Planejamento (critérios/marcos): [`docs/planejamento/`](docs/planejamento/)

## Estrutura do repositório

```text
Projeto-Final+praTI/
├── backend/      # API Spring Boot (Java 21)
├── frontend/     # SPA React + TypeScript (Vite)
├── database/     # Scripts/schema do banco
├── docs/         # Documentação técnica e planejamento
└── README.md
```

## Metodologia ágil e fluxo de desenvolvimento

- Trabalho organizado em **marcos/etapas** e critérios de aceite (`docs/planejamento/criterios-de-aceite.md`, `docs/planejamento/milestones.md`).
- Desenvolvimento em branches `feature/*`, `fix/*`, `docs/*` com integração via Pull Request para `main`.
- Commits e revisões documentados no histórico do Git.
- Detalhes do fluxo: [`docs/contribuicao.md`](docs/contribuicao.md)

## Equipe

| Integrante | Função |
|---|---|
| Diogo Scorsatto | Líder |
| Clebson Oliveira | Desenvolvedor |
| Maria Silva | Desenvolvedora |
| Alexander Pereira | Desenvolvedor |
| Esdras | Desenvolvedor |
| Clóvis | Desenvolvedor |
| Klaian | Desenvolvedor |

## Licença
Projeto acadêmico desenvolvido para fins educacionais.
