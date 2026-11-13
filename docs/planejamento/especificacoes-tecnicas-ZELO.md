# ZELO
## Especificação Técnica

**Sistema de monitoramento, registro e comunicação de riscos, ocorrências e problemas de interesse público**

**Primeira versão — solução web para visualização geográfica, comunicação de alertas, registro de ocorrências e acompanhamento institucional**

| Campo | Definição |
|---|---|
| **Nome da solução** | ZELO |
| **Tipo** | A definir |
| **Finalidade principal** | Promover a segurança pública por meio da comunicação de alertas, mapeamento colaborativo de problemas e acompanhamento institucional de ocorrências |
| **Tecnologia principal** | A definir |
| **Banco de dados** | A definir |
| **Responsável pela elaboração** | A definir |
| **Área responsável** | A definir |
| **Versão** | 0.1 |
| **Data** | 02/09/2026 |
| **Classificação** | A definir |
| **Status** | Minuta técnica para validação |

---

# 1. Controle do documento

| Campo | Definição |
|---|---|
| **Nome do documento** | Especificação Técnica — ZELO |
| **Objetivo principal** | Definir o escopo funcional, técnico, operacional e os critérios de aceite da primeira versão da aplicação |
| **Uso esperado** | Solicitação de desenvolvimento, alinhamento técnico, implementação, homologação e evolução controlada |
| **Público-alvo** | Desenvolvedores, responsáveis pela homologação, gestores, instituições participantes e demais envolvidos na implantação |
| **Tom do documento** | Técnico, objetivo, orientado à segurança, rastreabilidade e entrega |
| **Status** | Minuta técnica para validação |
| **Classificação** | A definir |

## 1.1 Histórico de versões

| Versão | Data | Responsável | Descrição |
|---|---|---|---|
| 0.1 | 02/09/2026 | A definir | Primeira consolidação da especificação técnica do ZELO |

## 1.2 Aprovação formal

| Papel | Responsável | Responsabilidade | Assinatura/Data |
|---|---|---|---|
| Elaboração | A definir | Consolidação técnica e manutenção da especificação | |
| Validação funcional | A definir | Validação das regras, fluxos, campos e critérios de aceite | |
| Aprovação da entrega | A definir | Aceite para desenvolvimento, homologação e publicação | |

---

# 2. Sumário

