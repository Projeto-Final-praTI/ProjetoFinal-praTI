# Requisitos

Este documento descreve os requisitos da versão atual da ZELO. Os critérios de
aceite originalmente planejados estão preservados em
[`planejamento/criterios-de-aceite.md`](planejamento/criterios-de-aceite.md); as
diferenças em relação ao implementado estão registradas em
[`planejamento/README.md`](planejamento/README.md).

---

## 1. Requisitos funcionais

### 1.1 Autenticação e conta

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-01 | O visitante deve acessar mapa, ocorrências públicas e alertas sem cadastro | Must |
| RF-02 | O usuário deve poder cadastrar-se com nome, e-mail, CPF, senha e cidade opcional | Must |
| RF-03 | O sistema deve autenticar por e-mail e senha, emitindo um token JWT | Must |
| RF-04 | O usuário autenticado deve poder atualizar nome, cidade e senha | Must |
| RF-05 | O sistema deve impedir e-mail e CPF duplicados | Must |
| RF-06 | A nova senha deve ter no mínimo 6 caracteres e exigir a senha atual | Must |
| RF-07 | O sistema deve encerrar a sessão quando o token estiver expirado ou inválido | Must |

### 1.2 Pontos críticos

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-08 | O usuário autenticado deve registrar um ponto com título, categoria, descrição, localização e imagens | Must |
| RF-09 | O registro deve exigir pelo menos 1 e no máximo 5 imagens | Must |
| RF-10 | O autor deve estar a no máximo 500 m do local informado | Must |
| RF-11 | O sistema deve resolver a cidade do ponto por geocodificação reversa quando não informada | Should |
| RF-12 | O visitante deve visualizar pontos próximos por coordenada e raio | Must |
| RF-13 | O visitante deve abrir o detalhe de um ponto com autor, imagens, comentários e histórico | Must |
| RF-14 | O usuário autenticado deve comentar em um ponto | Must |
| RF-15 | O usuário autenticado deve confirmar um ponto, no máximo uma vez por ponto | Must |
| RF-16 | Fiscal, gestor e root devem alterar o status com nota e registro na linha do tempo | Must |
| RF-17 | O autor, o root e operadores da cidade devem excluir um ponto conforme permissão | Must |
| RF-18 | O mapa deve permitir filtrar os pontos por período (duas pontas) | Should |
| RF-19 | O mapa deve agrupar marcadores próximos (cluster) | Should |

### 1.3 Alertas

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-20 | O sistema deve gerar alertas climáticos automáticos a partir da previsão horária | Must |
| RF-21 | Os alertas devem ter severidade `AMARELO`, `LARANJA` ou `VERMELHO` | Must |
| RF-22 | O sistema deve exibir clima atual e alertas ativos para a coordenada consultada | Must |
| RF-23 | Gestor e root devem publicar alertas oficiais com duração e alcance | Must |
| RF-24 | Alertas oficiais devem expirar automaticamente | Must |
| RF-25 | O banner deve priorizar alertas críticos e pessoas desaparecidas | Should |
| RF-26 | O visitante não deve publicar alerta oficial | Must |

### 1.4 Pessoas desaparecidas

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-27 | O usuário autenticado deve enviar denúncia com foto obrigatória e dados da pessoa | Must |
| RF-28 | A denúncia deve nascer com status `PENDENTE` | Must |
| RF-29 | Quando a localização for informada, o envio deve disparar pré-alerta de 1 km por 10 min | Must |
| RF-30 | Fiscal, gestor e root devem listar denúncias da própria cidade (root: todas) | Must |
| RF-31 | O moderador deve aprovar ou recusar uma denúncia pendente | Must |
| RF-32 | Na aprovação, o moderador deve definir duração (5 min a 7 dias) e alcance | Must |
| RF-33 | O alcance local deve usar raio entre 1 km e 200 km; o global é exclusivo do root | Must |
| RF-34 | Apenas denúncias aprovadas e não expiradas devem aparecer publicamente | Must |
| RF-35 | O usuário autenticado deve comentar/avisar com texto e imagem opcional | Must |
| RF-36 | O chat do alerta deve atualizar periodicamente enquanto estiver aberto | Should |

### 1.5 Administração

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-37 | Gestor e root devem listar usuários, com busca e escopo por cidade | Must |
| RF-38 | Root deve alterar qualquer cargo; gestor apenas `USER` ⇄ `FISCAL` na própria cidade | Must |
| RF-39 | Gestor e root devem listar e excluir pontos críticos no seu escopo | Must |
| RF-40 | Root deve visualizar indicadores globais | Must |
| RF-41 | Root deve excluir usuário, optando por manter ou apagar seus pontos | Must |
| RF-42 | O sistema deve manter autoria anonimizada quando os pontos forem preservados | Must |
| RF-43 | Gestor e root devem listar, criar e remover alertas oficiais | Must |

