-- ============================================================
-- ZELO - schema do banco de dados
-- PostgreSQL 16+ com PostGIS
--
-- Este script cria a estrutura do banco (tabelas, chaves,
-- constraints e indices) sem incluir dados de usuarios.
-- Foi derivado do modelo JPA atual e substitui os dumps
-- antigos que continham dados pessoais.
--
-- Uso (em um banco vazio):
--   psql -U zelo_user -d zelo_db -f database/schema.sql
--
-- Requisitos:
--   CREATE DATABASE zelo_db;
--   \c zelo_db
--   CREATE EXTENSION IF NOT EXISTS postgis;
--
-- Observacao: em desenvolvimento o Hibernate tambem atualiza o
-- schema (spring.jpa.hibernate.ddl-auto=update). Em producao,
-- recomenda-se adotar migracoes versionadas (Flyway/Liquibase).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ------------------------------------------------------------
-- Usuarios e papeis
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id              uuid PRIMARY KEY,
    cpf             varchar(11)  NOT NULL,
    created_at      timestamp(6) with time zone,
    email           varchar(255) NOT NULL,
    full_name       varchar(255) NOT NULL,
    password_hash   varchar(255),
    role            varchar(255) NOT NULL,
    city            varchar(255),
    CONSTRAINT users_cpf_key   UNIQUE (cpf),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_role_check CHECK (
        role IN ('USER', 'FISCAL', 'GESTOR', 'ROOT')
    )
);

-- ------------------------------------------------------------
-- Pontos criticos (ocorrencias)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS incidents (
    id              uuid PRIMARY KEY,
    category        varchar(255) NOT NULL,
    created_at      timestamp(6) with time zone,
    description     text,
    location        geometry(Point, 4326),
    status          varchar(255) NOT NULL,
    title           varchar(255) NOT NULL,
    upvotes_count   integer      NOT NULL DEFAULT 0,
    author_id       uuid         NOT NULL,
    city            varchar(255),
    CONSTRAINT incidents_author_fk FOREIGN KEY (author_id) REFERENCES users (id),
    CONSTRAINT incidents_category_check CHECK (
        category IN ('BURACO', 'PONTE_QUEBRADA', 'ALAGAMENTO',
                     'QUEDA_ARVORE', 'DESLIZAMENTO', 'OUTROS')
    ),
    CONSTRAINT incidents_status_check CHECK (
        status IN ('ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO')
    )
);

CREATE TABLE IF NOT EXISTS incident_evidences (
    id              uuid PRIMARY KEY,
    image_url       varchar(255) NOT NULL,
    uploaded_at     timestamp(6) with time zone,
    incident_id     uuid         NOT NULL,
    CONSTRAINT incident_evidences_incident_fk
        FOREIGN KEY (incident_id) REFERENCES incidents (id)
);

CREATE TABLE IF NOT EXISTS incident_comments (
    id              uuid PRIMARY KEY,
    content         text         NOT NULL,
    created_at      timestamp(6) with time zone,
    author_id       uuid,
    incident_id     uuid         NOT NULL,
    CONSTRAINT incident_comments_author_fk
        FOREIGN KEY (author_id) REFERENCES users (id),
    CONSTRAINT incident_comments_incident_fk
        FOREIGN KEY (incident_id) REFERENCES incidents (id)
);

CREATE TABLE IF NOT EXISTS incident_upvotes (
    id              uuid PRIMARY KEY,
    created_at      timestamp(6) with time zone,
    incident_id     uuid NOT NULL,
    user_id         uuid NOT NULL,
    CONSTRAINT incident_upvotes_incident_fk
        FOREIGN KEY (incident_id) REFERENCES incidents (id),
    CONSTRAINT incident_upvotes_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT incident_upvotes_incident_user_key
        UNIQUE (incident_id, user_id)
);

CREATE TABLE IF NOT EXISTS incident_status_history (
    id                uuid PRIMARY KEY,
    created_at        timestamp(6) with time zone,
    new_status        varchar(255) NOT NULL,
    note              text,
    previous_status   varchar(255),
    author_id         uuid,
    incident_id       uuid         NOT NULL,
    CONSTRAINT incident_status_history_author_fk
        FOREIGN KEY (author_id) REFERENCES users (id),
    CONSTRAINT incident_status_history_incident_fk
        FOREIGN KEY (incident_id) REFERENCES incidents (id),
    CONSTRAINT incident_status_history_new_status_check CHECK (
        new_status IN ('ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO')
    ),
    CONSTRAINT incident_status_history_previous_status_check CHECK (
        previous_status IS NULL
        OR previous_status IN ('ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO')
    )
);

