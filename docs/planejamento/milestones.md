# Planejamento ágil — Marcos e entregas

Este documento registra, de forma objetiva, o planejamento do projeto em marcos (milestones) e etapas, atendendo à organização incremental do desenvolvimento.

## Metodologia

- **Abordagem:** desenvolvimento incremental com acompanhamento por marcos e critérios de aceite.
- **Gestão de trabalho:** tarefas priorizadas por funcionalidade (autenticação, CRUD, banco, API, frontend, testes e documentação), com integração contínua por Pull Requests.
- **Rastreamento:** histórico de commits/PRs no Git e artefatos em `docs/planejamento/`.

## Marcos do projeto

| Marco | Período (planejado) | Objetivo | Entregas principais | Status |
|---|---|---|---|---|
| M1 — Levantamento e arquitetura | Semana 1 | Definir escopo, requisitos e base técnica | Requisitos, arquitetura, modelo de dados, decisões técnicas | Concluído |
| M2 — Base do backend e banco | Semana 2 | Estruturar API, persistência e segurança | Projeto Spring Boot, entidades/repositórios, PostgreSQL/PostGIS, autenticação JWT/BCrypt, endpoints iniciais | Concluído |
| M3 — Base do frontend e integração | Semana 3 | Implementar interface e consumo da API | SPA React/TypeScript, rotas/telas, integração com API, fluxos principais de CRUD e autenticação | Concluído |
| M4 — Regras de negócio e RBAC | Semana 4 | Consolidar permissões e operações críticas | Controle de acesso por papéis, validações, tratamento de erros, moderação/admin | Concluído |
| M5 — Qualidade, testes e documentação | Semana 5 | Garantir validação e material de entrega | Testes unitários (JUnit/Jest), cobertura, ajustes de documentação (execução, arquitetura, funcionalidades) | Concluído |
| M6 — Revisão final e demonstração | Semana 6 | Preparar entrega e apresentação | Revisão final, checklist de aceite, preparação da demonstração ao vivo | Concluído/Entrega |

## Critérios de conclusão

- Funcionalidades principais implementadas e integradas (CRUD, autenticação/autorização, API REST, banco relacional).
- Build do frontend e backend executando com instruções documentadas.
- Testes unitários configurados/executáveis com relatório de cobertura.
- Documentação técnica atualizada em `docs/`.
- Evidências de versionamento e colaboração no repositório Git/GitHub.