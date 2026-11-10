package com.zelo.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Usuário da plataforma e seu papel de acesso.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(length = 11, unique = true, nullable = false)
    private String cpf;

    @Column(name = "password_hash")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    /**
     * Cidade/município de atuação do usuário. Usada pelo RBAC para isolar a
     * gestão local: GESTOR e FISCAL atuam apenas na sua cidade. Para USER é
     * opcional/informativa. NÃO é usada para validar a criação de incidentes
     * (registro é por geolocalização/geofence, independente do perfil).
     */
    @Column(name = "city")
    private String city;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        if (role == null) {
            role = Role.USER;
        }
    }
}
