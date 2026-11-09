-- Fase 2: organizações, usuários, proprietários, imóveis, arquivos, fotos e sessão.
-- Roda como app_owner. app_user (a aplicação) recebe só DML e fica sujeito ao RLS.

ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- Organização da transação atual (definida pelo backend com set_config(..., true)).
CREATE FUNCTION app.current_org() RETURNS uuid
    LANGUAGE sql STABLE
AS $$ SELECT nullif(current_setting('app.org_id', true), '')::uuid $$;

CREATE TABLE organization (
    id         uuid PRIMARY KEY,
    name       varchar(120) NOT NULL,
    slug       varchar(60)  NOT NULL UNIQUE,
    plan       varchar(20)  NOT NULL DEFAULT 'FREE',
    created_at timestamptz  NOT NULL DEFAULT now(),
    updated_at timestamptz  NOT NULL DEFAULT now(),
    version    bigint       NOT NULL DEFAULT 0
);

CREATE TABLE app_user (
    id              uuid PRIMARY KEY,
    organization_id uuid         NOT NULL REFERENCES organization (id),
    email           varchar(254) NOT NULL,
    password_hash   varchar(100) NOT NULL,
    name            varchar(120) NOT NULL,
    role            varchar(10)  NOT NULL CHECK (role IN ('ADMIN', 'STAFF', 'OWNER', 'TENANT')),
    owner_id        uuid,
    active          boolean      NOT NULL DEFAULT true,
    created_at      timestamptz  NOT NULL DEFAULT now(),
    updated_at      timestamptz  NOT NULL DEFAULT now(),
    version         bigint       NOT NULL DEFAULT 0
);
-- e-mail único no sistema inteiro: o login acontece antes de se saber a organização
CREATE UNIQUE INDEX app_user_email_uk ON app_user (lower(email));
CREATE INDEX app_user_org_idx ON app_user (organization_id);

CREATE TABLE owner (
    id              uuid PRIMARY KEY,
    organization_id uuid         NOT NULL REFERENCES organization (id),
    name            varchar(120) NOT NULL,
    document        varchar(20)  NOT NULL,
    email           varchar(254),
    phone           varchar(20),
    address         jsonb,
    bank_info       varchar(300),
    anonymized_at   timestamptz,
    created_at      timestamptz  NOT NULL DEFAULT now(),
    updated_at      timestamptz  NOT NULL DEFAULT now(),
    version         bigint       NOT NULL DEFAULT 0,
    UNIQUE (organization_id, document),
    UNIQUE (organization_id, id)
);
ALTER TABLE app_user ADD FOREIGN KEY (organization_id, owner_id) REFERENCES owner (organization_id, id);

CREATE TABLE property (
    id              uuid PRIMARY KEY,
    organization_id uuid          NOT NULL REFERENCES organization (id),
    owner_id        uuid          NOT NULL,
    code            varchar(20)   NOT NULL,
    title           varchar(120)  NOT NULL,
    description     varchar(4000),
    type            varchar(20)   NOT NULL CHECK (type IN ('APARTAMENTO', 'CASA', 'COMERCIAL', 'TERRENO', 'OUTRO')),
    street          varchar(120)  NOT NULL,
    number          varchar(10)   NOT NULL,
    complement      varchar(60),
    district        varchar(80)   NOT NULL,
    city            varchar(80)   NOT NULL,
    state           char(2)       NOT NULL,
    zip             char(8)       NOT NULL,
    area_m2         numeric(10, 2) CHECK (area_m2 > 0),
    bedrooms        smallint      NOT NULL DEFAULT 0 CHECK (bedrooms >= 0),
    bathrooms       smallint      NOT NULL DEFAULT 0 CHECK (bathrooms >= 0),
    parking         smallint      NOT NULL DEFAULT 0 CHECK (parking >= 0),
    suggested_rent  numeric(14, 2) NOT NULL CHECK (suggested_rent >= 0),
    status          varchar(12)   NOT NULL DEFAULT 'DISPONIVEL'
                    CHECK (status IN ('DISPONIVEL', 'OCUPADO', 'MANUTENCAO', 'INATIVO')),
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz   NOT NULL DEFAULT now(),
    version         bigint        NOT NULL DEFAULT 0,
    UNIQUE (organization_id, code),
    UNIQUE (organization_id, id),
    FOREIGN KEY (organization_id, owner_id) REFERENCES owner (organization_id, id)
);
CREATE INDEX property_city_idx   ON property (organization_id, city);
CREATE INDEX property_status_idx ON property (organization_id, status);
CREATE INDEX property_type_idx   ON property (organization_id, type);
CREATE INDEX property_rent_idx   ON property (organization_id, suggested_rent);
CREATE INDEX property_owner_idx  ON property (organization_id, owner_id);