-- ------------------------------------------------------------
-- Alertas climaticos e alertas oficiais
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS weather_alerts (
    id               uuid PRIMARY KEY,
    center_location  geometry(Point, 4326),
    created_at       timestamp(6) with time zone,
    description      text,
    expires_at       timestamp(6) with time zone,
    radius_meters    double precision,
    severity         varchar(255) NOT NULL,
    source           varchar(255),
    scope            varchar(255),
    city             varchar(255),
    created_by_name  varchar(255),
    title            varchar(255) NOT NULL,
    fingerprint      varchar(255),
    CONSTRAINT weather_alerts_severity_check CHECK (
        severity IN ('AMARELO', 'LARANJA', 'VERMELHO')
    ),
    CONSTRAINT weather_alerts_scope_check CHECK (
        scope IS NULL OR scope IN ('GLOBAL', 'LOCAL')
    )
);

-- ------------------------------------------------------------
-- Pessoas desaparecidas
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS missing_person_reports (
    id                        uuid PRIMARY KEY,
    person_name               varchar(255) NOT NULL,
    kind                      varchar(255) NOT NULL,
    description               text         NOT NULL,
    last_seen_info            text,
    contact                   varchar(255),
    city                      varchar(255) NOT NULL,
    photo_url                 varchar(255) NOT NULL,
    status                    varchar(255) NOT NULL,
    scope                     varchar(255),
    center_location           geometry(Point, 4326),
    radius_meters             double precision,
    requested_radius_meters   double precision,
    pre_alert_expires_at      timestamp(6) with time zone,
    expires_at                timestamp(6) with time zone,
    submitted_by_id           uuid,
    submitted_by_name         varchar(255),
    approved_by_name          varchar(255),
    approved_at               timestamp(6) with time zone,
    rejection_reason          varchar(255),
    created_at                timestamp(6) with time zone,
    CONSTRAINT missing_person_reports_kind_check CHECK (
        kind IN ('DESAPARECIMENTO', 'SEQUESTRO')
    ),
    CONSTRAINT missing_person_reports_status_check CHECK (
        status IN ('PENDENTE', 'APROVADO', 'RECUSADO')
    ),
    CONSTRAINT missing_person_reports_scope_check CHECK (
        scope IS NULL OR scope IN ('GLOBAL', 'LOCAL')
    )
);

CREATE TABLE IF NOT EXISTS missing_person_comments (
    id              uuid PRIMARY KEY,
    report_id       uuid         NOT NULL,
    author_id       uuid,
    author_name     varchar(255) NOT NULL,
    content         text         NOT NULL,
    image_url       varchar(255),
    created_at      timestamp(6) with time zone,
    CONSTRAINT missing_person_comments_report_fk
        FOREIGN KEY (report_id) REFERENCES missing_person_reports (id)
);

-- ------------------------------------------------------------
-- Indices de apoio
-- ------------------------------------------------------------

-- Consultas por proximidade (ST_DWithin / ST_Distance)
CREATE INDEX IF NOT EXISTS idx_incidents_location
    ON incidents USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_weather_alerts_center
    ON weather_alerts USING GIST (center_location);

CREATE INDEX IF NOT EXISTS idx_missing_person_reports_center
    ON missing_person_reports USING GIST (center_location);

-- Filtros e ordenacoes frequentes
CREATE INDEX IF NOT EXISTS idx_incidents_created_at
    ON incidents (created_at);

CREATE INDEX IF NOT EXISTS idx_incidents_status
    ON incidents (status);

CREATE INDEX IF NOT EXISTS idx_incidents_city
    ON incidents (city);

CREATE INDEX IF NOT EXISTS idx_missing_person_reports_status
    ON missing_person_reports (status);

CREATE INDEX IF NOT EXISTS idx_missing_person_reports_city
    ON missing_person_reports (city);

-- ------------------------------------------------------------
-- Fim do schema
-- ------------------------------------------------------------
