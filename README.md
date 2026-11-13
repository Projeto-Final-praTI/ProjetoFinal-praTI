# ZELO

**Zeladoria urbana colaborativa:** mapa de problemas da cidade, alertas de risco
e central de pessoas desaparecidas em uma única plataforma georreferenciada.

> Trabalho final da trilha **Dev. Full Stack 2026** da **+praTI & Codifica**.

---

## Sobre

Problemas de infraestrutura urbana — buracos, pontes comprometidas, alagamentos,
quedas de árvore e deslizamentos — são percebidos primeiro por quem circula pela
cidade. A ZELO centraliza esse fluxo: cidadãos registram ocorrências com foto e
localização, a comunidade confirma e comenta, e equipes municipais acompanham e
atualizam cada ponto.

O acesso é público para consulta e exige autenticação para criar ou alterar
informações. O sistema também reúne **alertas climáticos automáticos**, **alertas
oficiais** da gestão e uma **central de pessoas desaparecidas** com moderação e
pré-alertas por proximidade.

---

## Funcionalidades

- **Mapa interativo** com pontos críticos, agrupamento de marcadores e filtro
  temporal.
- **Registro de ocorrências** com categoria, descrição, localização e 1 a 5
  fotos, limitado a 500 m do local.
- **Confirmação comunitária** idempotente e comentários.
- **Linha do tempo de status** com autor, data e nota.
- **Alertas climáticos** gerados a partir da previsão do tempo (chuva, calor,
  frio e vento).
- **Alertas oficiais** com severidade, raio e duração definidos pela gestão.
- **Pessoas desaparecidas:** denúncia com foto, pré-alerta de 1 km por 10 min,
  moderação, aprovação com alcance local/global e chat de avistamentos.
- **Painel administrativo** com escopo por cidade e papéis `USER`, `FISCAL`,
  `GESTOR` e `ROOT`.
- **Consulta pública** de pontos, alertas e desaparecidos, sem cadastro.

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 18, TypeScript, Vite 5, Tailwind CSS, Leaflet + markercluster, Axios |
| **Backend** | Java 21, Spring Boot 3.3, Spring Security + JWT, Spring Data JPA, Bean Validation, springdoc/OpenAPI |
| **Banco de dados** | PostgreSQL 16 + PostGIS 3 |
| **Integrações** | Open-Meteo, Nominatim/OpenStreetMap, IBGE Localidades e tiles do OSM |
| **Infraestrutura** | Docker multi-stage, nginx e GitHub Actions (build + GitHub Pages) |

Detalhes das integrações externas em [`docs/apis-externas.md`](docs/apis-externas.md).

---

## Estrutura do repositório

```
ProjetoFinal-praTI/
├── .github/          # Workflow de build e publicação do frontend
├── backend/          # API REST em Spring Boot
├── database/         # schema.sql e documentação do banco
├── docs/             # Documentação técnica e funcional
│   └── planejamento/ # Documentos históricos da fase de planejamento
├── frontend/         # SPA em React + TypeScript
├── .gitignore
└── README.md
```

> As dependências Node ficam em [`frontend/package.json`](frontend/package.json);
> o backend usa Maven, em [`backend/pom.xml`](backend/pom.xml). Não há projeto
> Node na raiz do repositório.

---

## Como executar

### Pré-requisitos

- **Java JDK 21** e **Maven 3.9**
- **Node.js 18+** (recomendado 22 LTS) e npm
- **PostgreSQL 16** com a extensão **PostGIS**

### 1. Banco de dados

```sql
CREATE DATABASE zelo_db;
\c zelo_db
CREATE EXTENSION IF NOT EXISTS postgis;
```

```bash
psql -U zelo_user -d zelo_db -f database/schema.sql
```

O script cria apenas a estrutura — não contém dados pessoais.

### 2. Backend

```bash
cd backend

export DB_URL="jdbc:postgresql://localhost:5432/zelo_db"
export DB_USER="zelo_user"
export DB_PASSWORD="sua-senha-local"
export JWT_SECRET="uma-chave-forte-com-no-minimo-32-bytes"

mvn spring-boot:run
```