1. [Controle do documento](#1-controle-do-documento)
   - 1.1 [Histórico de versões](#11-histórico-de-versões)
   - 1.2 [Aprovação formal](#12-aprovação-formal)
2. [Sumário](#2-sumário)
3. [Sumário executivo](#3-sumário-executivo)
4. [Objetivo da solução](#4-objetivo-da-solução)
   - 4.1 [Objetivo geral](#41-objetivo-geral)
   - 4.2 [Objetivos específicos](#42-objetivos-específicos)
5. [Premissas e diretrizes da primeira versão](#5-premissas-e-diretrizes-da-primeira-versão)
6. [Escopo da primeira versão](#6-escopo-da-primeira-versão)
7. [Acesso à aplicação](#7-acesso-à-aplicação)
   - 7.1 [Acesso público](#71-acesso-público)
8. [Perfis e níveis de acesso](#8-perfis-e-níveis-de-acesso)
   - 8.1 [Visitante](#81-visitante)
   - 8.2 [Usuário registrado](#82-usuário-registrado)
   - 8.3 [Analista institucional](#83-analista-institucional)
   - 8.4 [Gestor institucional](#84-gestor-institucional)
   - 8.5 [Administrador do sistema](#85-administrador-do-sistema)
9. [Cadastro e autenticação](#9-cadastro-e-autenticação)
10. [Mapa e geolocalização](#10-mapa-e-geolocalização)
    - 10.1 [Localização da ocorrência](#101-localização-da-ocorrência)
    - 10.2 [Localização do usuário](#102-localização-do-usuário)
11. [Registro de ocorrências](#11-registro-de-ocorrências)
    - 11.1 [Dados mínimos](#111-dados-mínimos)
    - 11.2 [Estado inicial](#112-estado-inicial)
12. [Categorias de ocorrências](#12-categorias-de-ocorrências)
13. [Regras de proximidade](#13-regras-de-proximidade)
    - 13.1 [Criação de ocorrência](#131-criação-de-ocorrência)
    - 13.2 [Reação à ocorrência](#132-reação-à-ocorrência)
    - 13.3 [Precisão do GPS](#133-precisão-do-gps)
14. [Evidências fotográficas](#14-evidências-fotográficas)
15. [Validação comunitária](#15-validação-comunitária)
    - 15.1 [Regras](#151-regras)
    - 15.2 [Confiança comunitária](#152-confiança-comunitária)
16. [Proteção contra abuso, fraude e manipulação](#16-proteção-contra-abuso-fraude-e-manipulação)
    - 16.1 [Limitação de frequência](#161-limitação-de-frequência)
    - 16.2 [Medidas progressivas](#162-medidas-progressivas)
    - 16.3 [Análise de localização](#163-análise-de-localização)
17. [Reputação e confiabilidade dos usuários](#17-reputação-e-confiabilidade-dos-usuários)
    - 17.1 [Utilização da confiabilidade](#171-utilização-da-confiabilidade)
18. [Estados e ciclo de vida das ocorrências](#18-estados-e-ciclo-de-vida-das-ocorrências)
    - 18.1 [Fluxo principal](#181-fluxo-principal)
    - 18.2 [Fluxos alternativos](#182-fluxos-alternativos)
    - 18.3 [Confiança e estado](#183-confiança-e-estado)
19. [Identificação de duplicidades](#19-identificação-de-duplicidades)
    - 19.1 [Sugestão de ocorrência existente](#191-sugestão-de-ocorrência-existente)
    - 19.2 [Confirmação de duplicidade](#192-confirmação-de-duplicidade)
20. [Gestão institucional das ocorrências](#20-gestão-institucional-das-ocorrências)
    - 20.1 [Área de responsabilidade](#201-área-de-responsabilidade)
    - 20.2 [Usuários institucionais](#202-usuários-institucionais)
    - 20.3 [Atribuição](#203-atribuição)
21. [Inspeção e acompanhamento](#21-inspeção-e-acompanhamento)
    - 21.1 [Registro de inspeção](#211-registro-de-inspeção)
    - 21.2 [Acompanhamento](#212-acompanhamento)
22. [Resolução e comprovação](#22-resolução-e-comprovação)
    - 22.1 [Evidência da resolução](#221-evidência-da-resolução)
    - 22.2 [Impedimento de resolução](#222-impedimento-de-resolução)
    - 22.3 [Reabertura](#223-reabertura)
23. [Alertas de fenômenos naturais e situações críticas](#23-alertas-de-fenômenos-naturais-e-situações-críticas)
    - 23.1 [Ocorrência](#231-ocorrência)
    - 23.2 [Alerta](#232-alerta)
    - 23.3 [Informações mínimas de um alerta](#233-informações-mínimas-de-um-alerta)
    - 23.4 [Emissão de alertas](#234-emissão-de-alertas)
24. [Severidade e prioridade](#24-severidade-e-prioridade)
    - 24.1 [Severidade informada pelo usuário](#241-severidade-informada-pelo-usuário)
    - 24.2 [Classificação institucional](#242-classificação-institucional)
    - 24.3 [Prioridade](#243-prioridade)
    - 24.4 [Infraestrutura crítica](#244-infraestrutura-crítica)
25. [Notificações e comunicação](#25-notificações-e-comunicação)
    - 25.1 [Níveis de comunicação](#251-níveis-de-comunicação)
    - 25.2 [Comunicação de alertas críticos](#252-comunicação-de-alertas-críticos)
    - 25.3 [Encerramento de alertas](#253-encerramento-de-alertas)
    - 25.4 [Comunicação futura](#254-comunicação-futura)
26. [Painel administrativo](#26-painel-administrative)
    - 26.1 [Funcionalidades](#261-funcionalidades)
    - 26.2 [Gestão de usuários](#262-gestão-de-usuários)
    - 26.3 [Gestão de categorias](#263-gestão-de-categorias)
    - 26.4 [Gestão de parâmetros](#264-gestão-de-parâmetros)
27. [Indicadores](#27-indicadores)
    - 27.1 [Indicadores gerais](#271-indicadores-gerais)
    - 27.2 [Indicadores por categoria](#272-indicadores-por-categoria)
    - 27.3 [Indicadores geográficos](#273-indicadores-geográficos)
    - 27.4 [Indicadores de atendimento](#274-indicadores-de-atendimento)
    - 27.5 [Indicadores de confiabilidade](#275-indicadores-de-confiabilidade)
28. [Histórico e auditoria](#28-histórico-e-auditoria)
    - 28.1 [Eventos auditáveis](#281-eventos-auditáveis)
    - 28.2 [Imutabilidade](#282-imutabilidade)
    - 28.3 [Rastreabilidade de alterações](#283-rastreabilidade-de-alterações)
29. [Privacidade e segurança](#29-privacidade-e-segurança)
    - 29.1 [Informações públicas](#291-informações-públicas)
    - 29.2 [Dados do usuário](#292-dados-do-usuário)
    - 29.3 [Localização utilizada para validação](#293-localização-utilizada-para-validação)
    - 29.4 [Minimização de dados](#294-minimização-de-dados)
    - 29.5 [Proteção de credenciais](#295-proteção-de-credenciais)
    - 29.6 [Controle de acesso](#296-controle-de-acesso)
    - 29.7 [Validação de entradas](#297-validação-de-entradas)
    - 29.8 [Upload de arquivos](#298-upload-de-arquivos)
    - 29.9 [Proteção contra conteúdo malicioso](#299-proteção-contra-conteúdo-malicioso)
    - 29.10 [Tratamento de erros](#2910-tratamento-de-erros)
    - 29.11 [Sessões](#2911-sessões)
    - 29.12 [Logs de segurança](#2912-logs-de-segurança)
    - 29.13 [Proteção contra abuso](#2913-proteção-contra-abuso)
    - 29.14 [Integridade das informações](#2914-integridade-das-informações)
    - 29.15 [Auditoria de segurança](#2915-auditoria-de-segurança)
    - 29.16 [Privacidade por padrão](#2916-privacidade-por-padrão)
    - 29.17 [Retenção e descarte](#2917-retenção-e-descarte)
    - 29.18 [Segurança das integrações futuras](#2918-segurança-das-integrações-futuras)
30. [Requisitos funcionais](#30-requisitos-funcionais)
31. [Requisitos técnicos](#31-requisitos-técnicos)
32. [Estrutura modular sugerida](#32-estrutura-modular-sugerida)
33. [Preparação para integrações futuras](#33-preparação-para-integrações-futuras)
34. [Itens fora do escopo inicial](#34-itens-fora-do-escopo-inicial)
35. [Organização sugerida da entrega](#35-organização-sugerida-da-entrega)
36. [Resultado esperado](#36-resultado-esperado)
37. [Resumo executivo do escopo](#37-resumo-executivo-do-escopo)
38. [Registro de validação](#38-registro-de-validação)
    - 38.1 [Pendências para definição](#381-pendências-para-definição)


---

# 3. Sumário executivo

O ZELO deverá ser uma aplicação web destinada à promoção da segurança pública por meio da combinação de **informação geográfica, comunicação de alertas e participação colaborativa da população**.

A aplicação deverá permitir que qualquer pessoa acesse o sistema sem necessidade de cadastro para consultar o mapa, visualizar alertas e consultar ocorrências públicas.

O registro de novos problemas deverá ser reservado a usuários autenticados. Esses usuários poderão informar ocorrências observadas em sua região, registrar sua localização, adicionar evidências fotográficas e participar da validação comunitária de problemas registrados por outros usuários.

O sistema deverá utilizar a localização geográfica do usuário como mecanismo de segurança e confiabilidade. Na primeira versão, a criação de uma ocorrência deverá exigir que o usuário esteja fisicamente próximo do local informado, utilizando como parâmetro inicial uma distância máxima de **300 metros**.

A participação na validação comunitária deverá utilizar uma segunda regra de proximidade, inicialmente definida como **700 metros** do local da ocorrência.

O ZELO deverá diferenciar:

- a existência de uma ocorrência registrada;
- a confiança da comunidade na ocorrência;
- a avaliação institucional;
- o atendimento;
- a resolução efetiva do problema.

A resolução de uma ocorrência deverá ser realizada somente por perfil institucional autorizado e deverá exigir evidência fotográfica do atendimento realizado.

Além das ocorrências locais, a aplicação deverá permitir a apresentação de **alertas relacionados a fenômenos naturais, riscos ou situações de emergência**, podendo utilizar recursos visuais e sonoros proporcionais ao nível de severidade.

A arquitetura deverá ser preparada para evolução futura, incluindo integração com fontes externas de alertas, notificações avançadas, WhatsApp, envio de vídeos e outras fontes de dados.

---

# 4. Objetivo da solução

## 4.1 Objetivo geral

Desenvolver uma plataforma digital capaz de:

- comunicar situações de risco;
- mapear problemas urbanos, rodoviários e ambientais;
- permitir participação controlada da população;
- facilitar a identificação e priorização de ocorrências;
- fornecer informações geográficas para tomada de decisão;
- permitir acompanhamento institucional;
- registrar evidências de atendimento e resolução;
- preservar histórico e rastreabilidade das informações.

## 4.2 Objetivos específicos

O ZELO deverá:

1. disponibilizar um mapa centralizado de ocorrências e alertas;
2. permitir consulta pública sem necessidade de cadastro;
3. permitir a criação de ocorrências por usuários autenticados;
4. utilizar geolocalização para reduzir registros falsos ou remotos;
5. utilizar evidências fotográficas como parte da comprovação;
6. permitir validação comunitária controlada;
7. reduzir ações fraudulentas e manipulação de votos;
8. possibilitar que instituições acompanhem e tratem ocorrências de sua responsabilidade;
9. manter histórico das alterações;
10. permitir comunicação visual e sonora de situações críticas;
11. permitir indicadores e consultas administrativas;
12. manter estrutura compatível com futuras integrações.

---

# 5. Premissas e diretrizes da primeira versão

| Diretriz | Aplicação na entrega |
|---|---|
| **Simplicidade operacional** | Interface objetiva, fluxo simples e foco nas funções essenciais |
| **Centralização** | Alertas, ocorrências, evidências, reações e históricos deverão estar vinculados a um repositório central |
| **Geolocalização** | Localização será parte das principais regras de segurança da aplicação |
| **Rastreabilidade** | Alterações relevantes deverão registrar autor, data/hora, ação e valores envolvidos |
| **Controle de acesso** | Funcionalidades críticas deverão estar vinculadas a perfis autorizados |
| **Confiabilidade** | Nenhuma ocorrência deverá ser considerada verdadeira ou falsa com base em uma única interação |
| **Baixo acoplamento** | Integrações externas deverão permanecer separadas das regras centrais |
| **Preservação histórica** | Registros não deverão ser eliminados simplesmente por mudança de estado |
| **Parametrização** | Categorias, níveis de severidade, distâncias e outros parâmetros deverão ser configuráveis |
| **Evolução controlada** | Recursos avançados poderão ser adicionados posteriormente sem reestruturação do núcleo da aplicação |

---

# 6. Escopo da primeira versão

A primeira versão deverá contemplar:

- acesso público;
- cadastro e autenticação;
- mapa geográfico;
- visualização de ocorrências;
- registro de ocorrências;
- categorias;
- localização geográfica;
- validação de proximidade;
- evidências fotográficas;
- validação comunitária;
- controle de reações;
- mecanismos básicos antifraude;
- histórico;
- gestão de usuários;
- perfis institucionais;
- gestão de instituições;
- acompanhamento de ocorrências;
- atualização de estados;
- registro de inspeção;
- resolução com comprovação fotográfica;
- alertas;
- níveis de severidade;
- notificações básicas;
- painel administrativo;
- indicadores;
- auditoria;
- exportação de dados, quando aplicável;
- preparação arquitetural para integrações futuras.

---

# 7. Acesso à aplicação

A aplicação deverá possuir uma área pública que permita o acesso às informações sem necessidade de autenticação.

A tela inicial deverá apresentar, no mínimo:

- mapa principal;
- alertas ativos;
- ocorrências relevantes;
- filtros;
- consulta de detalhes;
- opção de autenticação;
- opção de cadastro;
- acesso à criação de ocorrência para usuários autenticados.

## 7.1 Acesso público

O visitante não autenticado poderá:

- visualizar o mapa;
- consultar ocorrências públicas;
- consultar detalhes públicos;
- visualizar alertas;
- aplicar filtros;
- consultar regiões de interesse.

O visitante não poderá:

- criar ocorrências;
- reagir a ocorrências;
- alterar informações;
- acessar funcionalidades institucionais.

---

# 8. Perfis e níveis de acesso

O sistema deverá trabalhar com perfis distintos.

## 8.1 Visitante

Perfil sem autenticação.

Permissões:

- visualizar mapa;
- visualizar alertas;
- consultar ocorrências públicas;
- consultar informações públicas.

## 8.2 Usuário registrado

Permissões:

- criar ocorrências;
- anexar fotografias;
- reagir a ocorrências;
- acompanhar ocorrências permitidas;
- visualizar seu histórico;
- gerenciar seus dados.

## 8.3 Analista institucional

Permissões:

- consultar ocorrências de sua área;
- avaliar ocorrências;
- registrar observações;
- realizar ou registrar inspeções;
- atualizar estados permitidos;
- anexar evidências;
- acompanhar indicadores de sua área.

## 8.4 Gestor institucional

Permissões adicionais:

- visualizar ocorrências da organização;
- assumir ocorrências;
- distribuir responsabilidades;
- supervisionar atendimento;
- alterar estados autorizados;
- validar resolução;
- acompanhar indicadores;
- gerenciar usuários institucionais.

## 8.5 Administrador do sistema

Permissões:

- gestão global da aplicação;
- gestão de usuários;
- gestão de perfis;
- gestão de categorias;
- parametrização;
- gestão de organizações;
- gestão de permissões;
- auditoria;
- configurações gerais.

---

# 9. Cadastro e autenticação

O registro de ocorrências deverá exigir autenticação.

O cadastro deverá possuir, no mínimo:

| Campo | Regra |
|---|---|
| Nome | Obrigatório |
| E-mail | Obrigatório |
| Senha | Obrigatória |
| Confirmação de senha | Obrigatória |
| Aceite dos termos | Obrigatório |

O mecanismo exato de confirmação da conta deverá ser definido durante a implementação.

A aplicação deverá impedir a utilização de contas suspensas ou bloqueadas para criação de novas ocorrências e interações.

---

# 10. Mapa e geolocalização

O mapa deverá ser um dos elementos centrais da aplicação.

Deverá permitir:

- visualizar a posição atual do usuário;
- visualizar ocorrências;
- visualizar alertas;
- visualizar áreas afetadas;
- consultar detalhes;
- aplicar filtros;
- visualizar categorias distintas.

## 10.1 Localização da ocorrência

Cada ocorrência deverá possuir coordenadas geográficas.

A localização deverá ser registrada no momento da criação.

O usuário comum não deverá poder alterar livremente a localização depois da criação.

Alterações autorizadas deverão ser registradas no histórico.

## 10.2 Localização do usuário

A posição do usuário deverá ser utilizada para validação das regras de proximidade.

A localização utilizada para validar uma ação não deverá ser tratada automaticamente como informação pública.

---

# 11. Registro de ocorrências

Uma ocorrência representa um problema, risco ou situação localizada que tenha interesse público.

Exemplos:

- ponte danificada;
- ponte interditada;
- buraco na via;
- deslizamento;
- árvore caída;
- lixo acumulado;
- via obstruída;
- iluminação pública danificada;
- alagamento;
- risco estrutural;
- erosão;
- sinalização danificada;
- outro problema configurado pela administração.

## 11.1 Dados mínimos

| Campo | Regra |
|---|---|
| Categoria | Obrigatório |
| Título | Obrigatório |
| Descrição | Obrigatório |
| Localização | Obrigatório |
| Data/hora do registro | Automática |
| Evidência fotográfica | Obrigatória conforme categoria/regra configurada |
| Usuário responsável pelo registro | Automático |
| Estado inicial | Automático |

## 11.2 Estado inicial

Uma ocorrência recém-criada deverá possuir um estado inicial que indique que ela foi **registrada**, mas ainda não representa necessariamente uma ocorrência oficialmente validada.

---

# 12. Categorias de ocorrências

As categorias deverão ser administráveis.

Categorias iniciais sugeridas:

| Categoria | Exemplos |
|---|---|
| **Infraestrutura viária** | Buracos, pavimentação danificada, pontes |
| **Obstrução** | Via bloqueada, árvore caída, objetos na pista |
| **Alagamento** | Acúmulo de água, inundação |
| **Resíduos** | Lixo acumulado, descarte irregular |
| **Estrutura** | Rachaduras, risco de colapso |
| **Sinalização** | Placas, semáforos, sinalização rodoviária |
| **Iluminação** | Iluminação pública defeituosa |
| **Meio ambiente** | Erosão, queimadas, deslizamentos |
| **Risco à segurança** | Situações que ofereçam risco à população |
| **Outros** | Categoria configurável |

A criação de novas categorias deverá ser possível pelo módulo administrativo.

---

# 13. Regras de proximidade

## 13.1 Criação de ocorrência

Para registrar uma nova ocorrência, o usuário deverá estar fisicamente próximo do local.

Parâmetro inicial:

> **Distância máxima: 300 metros.**

A distância deverá ser calculada entre a posição do usuário e a localização informada para a ocorrência.

Caso a distância seja superior ao limite configurado, a operação deverá ser bloqueada.

## 13.2 Reação à ocorrência

A interação de validação de uma ocorrência deverá obedecer à regra de proximidade.

Parâmetro inicial:

> **Distância máxima: 700 metros.**

A verificação deverá ocorrer no momento da interação.

## 13.3 Precisão do GPS

Caso a precisão fornecida pelo dispositivo seja insuficiente para verificar a regra de proximidade, o sistema deverá solicitar uma nova posição.

A aplicação não deverá considerar uma localização de baixa confiabilidade como confirmação definitiva.

---

# 14. Evidências fotográficas

A fotografia deverá ser utilizada como evidência da situação registrada.

Deverá ser possível:

- adicionar uma ou mais fotografias;
- visualizar fotografias vinculadas;
- preservar a data/hora de inclusão;
- registrar o usuário responsável pelo envio;
- preservar o vínculo entre fotografia e ocorrência.

Na primeira versão, **vídeo não fará parte da comprovação principal**.

A possibilidade de utilização de vídeos deverá ser prevista para evolução futura.

---

# 15. Validação comunitária

Usuários poderão participar da confirmação das ocorrências.

A validação deverá permitir, conforme definição da interface:

- confirmar que a situação foi observada;
- indicar que a situação não foi observada;
- registrar denúncia de conteúdo abusivo ou irregular.

Essas ações possuem significados diferentes e não deverão ser tratadas como equivalentes.

## 15.1 Regras

- um usuário deverá possuir no máximo uma reação ativa por ocorrência;
- o autor não poderá validar sua própria ocorrência;
- contas suspensas não poderão reagir;
- reações suspeitas poderão ser invalidadas;
- alterações de reação deverão ser registradas;
- a quantidade de reações não deverá determinar sozinha a veracidade da ocorrência.

## 15.2 Confiança comunitária

O sistema poderá utilizar as reações para produzir um indicador interno de confiança.

Esse indicador deverá ser distinto de:

- validação institucional;
- estado de atendimento;
- estado de resolução.
# 16. Proteção contra abuso, fraude e manipulação

O ZELO deverá possuir mecanismos destinados a identificar, reduzir e tratar comportamentos que possam comprometer a confiabilidade da plataforma.

Entre os comportamentos a serem considerados estão:

- criação massiva de ocorrências;
- criação repetitiva de ocorrências semelhantes;
- spam;
- criação coordenada de contas;
- manipulação de reações;
- tentativas de burlar as regras de localização;
- utilização de localização falsificada ou incompatível;
- envio reiterado de informações falsas;
- denúncias utilizadas de forma abusiva;
- outras ações que indiquem tentativa de manipulação do sistema.

## 16.1 Limitação de frequência

Deverão existir limites configuráveis para operações que possam ser utilizadas para abuso, incluindo:

- criação de ocorrências;
- reações;
- denúncias;
- alterações de reações;
- outras operações consideradas sensíveis.

Os limites deverão ser aplicados de forma progressiva e poderão considerar fatores como usuário, período, endereço de rede, dispositivo ou outros sinais disponíveis.

## 16.2 Medidas progressivas

Quando forem identificados comportamentos suspeitos, o sistema poderá aplicar medidas progressivas:

    Comportamento suspeito
            ↓
    Registro do evento
            ↓
    Limitação preventiva
            ↓
    Aviso ou revisão
            ↓
    Restrição temporária
            ↓
    Suspensão
            ↓
    Bloqueio

As medidas aplicadas deverão ser registradas para fins de auditoria.

## 16.3 Análise de localização

Tentativas recorrentes de registrar ocorrências ou realizar validações com localização incompatível deverão ser registradas como eventos de segurança.

Quando houver indícios de manipulação da localização, a ação poderá:

- ser bloqueada;
- ser submetida a análise;
- gerar limitação temporária;
- contribuir para a avaliação de confiabilidade do usuário.

A localização do dispositivo não deverá ser considerada, isoladamente, uma prova absoluta de autenticidade.

---

# 17. Reputação e confiabilidade dos usuários

O ZELO poderá manter um indicador interno de confiabilidade associado ao histórico de utilização da plataforma.

Esse indicador deverá ter finalidade operacional e de segurança, não devendo necessariamente ser apresentado publicamente ao usuário.

A confiabilidade poderá considerar, entre outros fatores:

### Fatores positivos

- ocorrências posteriormente validadas;
- informações consistentes;
- evidências fotográficas consideradas válidas;
- participação legítima na validação comunitária;
- histórico de utilização regular.

### Fatores negativos

- ocorrências reiteradamente consideradas falsas;
- comportamento de spam;
- manipulação de reações;
- tentativas recorrentes de burlar regras de proximidade;
- utilização abusiva da funcionalidade de denúncias;
- indícios de fraude de localização;
- outras violações confirmadas das regras da plataforma.

O sistema não deverá determinar a confiabilidade de um usuário com base em um único evento isolado.

## 17.1 Utilização da confiabilidade

O indicador poderá ser utilizado como um dos elementos para:

- aplicar limitações preventivas;
- determinar necessidade de revisão;
- reduzir efeitos de interações suspeitas;
- identificar padrões de abuso;
- apoiar decisões administrativas.

A reputação do usuário não deverá substituir a análise específica de cada ocorrência.

---

# 18. Estados e ciclo de vida das ocorrências

Cada ocorrência deverá possuir um estado que represente seu estágio no ciclo de vida.

Os estados iniciais sugeridos são:

| Estado | Descrição |
|---|---|
| **Registrada** | Ocorrência criada no sistema |
| **Em validação** | Ocorrência disponível para validação comunitária |
| **Validada pela comunidade** | Ocorrência atingiu os critérios configurados de confiança comunitária |
| **Em avaliação institucional** | Ocorrência encaminhada para análise de instituição responsável |
| **Avaliada** | Instituição realizou a avaliação inicial |
| **Em atendimento** | Ação de atendimento foi iniciada |
| **Resolvida** | Atendimento concluído e devidamente comprovado |
| **Reaberta** | Ocorrência anteriormente resolvida ou encerrada voltou a exigir atenção |
| **Duplicada** | Ocorrência identificada como duplicidade de outro registro |
| **Moderada** | Ocorrência submetida a ação de moderação |
| **Inativa** | Ocorrência deixou de possuir atividade ou validade operacional |

## 18.1 Fluxo principal

    Registrada
        ↓
    Em validação
        ↓
    Validada pela comunidade
        ↓
    Em avaliação institucional
        ↓
    Avaliada
        ↓
    Em atendimento
        ↓
    Resolvida

## 18.2 Fluxos alternativos

    Registrada → Moderada
    Registrada → Duplicada
    Registrada → Inativa
    Validada → Reaberta
    Resolvida → Reaberta

Os estados e respectivas transições deverão possuir regras de autorização.

## 18.3 Confiança e estado

O estado da ocorrência não deverá ser confundido com seu nível de confiança.

Uma ocorrência poderá, por exemplo:

- estar **Registrada** e possuir alta confiança comunitária;
- estar **Em avaliação institucional** e ainda possuir poucas validações;
- estar **Resolvida** independentemente da quantidade de reações comunitárias.

A confiança deverá representar uma dimensão própria da ocorrência.

---

# 19. Identificação de duplicidades

O sistema deverá possuir mecanismo para identificação de possíveis ocorrências duplicadas.

A identificação poderá considerar:

- distância geográfica;
- categoria;
- título;
- descrição;
- intervalo de tempo;
- características da ocorrência;
- relação com registros já existentes.

## 19.1 Sugestão de ocorrência existente

Durante a criação de uma nova ocorrência, o sistema poderá apresentar ocorrências potencialmente semelhantes ao usuário.

Exemplo:

> "Foi encontrada uma ocorrência semelhante próxima deste local. Deseja consultar o registro existente?"

O usuário deverá poder consultar o registro sugerido antes de concluir o novo cadastro.

## 19.2 Confirmação de duplicidade

Quando a duplicidade for confirmada:

- a ocorrência principal deverá ser preservada;
- o registro considerado duplicado deverá ser preservado;
- o relacionamento entre os registros deverá ser registrado;
- os autores deverão permanecer identificáveis internamente;
- as evidências não deverão ser descartadas;
- o histórico deverá permanecer disponível.

A ocorrência duplicada não deverá ser tratada como se nunca tivesse existido.

---

# 20. Gestão institucional das ocorrências

O ZELO deverá permitir a participação de instituições públicas ou responsáveis por determinados serviços e áreas geográficas.

Uma instituição poderá possuir:

- identificação própria;
- área de responsabilidade;
- usuários institucionais;
- perfis e permissões;
- configurações específicas;
- indicadores relacionados às suas ocorrências.

## 20.1 Área de responsabilidade

A área de responsabilidade poderá ser definida por:

- município;
- região;
- rodovia;
- trecho de rodovia;
- área administrativa;
- região geográfica;
- outro critério configurável.

A instituição somente deverá gerenciar ocorrências que estejam dentro de sua área de responsabilidade ou que lhe tenham sido atribuídas de forma autorizada.

## 20.2 Usuários institucionais

Uma instituição poderá possuir diferentes usuários com diferentes níveis de acesso.

Exemplos:

- gestor;
- analista;
- fiscal;
- operador;
- administrador institucional.

As permissões deverão ser controladas pelo perfil.

## 20.3 Atribuição

Uma ocorrência poderá ser atribuída a:

- uma instituição;
- um setor;
- um usuário responsável.

A atribuição deverá ser registrada para permitir rastreabilidade.

---

# 21. Inspeção e acompanhamento

Usuários institucionais autorizados deverão poder acompanhar as ocorrências relacionadas à sua área de atuação.

O sistema deverá permitir:

- consulta;
- filtros;
- classificação;
- análise;
- atribuição;
- registro de inspeção;
- registro de observações;
- inclusão de evidências;
- atualização de estado;
- acompanhamento de pendências.

## 21.1 Registro de inspeção

Uma inspeção poderá conter:

| Campo | Regra |
|---|---|
| Responsável | Obrigatório |
| Data/hora | Automática ou informada conforme regra |
| Local | Vinculado à ocorrência |
| Resultado | Obrigatório |
| Observação | Opcional ou obrigatório conforme configuração |
| Fotografia | Permitida e recomendada |
| Próxima ação | Opcional |

O registro deverá permanecer associado à ocorrência.

## 21.2 Acompanhamento

A interface institucional deverá permitir visualizar, no mínimo:

- ocorrências pendentes;
- ocorrências em avaliação;
- ocorrências em atendimento;
- ocorrências atrasadas;
- ocorrências resolvidas;
- ocorrências reabertas.

---

# 22. Resolução e comprovação

Uma ocorrência somente poderá ser marcada como **Resolvida** quando as condições necessárias forem atendidas.

No mínimo, deverão existir:

1. usuário institucional autorizado;
2. registro do atendimento realizado;
3. evidência fotográfica;
4. identificação do responsável;
5. data e hora;
6. descrição ou observação da ação realizada.

## 22.1 Evidência da resolução

A comprovação da resolução deverá estar vinculada diretamente à ocorrência.

O sistema deverá registrar:

| Informação | Registro |
|---|---|
| Fotografia | Obrigatória |
| Responsável | Obrigatório |
| Data/hora | Obrigatória |
| Descrição da intervenção | Obrigatória |
| Estado anterior | Registrado |
| Novo estado | Registrado |

## 22.2 Impedimento de resolução

Caso qualquer requisito obrigatório não seja atendido, o sistema deverá impedir a alteração para **Resolvida**.

Exemplo:

> Instituição tenta finalizar ocorrência sem anexar fotografia.

Resultado:

> Operação bloqueada e sistema solicita a evidência necessária.

## 22.3 Reabertura

Uma ocorrência resolvida poderá ser reaberta quando houver justificativa válida.

A reabertura poderá ocorrer quando:

- o problema voltar a existir;
- a solução não tiver sido suficiente;
- nova evidência indicar que o problema permanece;
- usuário institucional autorizado determinar a reabertura.

A resolução anterior deverá permanecer registrada no histórico.

---

# 23. Alertas de fenômenos naturais e situações críticas

O ZELO deverá possuir um módulo específico para gerenciamento e apresentação de alertas.

Os alertas deverão ser tratados de forma independente das ocorrências.

## 23.1 Ocorrência

Representa um problema localizado.

Exemplo:

> Ponte danificada em determinado ponto da rodovia.

## 23.2 Alerta

Representa uma situação de risco que pode atingir uma região, área ou conjunto de usuários.

Exemplos:

- tempestade severa;
- risco de ciclone;
- enchente;
- inundação;
- deslizamento;
- situação de emergência;
- risco ambiental;
- outros eventos configurados.

## 23.3 Informações mínimas de um alerta

| Campo | Regra |
|---|---|
| Título | Obrigatório |
| Descrição | Obrigatório |
| Tipo | Obrigatório |
| Severidade | Obrigatório |
| Área afetada | Obrigatório |
| Data/hora de início | Obrigatório |
| Data/hora de validade | Obrigatório |
| Fonte | Obrigatório |
| Estado | Automático ou definido pela regra |

## 23.4 Emissão de alertas

A criação e publicação de alertas oficiais deverá ser restrita a:

- administradores;
- usuários institucionais autorizados;
- fontes oficiais integradas;
- outros mecanismos posteriormente aprovados.

Usuários comuns não deverão publicar alertas oficiais de desastres ou fenômenos naturais.

---

# 24. Severidade e prioridade

Alertas e ocorrências deverão possuir classificação de severidade.

Os níveis iniciais sugeridos são:

| Nível | Descrição |
|---|---|
| **Baixo** | Situação de baixo impacto ou predominantemente informativa |
| **Moderado** | Situação que requer atenção da população |
| **Alto** | Situação com risco significativo |
| **Crítico** | Situação com elevado potencial de dano e necessidade de comunicação imediata |

## 24.1 Severidade informada pelo usuário

Quando a severidade for informada pelo cidadão, ela deverá ser tratada como uma classificação inicial.

A classificação não deverá ser considerada oficial automaticamente.

## 24.2 Classificação institucional

Usuários institucionais autorizados poderão:

- revisar a severidade;
- alterar o nível;
- registrar justificativa;
- priorizar o atendimento.

A alteração deverá ser registrada no histórico.

## 24.3 Prioridade

A prioridade de uma ocorrência poderá considerar:

- severidade;
- risco à população;
- infraestrutura crítica;
- quantidade de pessoas potencialmente afetadas;
- localização;
- validação comunitária;
- tempo de existência;
- situação institucional.

## 24.4 Infraestrutura crítica

Ocorrências envolvendo infraestrutura crítica poderão receber tratamento prioritário.

Exemplos:

- pontes;
- rodovias;
- estruturas com risco de colapso;
- trechos interditados;
- áreas sujeitas a deslizamento;
- situações com risco direto à integridade física.

A definição exata dos critérios de prioridade deverá ser parametrizável.

# 25. Notificações e comunicação

O ZELO deverá possuir mecanismos de comunicação capazes de destacar ocorrências e alertas de acordo com seu nível de severidade, área afetada e relevância para o usuário.

A comunicação deverá ser projetada de forma proporcional ao risco, evitando que situações de baixa relevância provoquem alertas excessivos.

## 25.1 Níveis de comunicação

| Severidade | Comportamento sugerido |
|---|---|
| **Baixo** | Exibição discreta no mapa e na interface |
| **Moderado** | Destaque visual e notificação quando aplicável |
| **Alto** | Destaque visual elevado e notificação ao usuário |
| **Crítico** | Overlay de emergência, destaque elevado e alerta sonoro |

A severidade deverá determinar o nível de destaque utilizado, mas não deverá alterar o histórico ou os dados originais da ocorrência.

## 25.2 Comunicação de alertas críticos

Alertas classificados como críticos poderão utilizar uma apresentação de emergência.

O sistema poderá:

- exibir uma camada sobre a interface principal;
- apresentar mensagem destacada;
- emitir sinal sonoro;
- informar a área afetada;
- informar o período de validade;
- apresentar orientações cadastradas pela fonte responsável.

O comportamento exato deverá ser configurável.

## 25.3 Encerramento de alertas

Um alerta deverá deixar de ser considerado ativo quando:

- sua validade terminar;
- uma fonte autorizada determinar seu encerramento;
- o administrador encerrar manualmente;
- uma integração externa informar o encerramento.

O histórico deverá permanecer disponível para consulta administrativa.

## 25.4 Comunicação futura

A arquitetura deverá permitir futuras integrações com:

- WhatsApp;
- notificações push;
- SMS;
- e-mail;
- outros canais de comunicação.

Esses canais não deverão ser obrigatórios para o funcionamento básico da primeira versão.

---

# 26. Painel administrativo

O ZELO deverá disponibilizar um painel administrativo para gerenciamento dos recursos da plataforma.

O acesso deverá depender das permissões associadas ao perfil do usuário.

## 26.1 Funcionalidades

O painel deverá permitir, conforme o nível de acesso:

- gerenciar usuários;
- gerenciar perfis;
- gerenciar instituições;
- gerenciar usuários institucionais;
- gerenciar áreas de responsabilidade;
- gerenciar categorias;
- gerenciar parâmetros;
- consultar ocorrências;
- consultar alertas;
- acompanhar estados;
- consultar denúncias;
- consultar eventos de segurança;
- consultar auditoria;
- visualizar indicadores;
- exportar dados autorizados.

## 26.2 Gestão de usuários

Administradores deverão poder:

- consultar usuários;
- visualizar situação da conta;
- bloquear ou suspender contas;
- reativar contas quando autorizado;
- visualizar histórico administrativo;
- consultar eventos relacionados à segurança.

Operações administrativas deverão ser registradas na auditoria.

## 26.3 Gestão de categorias

O sistema deverá permitir:

- criar categorias;
- editar categorias;
- ativar ou desativar categorias;
- definir descrição;
- definir parâmetros específicos;
- ordenar a apresentação.

A desativação de uma categoria não deverá apagar ocorrências históricas vinculadas a ela.

## 26.4 Gestão de parâmetros

Os parâmetros configuráveis poderão incluir:

- distância máxima para criação de ocorrência;
- distância máxima para reação;
- limites de frequência;
- níveis de severidade;
- estados disponíveis;
- períodos de validade;
- regras de inatividade;
- outras configurações administrativas.

Os valores deverão ser armazenados de forma que alterações futuras não exijam mudanças diretas no código da aplicação.

---

# 27. Indicadores

O ZELO deverá disponibilizar indicadores para acompanhamento operacional e administrativo.

## 27.1 Indicadores gerais

Poderão ser apresentados:

- quantidade total de ocorrências;
- ocorrências abertas;
- ocorrências em validação;
- ocorrências em avaliação;
- ocorrências em atendimento;
- ocorrências resolvidas;
- ocorrências reabertas;
- ocorrências duplicadas;
- ocorrências moderadas;
- alertas ativos;
- alertas encerrados;
- quantidade de usuários cadastrados;
- quantidade de usuários ativos.

## 27.2 Indicadores por categoria

Deverá ser possível visualizar a distribuição de ocorrências por categoria.

Exemplos:

- infraestrutura viária;
- alagamento;
- obstrução;
- resíduos;
- estrutura;
- iluminação;
- sinalização;
- meio ambiente;
- risco à segurança.

## 27.3 Indicadores geográficos

O sistema poderá apresentar:

- ocorrências por região;
- ocorrências por município;
- ocorrências por rodovia;
- ocorrências por trecho;
- concentração geográfica;
- áreas com maior incidência de problemas.

## 27.4 Indicadores de atendimento

Para instituições autorizadas, poderão ser apresentados:

- ocorrências pendentes;
- ocorrências em atendimento;
- tempo médio até avaliação;
- tempo médio até início do atendimento;
- tempo médio até resolução;
- quantidade de ocorrências reabertas;
- quantidade de ocorrências atrasadas.

## 27.5 Indicadores de confiabilidade

O sistema poderá apresentar indicadores administrativos relacionados à confiabilidade, incluindo:

- quantidade de ocorrências validadas;
- quantidade de ocorrências moderadas;
- reações invalidadas;
- denúncias confirmadas;
- eventos de segurança;
- contas suspensas;
- padrões de abuso identificados.

Informações de reputação individual deverão estar sujeitas às permissões e regras de privacidade da aplicação.

---

# 28. Histórico e auditoria

O ZELO deverá manter histórico das ações relevantes realizadas na plataforma.

A auditoria deverá permitir identificar:

- quem realizou a ação;
- quando a ação foi realizada;
- qual entidade foi afetada;
- qual operação foi executada;
- valor anterior, quando aplicável;
- novo valor, quando aplicável;
- origem da ação, quando necessário.

## 28.1 Eventos auditáveis

Deverão possuir rastreabilidade, entre outros:

- criação de usuário;
- alteração de dados de usuário;
- suspensão;
- bloqueio;
- criação de ocorrência;
- alteração de ocorrência;
- alteração de estado;
- alteração de severidade;
- alteração de prioridade;
- alteração de localização autorizada;
- criação de reação;
- alteração de reação;
- invalidação de reação;
- denúncia;
- análise institucional;
- inspeção;
- atribuição;
- atendimento;
- resolução;
- reabertura;
- criação de alerta;
- alteração de alerta;
- encerramento de alerta;
- alterações administrativas.

## 28.2 Imutabilidade

O histórico de auditoria não deverá ser editável por usuários operacionais.

Caso uma informação precise ser corrigida, deverá ser registrada uma nova operação de correção, preservando o evento anterior.

## 28.3 Rastreabilidade de alterações

Alterações relevantes deverão registrar, quando aplicável:

```text
Usuário responsável
       +
Data e hora
       +
Ação realizada
       +
Valor anterior
       +
Novo valor
       +
Entidade afetada
```

# 29. Privacidade e segurança

O ZELO deverá adotar mecanismos de proteção das informações pessoais, geográficas, operacionais e administrativas armazenadas ou processadas pela aplicação.

O acesso às informações deverá obedecer ao princípio do menor privilégio necessário para execução de cada função.

## 29.1 Informações públicas

As informações disponibilizadas publicamente deverão se limitar ao necessário para permitir a compreensão da ocorrência ou do alerta.

Poderão ser disponibilizados:

- categoria;
- título;
- descrição;
- localização representada no mapa;
- severidade;
- estado;
- data/hora;
- evidências autorizadas;
- informações relacionadas à área afetada.

A aplicação não deverá expor desnecessariamente informações pessoais do usuário responsável pelo registro.

## 29.2 Dados do usuário

Dados pessoais deverão ser protegidos e disponibilizados somente quando necessários para a execução das funcionalidades previstas.

O sistema não deverá expor publicamente, salvo quando houver justificativa e autorização específica:

- e-mail;
- telefone;
- endereço residencial;
- localização pessoal;
- informações internas de reputação;
- identificadores técnicos sensíveis;
- informações administrativas;
- dados utilizados exclusivamente para auditoria ou segurança.

## 29.3 Localização utilizada para validação

A localização do usuário poderá ser utilizada para validar regras de proximidade e segurança.

As informações de localização coletadas para essa finalidade deverão ser tratadas como informações protegidas.

O sistema deverá armazenar somente os dados necessários para:

- verificar a proximidade;
- comprovar que a regra foi aplicada;
- investigar possíveis abusos;
- realizar auditoria autorizada;
- suportar mecanismos de segurança.

A localização utilizada para validação não deverá ser publicada automaticamente para outros usuários.

## 29.4 Minimização de dados

A aplicação deverá coletar somente os dados necessários para suas funcionalidades.

Informações que não sejam necessárias para:

- operação;
- segurança;
- auditoria;
- atendimento;
- comunicação;
- análise;
- cumprimento de regras da aplicação;

não deverão ser coletadas sem justificativa.

## 29.5 Proteção de credenciais

Credenciais deverão ser armazenadas utilizando mecanismos apropriados de proteção.

Senhas não deverão ser armazenadas em texto puro.

Tokens, chaves, segredos e credenciais de serviços externos não deverão ser armazenados diretamente no código-fonte.

## 29.6 Controle de acesso

As funcionalidades administrativas e institucionais deverão possuir autorização explícita.

A autenticação, por si só, não deverá conceder acesso às funções administrativas.

O servidor deverá validar as permissões do usuário em cada operação protegida.

A aplicação não deverá confiar exclusivamente em controles implementados na interface do cliente.

## 29.7 Validação de entradas

Todos os dados fornecidos pelo usuário deverão ser validados no servidor.

A validação realizada no cliente deverá ser utilizada como mecanismo complementar de usabilidade.

Deverão ser consideradas, conforme aplicável:

- validação de tipos;
- tamanho máximo;
- formatos permitidos;
- valores mínimos e máximos;
- campos obrigatórios;
- conteúdo permitido;
- consistência entre campos.

## 29.8 Upload de arquivos

Os arquivos enviados pelo usuário deverão passar por validações de segurança.

Deverão ser considerados, no mínimo:

- tamanho máximo;
- formato permitido;
- extensão;
- tipo MIME;
- integridade;
- conteúdo compatível;
- quantidade máxima de arquivos;
- regras específicas da ocorrência.

Os arquivos deverão ser armazenados de forma controlada e não deverão possuir permissões que permitam execução indevida de conteúdo.

## 29.9 Proteção contra conteúdo malicioso

A aplicação deverá possuir mecanismos para reduzir riscos associados ao envio de conteúdo malicioso.

Deverão ser considerados, conforme a tecnologia adotada:

- validação de arquivos;
- sanitização de dados;
- prevenção de injeções;
- proteção contra scripts maliciosos;
- controle de conteúdo HTML;
- validação de parâmetros;
- uso de consultas parametrizadas.

## 29.10 Tratamento de erros

As mensagens de erro apresentadas ao usuário não deverão expor informações internas da aplicação.

Não deverão ser exibidos publicamente:

- stack traces;
- caminhos internos;
- consultas SQL;
- credenciais;
- tokens;
- endereços internos;
- configurações de infraestrutura;
- detalhes sensíveis da arquitetura.

As informações técnicas necessárias para diagnóstico deverão ser registradas em logs controlados.

## 29.11 Sessões

As sessões autenticadas deverão ser protegidas contra utilização indevida.

A implementação deverá considerar:

- expiração de sessão;
- encerramento de sessão;
- proteção dos identificadores de sessão;
- invalidação de sessões quando necessário;
- proteção contra reutilização indevida;
- controle de dispositivos e acessos, quando aplicável.

## 29.12 Logs de segurança

Eventos relevantes de segurança deverão ser registrados.

Poderão ser registrados:

- tentativas de autenticação;
- falhas de autenticação;
- bloqueios;
- suspensões;
- alterações de permissões;
- tentativas de acesso não autorizado;
- tentativas de violação das regras de proximidade;
- operações administrativas;
- comportamentos classificados como suspeitos.

Os logs deverão evitar armazenar informações sensíveis desnecessárias.

## 29.13 Proteção contra abuso

A aplicação deverá implementar mecanismos para reduzir:

- spam;
- criação automatizada de contas;
- criação excessiva de ocorrências;
- reações automatizadas;
- tentativas repetidas de acesso;
- manipulação de validações;
- tentativas de burlar regras de localização;
- chamadas excessivas à API.

Poderão ser utilizados mecanismos como:

- rate limiting;
- bloqueios temporários;
- limitação por usuário;
- limitação por endereço de rede;
- controles adicionais para contas suspeitas;
- monitoramento de padrões de comportamento.

## 29.14 Integridade das informações

Os registros críticos da aplicação deverão possuir controles que reduzam alterações não autorizadas.

Informações como:

- localização original;
- autor da ocorrência;
- data de criação;
- histórico;
- evidências;
- resolução;
- auditoria;

não deverão ser livremente alteráveis por usuários comuns.

## 29.15 Auditoria de segurança

Operações administrativas ou de segurança deverão permanecer rastreáveis.

Uma alteração relevante deverá permitir identificar, quando aplicável:

```text
Usuário
    +
Data e hora
    +
Origem da operação
    +
Ação executada
    +
Entidade afetada
    +
Resultado
```

## 29.16 Privacidade por padrão

A aplicação deverá adotar, como princípio, a exposição mínima de informações pessoais.

Quando uma informação não for necessária para determinada funcionalidade pública, ela deverá permanecer restrita.

## 29.17 Retenção e descarte

Os dados deverão possuir regras de retenção compatíveis com sua finalidade.

Registros necessários para:

- histórico;
- auditoria;
- segurança;
- comprovação;
- atendimento;
- indicadores;

não deverão ser eliminados automaticamente sem regra definida.

Quando um registro puder ser removido, a aplicação deverá preferencialmente utilizar mecanismos que preservem a integridade histórica quando isso for necessário para auditoria.

## 29.18 Segurança das integrações futuras

Integrações futuras deverão possuir controles próprios de autenticação, autorização, credenciais e proteção de dados.

Chaves de API, tokens e outros segredos deverão ser armazenados em mecanismos apropriados de gerenciamento de configuração e segredos.

As integrações deverão possuir baixo acoplamento com as regras principais da aplicação.

---
# 30. Requisitos funcionais

| ID | Título | Descrição
| --- | ---| ---
| **RF-001** | Acesso público | O sistema deverá permitir a consulta do mapa, alertas e ocorrências públicas sem autenticação.
| **RF-002** | Cadastro | O sistema deverá permitir o cadastro de usuários.
| **RF-003** | Autenticação | O sistema deverá permitir autenticação segura de usuários registrados.
| **RF-004** | Recuperação de acesso | O sistema deverá possuir mecanismo para recuperação de acesso conforme a estratégia de autenticação adotada.
| **RF-005** | Criação de ocorrência | O sistema deverá permitir que usuários autenticados criem ocorrências.
| **RF-006** | Validação de proximidade | O sistema deverá verificar a distância entre o usuário e o ponto informado antes da criação da ocorrência.
| **RF-007** | Regra de proximidade para criação | O sistema deverá impedir a criação quando o usuário estiver dentro ou além da distância máxima configurada, inicialmente definida em 300 metros.
| **RF-008** | Registro de localização | O sistema deverá registrar as coordenadas geográficas associadas à ocorrência.
| **RF-009** | Evidência fotográfica | O sistema deverá permitir o envio de fotografias associadas à ocorrência.
| **RF-010** | Visualização no mapa | O sistema deverá apresentar ocorrências em representação geográfica.
| **RF-011** | Consulta de ocorrência | O sistema deverá permitir visualizar os detalhes públicos de uma ocorrência.
| **RF-012** | Filtros | O sistema deverá permitir filtrar ocorrências por critérios disponíveis.
| **RF-013** | Reação comunitária | O sistema deverá permitir que usuários autenticados realizem reações nas ocorrências.
| **RF-014** | Regra de proximidade para reação | O sistema deverá impedir reação quando a distância entre o usuário e a ocorrência exceder a distância configurada, inicialmente definida em 700 metros.
| **RF-015** | Verificação no momento da ação | A proximidade deverá ser validada no momento em que a reação for realizada.
| **RF-016** | Impedimento de auto-validação | O sistema deverá impedir que o autor de uma ocorrência valide a própria ocorrência.
| **RF-017** | Uma reação por usuário | O sistema deverá impedir múltiplas reações ativas do mesmo usuário para a mesma ocorrência.
| **RF-018** | Alteração de reação | O sistema poderá permitir a alteração da reação, devendo preservar o histórico da operação.
| **RF-019** | Denúncia | O sistema deverá permitir denúncia de ocorrências ou conteúdos considerados abusivos ou irregulares.
| **RF-020** | Moderação | O sistema deverá permitir análise administrativa de ocorrências denunciadas.
| **RF-021** | Antifraude | O sistema deverá registrar e limitar comportamentos identificados como suspeitos.
| **RF-022** | Controle de frequência | O sistema deverá aplicar limites de frequência nas operações configuradas.
| **RF-023** | Reputação | O sistema poderá manter indicador interno de confiabilidade dos usuários.
| **RF-024** | Instituições | O sistema deverá permitir o cadastro e gerenciamento de organizações autorizadas.
| **RF-025** | Área de responsabilidade | O sistema deverá associar instituições a áreas de responsabilidade.
| **RF-026** | Usuários institucionais | O sistema deverá permitir associar usuários institucionais a uma organização e a um perfil específico.
| **RF-027** | Avaliação institucional | O sistema deverá permitir que usuários institucionais autorizados avaliem ocorrências.
| **RF-028** | Inspeção | O sistema deverá permitir o registro de inspeções.
| **RF-029** | Atribuição | O sistema deverá permitir a atribuição de uma ocorrência a uma instituição, setor ou responsável.
| **RF-030** | Atendimento | O sistema deverá permitir registrar o início e o acompanhamento do atendimento.
| **RF-031** | Evidência de resolução | O sistema deverá permitir anexar fotografia como prova de resolução. 
| **RF-032** | Resolução | O sistema deverá permitir marcar uma ocorrência como resolvida somente quando os requisitos configurados forem atendidos.
| **RF-033** | Reabertura | O sistema deverá permitir a reabertura autorizada de ocorrências.
| **RF-034** | Alertas | O sistema deverá permitir o cadastro, gerenciamento e publicação de alertas por perfis autorizados.
| **RF-035** | Área afetada | O sistema deverá permitir associar uma área geográfica ao alerta.
| **RF-036** | Validade | O sistema deverá permitir definir data e hora de início e encerramento do alerta.
| **RF-037** | Severidade | O sistema deverá permitir classificar alertas e ocorrências por severidade.
| **RF-038** | Comunicação diferenciada | O sistema deverá apresentar alertas de acordo com a severidade configurada.
| **RF-039** | Alerta sonoro | O sistema deverá permitir a utilização de alerta sonoro em situações configuradas como críticas.
| **RF-040** | Overlay de emergência | O sistema deverá permitir a apresentação de alertas críticos sobre a interface principal.
| **RF-041** | Auditoria | O sistema deverá registrar alterações e operações relevantes.
| **RF-042** | Histórico | O sistema deverá preservar o histórico das alterações relevantes.
| **RF-043** | Indicadores | O sistema deverá apresentar indicadores operacionais básicos. 
| **RF-044** | Administração | O sistema deverá permitir o gerenciamento de usuários, categorias, instituições, parâmetros e permissões.
| **RF-045** | Exportação | O sistema poderá permitir a exportação de dados de acordo com as permissões do usuário.
| **RF-046** | Controle de permissões | O sistema deverá verificar as permissões do usuário antes de cada operação protegida.
| **RF-047** | Preservação histórica | O sistema deverá evitar a exclusão física de registros que possuam relevância histórica, operacional ou de auditoria.
| **RF-048** | Detecção de duplicidade | O sistema deverá identificar ou sugerir possíveis ocorrências duplicadas.
| **RF-049** | Inatividade | O sistema deverá permitir identificar ocorrências que estejam sem atualização por período configurado.
| **RF-050** | Configuração | O sistema deverá permitir parametrizar regras sem necessidade de alteração direta do código-fonte sempre que tecnicamente possível.

# 31. Requisitos técnicos

| Dimensão | Requisito |
| --- | --- |
| **Plataforma** | Aplicação web
|**Interface** | Responsiva
| **Arquitetura** | Modular
| **Camadas** | Separação entre interface, regras de negócio e persistência
| **Banco de dados** | Solução relacional ou compatível com as necessidades geográficas da aplicação
| **Geolocalização** | Suporte a coordenadas geográficas e cálculo de distância
| **Mapas** | Integração com provedor de mapas compatível com o projeto
| **Armazenamento** | Armazenamento controlado de imagens
| **Autenticação** | Mecanismo seguro de autenticação
| **Autorização** | Controle por perfil e permissões
| **Configuração** | Variáveis/configurações por ambiente
| **Segredos** | Não armazenar credenciais diretamente no código
| **Logs** | Logs de aplicação e tratamento centralizado de erros
| **Validação** | Validação no cliente e no servidor
| **Auditoria** | Registro das principais operações
| **Versionamento** | Código-fonte sob controle de versão
| **Segurança** | Proteção de dados, entradas e operações
| **Documentação** | Documentação de instalação, configuração, uso e arquitetura
| **Escalabilidade** | Estrutura compatível com expansão futura

A tecnologia específica de backend, frontend, banco e infraestrutura deverá ser definida durante a validação técnica do projeto.

----------

# 32. Estrutura modular sugerida

| Módulo | Responsabilidade
| --- | --- |
| **Autenticação** | Cadastro, login, recuperação e sessão
| **Usuários** | Dados, perfil, situação e reputação
| **Mapa** | Visualização geográfica
| **Ocorrências** | Cadastro, consulta e ciclo de vida
| **Categorias** | Gestão das categorias
| **Geolocalização** | Posição e cálculo de proximidade
| **Evidências** | Fotografias e metadados
| **Validação comunitária** | Reações e confiança
| **Antifraude** | Limites, detecção e restrições
| **Instituições** | Organizações e áreas de responsabilidade
| **Atendimento** | Responsáveis, inspeções e acompanhamento
| **Resolução** | Evidências e conclusão
| **Alertas** | Criação, validade, severidade e publicação
| **Notificações** | Comunicação com usuários
| **Auditoria** | Histórico e rastreabilidade
| **Relatórios** | Indicadores e consultas
| **Administração** | Parâmetros e configurações
| **Integrações** | Adaptadores para serviços externos futuros

A separação deverá permitir que novos canais ou integrações sejam incorporados sem alterar diretamente as regras centrais da aplicação.

# 33. Preparação para integrações futuras

A arquitetura deverá prever integração futura com:

-   serviços meteorológicos;
-   fontes oficiais de alertas;
-   órgãos públicos;
-   mapas e serviços geográficos;
-   WhatsApp;
-   notificações push;
-   SMS;
-   vídeo;
-   sistemas institucionais;
-   APIs de terceiros.

A ausência dessas integrações não deverá impedir o funcionamento da primeira versão.

As futuras integrações deverão ser implementadas preferencialmente por módulos, serviços ou adaptadores independentes.

----------

# 34. Itens fora do escopo inicial

Os seguintes recursos não fazem parte do núcleo obrigatório da primeira versão:

-   envio automático de WhatsApp;
-   notificações por WhatsApp;
-   envio de vídeos como evidência principal;
-   reconhecimento automático avançado de imagens;
-   automação completa de alertas meteorológicos externos;
-   integração obrigatória com sistemas municipais;
-   integração obrigatória com sistemas estaduais;
-   integração obrigatória com sistemas federais;
-   inteligência artificial para classificação automática;
-   inteligência artificial para detecção automática de fraude;
-   aplicativo mobile nativo;
-   automações externas não necessárias ao funcionamento básico.

Esses recursos poderão ser incluídos em versões futuras.

----------

# 35. Organização sugerida da entrega

| Etapa | Foco | Entregas principais
| --- | --- | ---
| **Fundação** | Base da aplicação | Estrutura, banco, autenticação, usuários, mapa e configuração
| **Ocorrências** | Participação do usuário | Cadastro, localização, fotografias, categorias e validação
| **Confiabilidade** | Segurança | Proximidade, reações, antifraude, reputação e auditoria
| **Institucional** | Gestão de problemas | Organizações, responsáveis, inspeções, atendimento e resolução
| **Alertas** | Comunicação de risco | Alertas, severidade, validade e mecanismos de destaque
| **Administração** | Governança | Indicadores, parâmetros, gestão e exportação
| **Validação** | Qualidade | Testes, documentação, segurança, homologação e publicação

A divisão apresentada constitui uma referência de organização do escopo e não substitui a metodologia de desenvolvimento adotada pela equipe.

----------

# 36. Resultado esperado

Ao final da primeira versão, o ZELO deverá disponibilizar uma plataforma funcional capaz de centralizar informações de risco e problemas de interesse público em uma interface geográfica.

O usuário deverá conseguir consultar situações relevantes sem cadastro e, quando autenticado e fisicamente próximo do local, registrar novos problemas.

A plataforma deverá aplicar mecanismos de validação por localização, evidência fotográfica, participação comunitária e controle de abuso.

Instituições autorizadas deverão conseguir avaliar, acompanhar e registrar o atendimento de ocorrências dentro de suas respectivas áreas de responsabilidade.

A conclusão de uma ocorrência deverá possuir comprovação adequada, permitindo verificar posteriormente quem realizou a ação, quando ela foi realizada e qual evidência foi apresentada.

Os alertas deverão permitir comunicação diferenciada para situações de maior risco, mantendo separação conceitual entre uma ocorrência local e um alerta de abrangência regional.

----------

# 37. Resumo executivo do escopo

| Valor entregue | Resultado esperado
| --- | ---
| **Informação pública** | Consulta de ocorrências e alertas sem cadastro
| **Mapeamento** | Visualização geográfica de problemas e riscos
| **Participação** | Usuários autenticados podem registrar problemas
| **Proximidade** | Regras geográficas reduzem registros e interações remotas
| **Evidência** | Fotografias apoiam registro e comprovação
| **Confiabilidade** | Validação comunitária sem transformar votação em verdade absoluta
| **Segurança** | Mecanismos de prevenção a abuso e manipulação
| **Institucional** | Órgãos responsáveis podem acompanhar ocorrências
| **Rastreabilidade** | Histórico das alterações
| **Resolução** | Atendimento comprovado por evidência fotográfica
| **Alertas** | Comunicação de fenômenos naturais e situações críticas
| **Evolução** | Arquitetura preparada para integrações futuras

----------

# 38. Registro de validação

A presente especificação deverá ser validada antes do início da implementação definitiva.

A validação deverá confirmar:

-   nomenclatura da solução;
-   responsáveis;
-   tecnologia;
-   arquitetura;
-   categorias;
-   parâmetros de proximidade;
-   regras de validação;
-   níveis de severidade;
-   perfis de acesso;
-   regras institucionais;
-   ciclo de vida das ocorrências;
-   política de moderação;
-   regras antifraude;
-   comportamento dos alertas;
-   critérios de resolução;
-   requisitos de privacidade;
-   critérios de aceite;
-   itens fora do escopo.

## 38.1 Pendências para definição

| Item | Situação
| --- | ---
| Tecnologia principal | A definir
| Banco de dados | A definir
| Provedor de mapas | A definir
| Provedor de armazenamento de imagens | A definir
| Método de confirmação de cadastro | A definir
| Limite de criação de ocorrências por período | A definir
| Limite de reações por período | A definir
| Parâmetro de baixa precisão de GPS | A definir
| Quantidade necessária de validações comunitárias | A definir
| Fórmula do índice de confiança | A definir
| Critérios de detecção de comportamento suspeito | A definir
| Tempo para considerar ocorrência desatualizada | A definir
| Regras detalhadas de reabertura | A definir
| Fontes oficiais de alertas | A definir
| Duração padrão dos alertas | A definir
| Comportamento de confirmação de alertas críticos | A definir
| Política de retenção de fotografias | A definir
|Política de exposição pública da localização | A definir
| Método de integração institucional | A definir
| Integração com WhatsApp | Futuro
| Suporte a vídeo | Futuro

----------

# Diretriz central da solução

O ZELO deverá operar com o princípio de que **um relato não representa, isoladamente, a verdade absoluta de uma situação**.

A confiabilidade de uma ocorrência deverá ser construída a partir da combinação, quando disponível, de:

```
Localização
    +
Evidência
    +
Histórico do usuário
    +
Validação comunitária
    +
Tempo
    +
Avaliação institucional
    +
Histórico do atendimento
```

Dessa forma, o sistema deverá evitar que uma única pessoa consiga determinar sozinha a existência, inexistência, resolução ou prioridade de um problema.

A aplicação deverá preservar os registros necessários para permitir posterior análise, auditoria e evolução das decisões tomadas.
