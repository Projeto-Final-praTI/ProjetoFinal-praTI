# Visão geral

## 1. Contexto

Problemas de infraestrutura urbana — buracos, pontes comprometidas, alagamentos,
quedas de árvore e deslizamentos — são percebidos primeiro por quem circula pela
cidade. A comunicação entre cidadãos e órgãos públicos, porém, costuma ser
fragmentada: canais diferentes, falta de localização precisa, ausência de
acompanhamento e pouca transparência sobre o que foi resolvido.

A **ZELO** nasce para centralizar esse fluxo em uma única plataforma
georreferenciada, combinando participação comunitária, gestão municipal e
alertas de risco.

## 2. Solução

A ZELO é uma aplicação web em que o **mapa é a tela principal**. Sobre ele:

- cidadãos registram pontos críticos com foto e localização;
- a comunidade confirma, comenta e acompanha cada ocorrência;
- fiscais e gestores municipais atualizam o status e operam dentro da própria
  cidade;
- a população recebe **alertas climáticos automáticos** e **alertas oficiais**
  da gestão;
- denúncias de **pessoas desaparecidas** passam por moderação e geram
  pré-alertas imediatos para quem está próximo.

O acesso é público para consulta e exige autenticação para ações que criam ou
alteram informações.

## 3. Público-alvo

| Perfil | Necessidade principal |
|--------|-----------------------|
| Cidadão | Registrar e acompanhar problemas da cidade com praticidade |
| Comunidade | Confirmar ocorrências e trocar informações |
| Fiscal municipal | Atualizar o andamento dos pontos da sua cidade |
| Gestor municipal | Administrar usuários, pontos e alertas locais |
| Administrador (ROOT) | Visão global, gestão de cargos e alertas em todo o território |
| Visitante | Consultar mapa, alertas e ocorrências sem cadastro |

## 4. Funcionalidades

### Pontos críticos

- Registro com título, categoria, descrição, localização e de 1 a 5 imagens.
- Categorias: `BURACO`, `PONTE_QUEBRADA`, `ALAGAMENTO`, `QUEDA_ARVORE`,
  `DESLIZAMENTO`, `OUTROS`.
- Status: `ABERTO`, `EM_ATENDIMENTO`, `RESOLVIDO`.
- Mapa com marcadores, agrupamento (cluster) e filtro por raio.
- Confirmação comunitária (upvote) idempotente: uma por usuário por ponto.
- Comentários e linha do tempo de status com nota e autor.
- Filtro temporal de duas pontas para visualizar o período desejado.

### Alertas

- **Climáticos automáticos:** gerados a partir da previsão horária do
  Open-Meteo para chuva, calor, frio e vento, com severidade
  `AMARELO`, `LARANJA` ou `VERMELHO`.
- **Oficiais:** publicados por gestores/root com duração e alcance global ou
  local; expiram automaticamente.
- Banner de destaque com todos os alertas ativos, priorizando os mais críticos.

### Pessoas desaparecidas

- Denúncia com foto obrigatória e dados da pessoa.
- Pré-alerta imediato de **1 km por 10 minutos** quando o denunciante informa a
  localização, antes da moderação.
- Fila de moderação para fiscal/gestor/root aprovar ou recusar.
- Após aprovação, o alerta ganha raio e duração definidos pelo moderador.
- Chat de avistamentos com atualização periódica.

### Administração

- Gestão de usuários e cargos com escopo por cidade.
- Listagem e exclusão de pontos críticos.
- Alertas oficiais.
- Indicadores globais (root): usuários por papel, pontos por status e cidades.
- Exclusão de usuário com opção de manter os pontos (autoria anonimizada) ou
  apagá-los.

### Conta e segurança

- Cadastro e login com JWT.
- Atualização de nome, cidade e senha.
- RBAC com quatro papéis e isolamento por cidade para operação municipal.
- Senhas com BCrypt; CPF e hash de senha nunca são expostos pela API.

## 5. Escopo da versão atual

### Dentro do escopo

- Aplicação web responsiva (desktop e celular).
- Mapa, pontos críticos, confirmações, comentários e linha do tempo.
- Alertas climáticos e oficiais.
- Denúncias de pessoas desaparecidas com moderação.
- Painel administrativo com escopo por cidade.
- API REST documentada via OpenAPI/Swagger.
- Deploy em containers (frontend nginx + backend Spring Boot) e pipeline de
  build do frontend.

### Fora do escopo atual

- Aplicativo móvel nativo.
- Notificações push.
- Integração direta com sistemas de prefeituras.
- Migrações versionadas de banco (hoje o schema é atualizado pelo Hibernate).
- Assinatura digital ou comprovação fotográfica obrigatória na resolução.
- Reputação automatizada de usuários e antifraude avançado.

## 6. Glossário

| Termo | Significado |
|-------|-------------|
| **Ponto crítico / ocorrência** | Registro georreferenciado de um problema urbano |
| **Upvote / confirmação** | Apoio da comunidade a um ponto crítico existente |
| **Pré-alerta** | Alerta imediato de pessoa desaparecida, de 1 km por 10 min, antes da moderação |
| **Moderação** | Análise de denúncias de desaparecidos por fiscal/gestor/root |
| **RBAC** | Controle de acesso baseado em papéis |
| **Escopo por cidade** | Restrição de fiscal/gestor à própria cidade de atuação |
| **PostGIS** | Extensão geoespacial do PostgreSQL |
| **JWT** | Token assinado usado para autenticação stateless |
| **Open-Meteo** | Serviço externo de previsão do tempo |
| **Nominatim** | Serviço de geocodificação reversa do OpenStreetMap |

## 7. Indicadores de sucesso

- Ocorrências registradas com localização e evidência fotográfica.
- Tempo entre registro e primeira atualização institucional.
- Percentual de ocorrências resolvidas.
- Participação da comunidade (confirmações e comentários).
- Alertas emitidos e alcance estimado.
- Denúncias de desaparecidos moderadas dentro do prazo.
