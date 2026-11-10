package com.zelo.backend.entity;

/**
 * Papéis (RBAC) do ZELO, em ordem crescente de privilégio:
 *
 * - USER:    cidadão — cria pontos, comenta, confirma (upvote).
 * - FISCAL:  fiscal municipal — validatualiza e responde pontos críticos
 *            da cidade designada (promovido/rebaixado pelo GESTOR da mesma cidade).
 * - GESTOR:  gestor municipal — vê e altera status de TODOS os pontos da sua
 *            cidade e promove/rebaixa cidadãos a fiscal SOMENTE na mesma cidade.
 * - ROOT:    superusuário — acesso irrestrito a todas as cidades e usuários
 *            (inclusive promover gestores). Não há modelo de planos/assinaturas
 *            no MVP (decisão registrada no CHANGELOG).
 *
 * OBS: o valor ADMIN foi substituído por ROOT. A coluna no Postgres é varchar
 * (não enum nativo), então a troca é só de código — nenhum dado usava ADMIN.
 */
public enum Role {
    USER,
    FISCAL,
    GESTOR,
    ROOT
}
