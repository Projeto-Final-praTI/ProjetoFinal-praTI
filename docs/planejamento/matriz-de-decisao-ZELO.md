## Matriz de Decisão

| ID | Situação / Evento | Condição | Decisão / Regra | Resultado |
|---|---|---|---|---|
| **MD-01** | Usuário acessa o ZELO | Sem autenticação | Permitir acesso às funcionalidades públicas | Usuário pode visualizar mapa, alertas e ocorrências |
| **MD-02** | Usuário deseja criar ocorrência | Usuário não autenticado | Bloquear criação | Solicitar cadastro/autenticação |
| **MD-03** | Usuário deseja criar ocorrência | Usuário autenticado e localização ≤ **300 m** do ponto informado | Permitir criação | Ocorrência registrada |
| **MD-04** | Usuário deseja criar ocorrência | Distância > **300 m** | Bloquear criação | Informar que o usuário precisa estar próximo ao local |
| **MD-05** | Usuário tenta criar ocorrência | Já existe ocorrência semelhante próxima | Sugerir ocorrência existente | Usuário pode confirmar que se trata do mesmo problema ou prosseguir conforme regras |
| **MD-06** | Usuário envia ocorrência | Categoria válida, localização válida e dados mínimos preenchidos | Aceitar | Ocorrência entra como registrada/aguardando validação |
| **MD-07** | Usuário envia ocorrência | Evidência fotográfica obrigatória não fornecida | Bloquear envio | Solicitar fotografia |
| **MD-08** | Usuário deseja reagir a uma ocorrência | Distância ≤ **700 m** | Permitir reação | Reação registrada |
| **MD-09** | Usuário deseja reagir a uma ocorrência | Distância > **700 m** | Bloquear reação | Informar necessidade de proximidade |
| **MD-10** | Usuário tenta reagir novamente | Já possui reação registrada | Impedir duplicidade | Manter apenas uma reação por usuário |
| **MD-11** | Autor tenta validar a própria ocorrência | Usuário é o autor | Bloquear | Autor não pode validar a própria ocorrência |
| **MD-12** | Usuário suspenso tenta interagir | Conta suspensa | Bloquear | Nenhuma nova reação/interação permitida |
| **MD-13** | Usuário apresenta comportamento suspeito | Padrão de spam ou manipulação identificado | Aplicar regra antifraude | Limitação, revisão ou suspensão |
| **MD-14** | Usuário recebe muitas rejeições | Rejeições recorrentes associadas ao histórico | Reduzir confiança/reputação | Conta passa a ser monitorada ou restringida |
| **MD-15** | Ocorrência recebe rejeições | Rejeições superam aprovações | Não excluir automaticamente | Reduzir nível de confiança e manter histórico |
| **MD-16** | Ocorrência não recebe validações | Não atingiu quantidade mínima de interações | Manter | Ocorrência permanece aguardando confirmação |
| **MD-17** | Ocorrência recebe aprovações | Quantidade e qualidade das validações são suficientes | Aumentar confiança | Ocorrência ganha maior relevância de visualização |
| **MD-18** | Ocorrência recebe muitas reações | Comportamento suspeito de contas identificado | Desconsiderar ou invalidar interações suspeitas | Preservar registro para auditoria |
| **MD-19** | Usuário denuncia ocorrência como falsa ou abusiva | Motivo de denúncia informado | Encaminhar para análise | Denúncia é tratada separadamente da validação comunitária |
| **MD-20** | Ocorrência é confirmada pela comunidade | Evidências e reações compatíveis | Aumentar confiança | Ocorrência ganha maior relevância |
| **MD-21** | Instituição analisa ocorrência | Usuário institucional autorizado | Permitir avaliação | Status institucional atualizado |
| **MD-22** | Instituição assume ocorrência | Ocorrência pertence à sua área de atuação | Permitir assumir | Responsável institucional registrado |
| **MD-23** | Instituição fora da área tenta assumir | Ocorrência fora da área de responsabilidade | Bloquear | Apenas organização competente pode gerenciar |
| **MD-24** | Instituição inicia providências | Ocorrência avaliada e atendimento iniciado | Alterar status | Ocorrência passa para **Em atendimento** |
| **MD-25** | Instituição conclui atendimento | Não possui prova fotográfica | Bloquear resolução | Solicitar evidência |
| **MD-26** | Instituição conclui atendimento | Possui fotografia, responsável e data/hora | Permitir resolução | Status alterado para **Resolvido** |
| **MD-27** | Ocorrência resolvida volta a existir | Novo problema identificado no mesmo local | Permitir reabertura conforme regra | Ocorrência passa para **Reaberta**, preservando histórico |
| **MD-28** | Usuário tenta alterar localização | Ocorrência já registrada | Não permitir alteração livre | Localização original permanece preservada |
| **MD-29** | Necessidade de corrigir localização | Correção legítima identificada | Permitir mediante regra autorizada | Alteração registrada em auditoria |
| **MD-30** | Ocorrência permanece sem atualização | Período definido ultrapassado | Marcar como desatualizada/inativa | Reduzir confiança sem apagar histórico |
| **MD-31** | Ocorrência temporária perde validade | Evento deixou de existir | Atualizar situação | Ocorrência permanece no histórico |
| **MD-32** | Usuário informa severidade | Classificação inicial realizada pelo cidadão | Aceitar como indicação | Severidade não é considerada oficial automaticamente |
| **MD-33** | Instituição altera severidade | Usuário institucional autorizado | Permitir alteração | Classificação institucional registrada |
| **MD-34** | Ocorrência envolve infraestrutura crítica | Ponte, rodovia, desabamento ou situação equivalente | Aplicar prioridade diferenciada | Maior destaque e urgência |
| **MD-35** | Alerta natural é emitido | Alerta oficial disponível | Exibir alerta | Banner ou notificação conforme severidade |
| **MD-36** | Alerta possui alta severidade | Critério de alerta crítico atingido | Destacar fortemente | Overlay e alerta sonoro |
| **MD-37** | Usuário comum tenta criar alerta oficial | Usuário não possui permissão | Bloquear | Apenas fontes ou perfis autorizados podem emitir alertas oficiais |
| **MD-38** | Alerta perde validade | Data/hora de validade ultrapassada | Encerrar alerta ativo | Retirar destaque e manter histórico |
| **MD-39** | Sistema identifica comportamento automatizado | Tentativas excessivas ou repetitivas | Aplicar limitação | Rate limit ou bloqueio temporário |
| **MD-40** | Usuário cria várias ocorrências rapidamente | Limite de criação excedido | Bloquear temporariamente | Prevenir spam |
| **MD-41** | Usuário tenta criar ocorrência fora da área permitida | Localização incompatível com a regra de proximidade | Bloquear | Ocorrência não é criada |
| **MD-42** | GPS apresenta baixa precisão | Precisão incompatível com a regra de localização | Solicitar atualização da localização | Impedir ação até obter localização confiável |
| **MD-43** | Usuário tenta manipular localização | Indícios de localização falsa | Bloquear ou encaminhar para análise | Evento registrado para análise antifraude |
| **MD-44** | Conta recém-criada apresenta comportamento anormal | Alto volume ou padrão suspeito de ações | Aplicar restrições preventivas | Limitação temporária ou monitoramento |
| **MD-45** | Usuário altera sua reação | Recurso permitido | Registrar alteração | Histórico da reação preservado |
| **MD-46** | Usuário solicita exclusão da ocorrência | Ocorrência já possui interações | Aplicar exclusão lógica conforme regra | Histórico permanece preservado |
| **MD-47** | Ocorrência é considerada duplicada | Correspondência confirmada | Vincular à ocorrência principal | Autores e histórico são preservados |
| **MD-48** | Ocorrência recebe denúncia de abuso | Denúncia encaminhada para análise | Não excluir imediatamente | Ocorrência permanece sujeita à moderação |
| **MD-49** | Instituição atualiza ocorrência | Perfil institucional autorizado | Registrar alteração | Auditoria com usuário, data e hora |
| **MD-50** | Alteração relevante ocorre | Evento realizado no sistema | Registrar auditoria | Histórico imutável da ação |
| **MD-51** | Sistema precisa determinar confiabilidade | Existem múltiplas fontes de informação | Não utilizar uma única informação como verdade absoluta | Considerar localização, evidências, histórico, comunidade e validação institucional |