CREATE TABLE stored_file (
    id              uuid PRIMARY KEY,
    organization_id uuid         NOT NULL REFERENCES organization (id),
    original_name   varchar(255) NOT NULL,
    content_type    varchar(100) NOT NULL,
    size            bigint       NOT NULL CHECK (size > 0),
    storage_key     varchar(200) NOT NULL UNIQUE,
    visibility      varchar(12)  NOT NULL DEFAULT 'INTERNO'
                    CHECK (visibility IN ('INTERNO', 'PROPRIETARIO', 'INQUILINO', 'TODOS')),
    created_at      timestamptz  NOT NULL DEFAULT now(),
    UNIQUE (organization_id, id)
);

CREATE TABLE property_photo (
    id              uuid PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organization (id),
    property_id     uuid        NOT NULL,
    file_id         uuid        NOT NULL,
    position        int         NOT NULL,
    is_cover        boolean     NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (organization_id, property_id) REFERENCES property (organization_id, id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id, file_id) REFERENCES stored_file (organization_id, id)
);
CREATE INDEX property_photo_property_idx ON property_photo (property_id, position);
CREATE UNIQUE INDEX property_photo_one_cover ON property_photo (property_id) WHERE is_cover;

-- Sem organização: o login é tentado antes de existir sessão.
CREATE TABLE login_attempt (
    id           bigserial PRIMARY KEY,
    email        varchar(254) NOT NULL,
    ip           varchar(45)  NOT NULL,
    attempted_at timestamptz  NOT NULL DEFAULT now(),
    success      boolean      NOT NULL
);
CREATE INDEX login_attempt_idx ON login_attempt (lower(email), ip, attempted_at);

-- Spring Session JDBC (schema oficial para PostgreSQL)
CREATE TABLE spring_session (
    primary_id            char(36) NOT NULL,
    session_id            char(36) NOT NULL,
    creation_time         bigint   NOT NULL,
    last_access_time      bigint   NOT NULL,
    max_inactive_interval int      NOT NULL,
    expiry_time           bigint   NOT NULL,
    principal_name        varchar(100),
    CONSTRAINT spring_session_pk PRIMARY KEY (primary_id)
);
CREATE UNIQUE INDEX spring_session_ix1 ON spring_session (session_id);
CREATE INDEX spring_session_ix2 ON spring_session (expiry_time);
CREATE INDEX spring_session_ix3 ON spring_session (principal_name);

CREATE TABLE spring_session_attributes (
    session_primary_id char(36)     NOT NULL,
    attribute_name     varchar(200) NOT NULL,
    attribute_bytes    bytea        NOT NULL,
    CONSTRAINT spring_session_attributes_pk PRIMARY KEY (session_primary_id, attribute_name),
    CONSTRAINT spring_session_attributes_fk FOREIGN KEY (session_primary_id)
        REFERENCES spring_session (primary_id) ON DELETE CASCADE
);

-- RLS: segunda camada de isolamento. FORCE vale também para o dono das tabelas.
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON organization USING (id = app.current_org());

DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['app_user', 'owner', 'property', 'stored_file', 'property_photo'] LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
        EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (organization_id = app.current_org())', t);
    END LOOP;
END $$;

-- Única porta antes de existir organização na sessão: o login lê só a linha do e-mail informado,
-- que o backend grava em app.login_email dentro da transação do login.
CREATE POLICY login_lookup ON app_user FOR SELECT
    USING (lower(email) = nullif(current_setting('app.login_email', true), ''));
