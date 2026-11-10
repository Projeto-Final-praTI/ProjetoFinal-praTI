package com.zelo.backend.entity;

/**
 * Status operacionais do ponto crítico.
 * (Substitui EM_ANALISE por EM_ATENDIMENTO; nenhum dado usava EM_ANALISE.)
 */
public enum IncidentStatus {
    ABERTO,
    EM_ATENDIMENTO,
    RESOLVIDO
}