## Princípios derivados da matriz

A matriz deve seguir os seguintes princípios:

1. **Uma ocorrência não deve ser considerada verdadeira ou falsa com base em uma única interação.**
2. **Rejeições não devem provocar exclusão automática.**
3. **A validação comunitária não substitui a validação institucional.**
4. **A validação institucional não deve ser confundida com a resolução do problema.**
5. **A resolução exige evidência fotográfica na primeira versão.**
6. **Toda ação relevante deve ser rastreável por auditoria.**
7. **A proximidade geográfica deve ser verificada no momento da ação.**
8. **A localização original de uma ocorrência deve ser preservada.**
9. **Contas com comportamento abusivo devem sofrer medidas progressivas.**
10. **Ocorrências históricas não devem ser simplesmente apagadas quando deixam de estar ativas.**

## Fluxo decisório principal

```text
                    ┌──────────────────┐
                    │ Usuário acessa   │
                    │      o ZELO      │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Deseja criar uma │
                    │    ocorrência?   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Está autenticado?│
                    └──────┬─────┬─────┘
                           │ NÃO │ SIM
                           ▼     ▼
                       BLOQUEIA  │
                                 ▼
                       ┌─────────────────┐
                       │ GPS ≤ 300 m?   │
                       └──────┬────┬─────┘
                              │ NÃO│ SIM
                              ▼    ▼
                          BLOQUEIA  │
                                   ▼
                         ┌─────────────────┐
                         │ Possível        │
                         │ duplicidade?    │
                         └──────┬────┬─────┘
                                │ SIM│ NÃO
                                ▼    ▼
                           SUGERIR   │
                           EXISTENTE │
                                     ▼
                            REGISTRAR OCORRÊNCIA
                                     │
                                     ▼
                           VALIDAÇÃO COMUNITÁRIA
                                     │
                         ┌───────────┴───────────┐
                         ▼                       ▼
                  CONFIRMAÇÃO               SEM CONFIRMAÇÃO
                         │                       │
                         ▼                       ▼
                  MAIOR CONFIANÇA          AGUARDAR / INATIVA
                         │
                         ▼
                 AVALIAÇÃO INSTITUCIONAL
                         │
                         ▼
                    EM ATENDIMENTO
                         │
                         ▼
                  INTERVENÇÃO REALIZADA
                         │
                         ▼
                  POSSUI FOTO DE PROVA?
                    │             │
                   NÃO           SIM
                    │             │
                    ▼             ▼
                 BLOQUEIA      RESOLVIDA
                                  │
                                  ▼
                            HISTÓRICO ZELO
