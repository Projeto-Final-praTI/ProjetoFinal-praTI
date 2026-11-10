package com.zelo.backend.entity;

/**
 * Fluxo de moderação de uma denúncia de pessoa desaparecida:
 * o cidadão envia (PENDENTE), fiscal/gestor/root aprova (APROVADO) ou
 * recusa (RECUSADO). Só as aprovadas aparecem para a população.
 */
public enum MissingPersonStatus {
    PENDENTE,
    APROVADO,
    RECUSADO
}
