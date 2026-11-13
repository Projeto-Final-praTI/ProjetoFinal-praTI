# Planejamento

Esta pasta preserva os documentos produzidos na **fase de planejamento** da ZELO,
antes e durante o início do desenvolvimento. Eles registram a visão original do
produto, as regras de decisão e os critérios de aceite acordados na época.

> **Importante:** estes documentos são **históricos**. A implementação evoluiu e,
> em vários pontos, difere do que foi planejado. Quando houver conflito, vale a
> documentação atual em [`../`](../README.md).

---

## 1. Documentos

| Arquivo | Conteúdo |
|---------|----------|
| [`especificacoes-tecnicas-ZELO.md`](especificacoes-tecnicas-ZELO.md) | Especificação funcional e técnica original, com perfis, regras, segurança e escopo |
| [`matriz-de-decisao-ZELO.md`](matriz-de-decisao-ZELO.md) | Matriz de decisão do produto (MD-01 a MD-51) |
| [`criterios-de-aceite.md`](criterios-de-aceite.md) | Critérios de aceite originalmente previstos |
| [`ZELO-diagrama-de-fluxo-de-navegação.svg`](ZELO-diagrama-de-fluxo-de-navegação.svg) | Diagrama do fluxo de navegação planejado |

Os arquivos foram mantidos com os nomes originais para preservar a rastreabilidade
com a entrega de planejamento. O conteúdo não foi reescrito.

---

## 2. O que permanece válido

Muitas decisões do planejamento foram implementadas e continuam sendo a base do
produto:

- mapa como tela principal e acesso público para consulta;
- cadastro e autenticação para ações de escrita;
- registro de ocorrências com foto e localização;
- confirmação comunitária e comentários;
- moderação institucional e ciclo de status;
- alertas de risco com severidade;
- controle de acesso por perfil;
- preocupação com privacidade, minimização de dados e segurança;
- documentação como parte da entrega.

---

## 3. Divergências em relação ao implementado

| Tema | Planejado | Implementado | Onde consultar |
|------|-----------|--------------|----------------|
| Distância para criar ocorrência | Até **300 m** | Até **500 m** (acima disso, `422`) | [requisitos](../requisitos.md), [api](../api.md) |
| Distância para reagir | Até **700 m** | Upvote **idempotente sem limite de distância** | [requisitos](../requisitos.md) |
| Perfis | Visitante, Usuário, Analista, Gestor, Administrador | `USER`, `FISCAL`, `GESTOR`, `ROOT` | [backend](../backend.md) |
| Status da ocorrência | Incluía **Reaberta** | Apenas `ABERTO`, `EM_ATENDIMENTO`, `RESOLVIDO` | [modelo de dados](../modelo-de-dados.md) |
| Evidência na resolução | Foto obrigatória ao resolver | Resolução com nota e histórico; foto não é exigida | [api](../api.md) |
| Detecção de duplicidade | Sugerir ocorrência semelhante próxima | Não implementada automaticamente | — |
| Reputação/confiança comunitária | Pontuação e medidas progressivas | Não implementadas | [segurança](../seguranca-e-lgpd.md) |
| Severidade informada pelo usuário | Usuário classificava severidade | Severidade existe apenas em alertas climáticos/oficiais | [modelo de dados](../modelo-de-dados.md) |
| Alertas de fenômenos naturais | Emissão por usuário/institucional | Alertas **automáticos** (Open-Meteo) + **oficiais** (gestor/root) | [visão geral](../visao-geral.md) |
| Notificações | Níveis de comunicação e alertas críticos | Banner no app; sem push/e-mail | [visão geral](../visao-geral.md) |
| Painel administrativo | Usuários, categorias, parâmetros, indicadores | Usuários, cargos, pontos, alertas e estatísticas; sem gestão de categorias/parâmetros | [api](../api.md) |
| Auditoria | Eventos auditáveis amplos | Histórico de status com autor, data e nota | [modelo de dados](../modelo-de-dados.md) |
| Área de responsabilidade | Vínculo geográfico institucional | Campo `city` (texto) + geocodificação reversa | [modelo de dados](../modelo-de-dados.md) |
| Retenção e descarte | Política definida | Recomendações documentadas; sem rotina automática | [segurança](../seguranca-e-lgpd.md) |
| Banco | PostgreSQL ou MySQL | **PostgreSQL + PostGIS** | [arquitetura](../arquitetura.md) |
| Migrações | Previstas | `ddl-auto=update`, sem migrações versionadas | [deploy](../deploy.md) |
| Frontend | React/Vite | React 18 + TypeScript + Vite 5 | [frontend](../frontend.md) |
| Publicação | Não detalhada | GitHub Pages (frontend) e Docker/nginx | [deploy](../deploy.md) |

---

## 4. Como usar estes documentos

- **Entender a intenção original:** leia a especificação e a matriz de decisão.
- **Verificar critérios acordados:** consulte os critérios de aceite.
- **Comparar com o presente:** use a tabela de divergências acima e os documentos
  atuais.
- **Evoluir o produto:** trate o planejamento como referência, não como contrato
  imutável. Mudanças devem ser registradas em
  [decisoes-tecnicas.md](../decisoes-tecnicas.md).

---

## 5. Observação sobre nomenclatura

Os documentos usam termos como "ocorrência", "reação" e "analista institucional".
Na implementação atual, os termos equivalentes são:

| Planejamento | Implementação |
|--------------|---------------|
| Ocorrência | Ponto crítico / incidente |
| Reação | Upvote / confirmação |
| Analista institucional | `FISCAL` |
| Gestor institucional | `GESTOR` |
| Administrador do sistema | `ROOT` |
| Usuário registrado | `USER` |
