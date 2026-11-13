# Documentação — ZELO

Documentação técnica e funcional da **ZELO**, plataforma colaborativa de
monitoramento de infraestrutura urbana e alertas climáticos.

O objetivo desta pasta é concentrar o conhecimento necessário para entender,
executar, manter e evoluir o projeto. A documentação está dividida entre os
documentos **atuais** (que descrevem o que está implementado) e a pasta
[`planejamento/`](planejamento/), que preserva os documentos produzidos na fase
inicial do projeto.

---

## Índice

| Documento | Conteúdo |
|-----------|----------|
| [Visão geral](visao-geral.md) | Problema, solução, público-alvo, funcionalidades e escopo |
| [Requisitos](requisitos.md) | Requisitos funcionais, não funcionais e regras de negócio |
| [Arquitetura](arquitetura.md) | Componentes, camadas, fluxos e topologia de implantação |
| [Modelo de dados](modelo-de-dados.md) | Entidades, relacionamentos, enums e modelo PostGIS |
| [API](api.md) | Referência dos endpoints, autenticação, erros e exemplos |
| [Frontend](frontend.md) | Estrutura React/TypeScript, rotas, componentes e build |
| [Backend](backend.md) | Estrutura Spring Boot, segurança, regras e configuração |
| [Instalação e execução](instalacao.md) | Pré-requisitos, banco, backend, frontend e solução de problemas |
| [Deploy](deploy.md) | Docker, nginx, CI/CD, GitHub Pages e operação |
| [Segurança e LGPD](seguranca-e-lgpd.md) | Autenticação, RBAC, uploads, privacidade e retenção |
| [Testes e qualidade](testes-e-qualidade.md) | Estratégia de testes, checklist manual e validação de build |
| [Manual do usuário](manual-do-usuario.md) | Uso do app por visitante, cidadão, moderador e gestor |
| [Contribuição](contribuicao.md) | Fluxo de branches, commits, PR e padrões de código |
| [Decisões técnicas](decisoes-tecnicas.md) | Registro das principais decisões de arquitetura (ADRs) |

### Documentos de planejamento

| Documento | Conteúdo |
|-----------|----------|
| [Planejamento — índice](planejamento/README.md) | Contexto dos documentos iniciais e divergências em relação ao implementado |
| [Especificações técnicas](planejamento/especificacoes-tecnicas-ZELO.md) | Especificação funcional/técnica original completa |
| [Matriz de decisão](planejamento/matriz-de-decisao-ZELO.md) | Regras de decisão do produto (MD-01 a MD-51) |
| [Critérios de aceite](planejamento/criterios-de-aceite.md) | Critérios de aceite originalmente previstos |
| [Fluxo de navegação](planejamento/ZELO-diagrama-de-fluxo-de-navegação.svg) | Diagrama do fluxo de navegação planejado |

---

## Documentação por área

- **Frontend:** [`frontend/README.md`](../frontend/README.md) — guia rápido de
  instalação, scripts e organização do código React.
- **Backend:** [`backend/README.md`](../backend/README.md) — guia rápido da API
  Spring Boot, configuração e endpoints.
- **API interativa:** com o backend em execução, acesse
  `http://localhost:8080/docs` (Swagger UI) ou
  `http://localhost:8080/v3/api-docs` (OpenAPI JSON).
- **Banco de dados:** [`database/README.md`](../database/README.md).

---

## Como ler esta documentação

1. Comece pela [visão geral](visao-geral.md) para entender o produto.
2. Consulte a [arquitetura](arquitetura.md) e o [modelo de dados](modelo-de-dados.md)
   antes de alterar regras de negócio.
3. Use a [referência da API](api.md) ao integrar ou testar o backend.
4. Siga o [guia de instalação](instalacao.md) para rodar o projeto localmente.
5. Antes de abrir um PR, leia [contribuição](contribuicao.md) e
   [testes e qualidade](testes-e-qualidade.md).

---

## Convenções

- Documentos em **Markdown**, codificação **UTF-8**.
- Diagramas em **Mermaid** quando possível; imagens/SVG ficam em
  `planejamento/` ou junto ao documento que as utiliza.
- Exemplos de API usam `http://localhost:8080` como base.
- Nenhuma credencial real, token ou dado pessoal deve ser versionado.
- A documentação atual tem prioridade sobre os documentos de planejamento
  quando houver divergência. As diferenças estão registradas em
  [`planejamento/README.md`](planejamento/README.md).

---

## Versão

- Documentação revisada em **novembro de 2026**.
- Corresponde ao frontend React/TypeScript e ao backend Spring Boot presentes
  neste repositório.