### 1.6 Histórico e auditoria

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-44 | Toda mudança de status deve gerar entrada imutável com autor, data e nota | Must |
| RF-45 | O histórico de status deve ser público | Must |
| RF-46 | A exclusão de usuário deve preservar a integridade dos pontos mantidos | Must |

---

## 2. Requisitos não funcionais

| ID | Requisito | Categoria |
|----|-----------|-----------|
| RNF-01 | Interface responsiva para desktop e celular, com mapa em tela cheia | Usabilidade |
| RNF-02 | API REST stateless autenticada por JWT | Segurança |
| RNF-03 | Senhas armazenadas com BCrypt; CPF e hash nunca retornados | Segurança |
| RNF-04 | Controle de acesso por papel e por cidade no backend | Segurança |
| RNF-05 | Upload limitado a 10 MB por arquivo e 30 MB por requisição | Segurança |
| RNF-06 | Consultas geoespaciais eficientes com PostGIS | Desempenho |
| RNF-07 | Build do frontend com TypeScript estrito e sem variáveis não usadas | Manutenibilidade |
| RNF-08 | Documentação OpenAPI/Swagger disponível em `/docs` | Manutenibilidade |
| RNF-09 | Erros da API em formato JSON padronizado | Usabilidade |
| RNF-10 | Aplicação executável via Docker (frontend e backend) | Operação |
| RNF-11 | Dados pessoais coletados de forma mínima e com finalidade definida | LGPD |
| RNF-12 | Configurações sensíveis por variáveis de ambiente | Segurança |
| RNF-13 | CORS restrito às origens configuradas | Segurança |
| RNF-14 | Frontend e backend devem funcionar atrás de proxy reverso | Operação |
| RNF-15 | O sistema deve continuar funcional quando Open-Meteo ou Nominatim falharem | Disponibilidade |

---

## 3. Regras de negócio

| ID | Regra |
|----|-------|
| RN-01 | Criar ponto crítico exige autenticação e pelo menos uma imagem |
| RN-02 | O autor deve estar a no máximo **500 m** do local do ponto |
| RN-03 | Cada usuário pode confirmar um ponto no máximo uma vez; confirmações repetidas são ignoradas |
| RN-04 | O autor pode excluir o próprio ponto; root exclui qualquer um; fiscal/gestor apenas da própria cidade |
| RN-05 | Apenas fiscal, gestor e root alteram status |
| RN-06 | Fiscal/gestor só alteram pontos da própria cidade; ponto sem cidade só é gerido por root |
| RN-07 | O status inicial é `ABERTO`; a transição gera histórico com autor, data e nota |
| RN-08 | A cidade do ponto é resolvida por geocodificação reversa quando ausente; falha não bloqueia o registro |
| RN-09 | Alertas climáticos são gerados por limites configuráveis de chuva, calor, frio e vento |
| RN-10 | Alertas oficiais expiram automaticamente e podem ser globais (root) ou locais |
| RN-11 | Denúncia de desaparecido exige foto e nasce `PENDENTE` |
| RN-12 | O pré-alerta de desaparecido dura 10 min e cobre 1 km |
| RN-13 | A aprovação de desaparecido exige duração entre 5 min e 7 dias |
| RN-14 | O raio local de desaparecido deve ficar entre 1 km e 200 km |
| RN-15 | Apenas denúncias aprovadas e não expiradas são públicas |
| RN-16 | Gestor só altera cargos `USER` ⇄ `FISCAL` e apenas na própria cidade |
| RN-17 | Gestor não altera o próprio cargo nem cargos de gestor/root |
| RN-18 | Root pode excluir usuário mantendo os pontos com autoria anonimizada |
| RN-19 | Cidade vazia em fiscal/gestor impede operação municipal (403) |
| RN-20 | O token JWT é stateless e expira em 24 h por padrão |

---

## 4. Critérios de aceite da versão atual

Os critérios abaixo resumem o que deve ser validado antes de considerar uma
entrega concluída. A lista completa planejada está em
[`planejamento/criterios-de-aceite.md`](planejamento/criterios-de-aceite.md).

- [ ] Aplicação acessível por URL e responsiva.
- [ ] Consulta pública de mapa e alertas sem cadastro.
- [ ] Cadastro, login e logout funcionando.
- [ ] Registro de ponto com localização e imagens.
- [ ] Bloqueio de registro a mais de 500 m.
- [ ] Ponto visível no mapa e no detalhe.
- [ ] Comentário e confirmação funcionando; confirmação duplicada ignorada.
- [ ] Alteração de status com histórico.
- [ ] Exclusão de ponto respeitando autor/cidade/root.
- [ ] Alertas climáticos e oficiais visíveis e com severidade.
- [ ] Denúncia de desaparecido com pré-alerta e moderação.
- [ ] Painel administrativo com escopo por cidade.
- [ ] Erros padronizados e tratamento no frontend.
- [ ] Build do frontend e da API sem erros.
- [ ] Credenciais e segredos fora do código.