No Windows PowerShell, use `$env:DB_URL="..."` para cada variável.

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/docs`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. O Vite faz proxy de `/api` e `/uploads` para o
backend.

### 4. Build de verificação

```bash
cd frontend && npm run build && npm run test:filter
cd backend && mvn -B clean package
```

Passo a passo completo, incluindo Docker e solução de problemas, em
[`docs/instalacao.md`](docs/instalacao.md).

---

## Documentação

Toda a documentação está em [`docs/`](docs/README.md).

| Documento | Conteúdo |
|-----------|----------|
| [Índice da documentação](docs/README.md) | Guia de leitura e visão geral dos documentos |
| [Visão geral](docs/visao-geral.md) | Problema, solução, público e escopo |
| [Requisitos](docs/requisitos.md) | Requisitos funcionais, não funcionais e regras de negócio |
| [Arquitetura](docs/arquitetura.md) | Componentes, camadas, fluxos e implantação |
| [Modelo de dados](docs/modelo-de-dados.md) | Entidades, relacionamentos e PostGIS |
| [API](docs/api.md) | Endpoints, autenticação, erros e exemplos |
| [APIs externas](docs/apis-externas.md) | Open-Meteo, Nominatim, IBGE e tiles do OSM |
| [Frontend](docs/frontend.md) | Estrutura React/TypeScript, rotas e componentes |
| [Backend](docs/backend.md) | Estrutura Spring Boot, segurança e configuração |
| [Instalação](docs/instalacao.md) | Execução local, Docker e troubleshooting |
| [Deploy](docs/deploy.md) | nginx, containers, CI/CD e operação |
| [Segurança e LGPD](docs/seguranca-e-lgpd.md) | Autenticação, RBAC, privacidade e retenção |
| [Testes e qualidade](docs/testes-e-qualidade.md) | Testes existentes, checklist manual e lacunas |
| [Manual do usuário](docs/manual-do-usuario.md) | Uso por visitante, cidadão, moderador e gestor |
| [Contribuição](docs/contribuicao.md) | Branches, commits, PRs e padrões de código |
| [Decisões técnicas](docs/decisoes-tecnicas.md) | Registro das decisões de arquitetura (ADRs) |
| [Planejamento](docs/planejamento/README.md) | Documentos originais e divergências em relação ao implementado |

Documentação específica:

- [`frontend/README.md`](frontend/README.md) — scripts e organização do frontend.
- [`backend/README.md`](backend/README.md) — configuração e endpoints da API.
- [`database/README.md`](database/README.md) — execução do schema e boas práticas.

---

## Equipe

| Integrante | Função |
|------------|--------|
| Diogo Scorsatto | Líder |
| Clebson Oliveira | Desenvolvedor |
| Maria Silva | Desenvolvedora |
| Alexander Pereira | Desenvolvedor |
| Esdras | Desenvolvedor |
| Clóvis | Desenvolvedor |
| Klaian | Desenvolvedor |

---

## Contribuição

- A branch `main` é protegida e recebe alterações por **Pull Request**.
- Cada mudança nasce em uma branch `feature/...`, `fix/...` ou `docs/...`.
- Use **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Antes do PR, rode os builds do frontend e do backend e atualize a documentação.

Fluxo completo em [`docs/contribuicao.md`](docs/contribuicao.md).

---

## Segurança

- Nunca versione `.env`, senhas, tokens, chaves ou dumps de banco com dados reais.
- Use variáveis de ambiente para configuração sensível (`DB_PASSWORD`,
  `JWT_SECRET`).
- O `JWT_SECRET` deve ter pelo menos 32 bytes e ser diferente em produção.
- Consulte [`docs/seguranca-e-lgpd.md`](docs/seguranca-e-lgpd.md) antes de operar
  com dados reais.

---

## Status

Projeto acadêmico em evolução. A versão atual cobre o fluxo completo de pontos
críticos, alertas, desaparecidos e administração, com documentação técnica e
script de banco versionados.

Limitações conhecidas e próximos passos estão em
[`docs/testes-e-qualidade.md`](docs/testes-e-qualidade.md) e
[`docs/decisoes-tecnicas.md`](docs/decisoes-tecnicas.md).

---

## Licença

Projeto acadêmico desenvolvido para fins educacionais na trilha Dev. Full Stack
2026 (+praTI & Codifica).
