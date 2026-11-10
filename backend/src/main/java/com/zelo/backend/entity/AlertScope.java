package com.zelo.backend.entity;

/**
 * Abrangência de um alerta oficial disparado por gestor/root.
 *
 * - GLOBAL: vale para todo o território (não depende da localização do usuário).
 * - LOCAL:  vale para a cidade do gestor (ou cidade escolhida pelo root),
 *           dentro do raio configurado a partir do centro do município.
 *
 * Alertas automáticos do motor climático têm {@code scope == null} e são
 * sempre locais (gerados em torno da coordenada consultada).
 */
public enum AlertScope {
    GLOBAL,
    LOCAL
}
