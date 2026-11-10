-- Fase 3: inquilinos, contratos, reajustes, parcelas e trilha de auditoria.

CREATE TABLE tenant (
    id              uuid PRIMARY KEY,
    organization_id uuid         NOT NULL REFERENCES organization (id),
    name            varchar(120) NOT NULL,
    document        varchar(20)  NOT NULL,
    email           varchar(254),
    phone           varchar(20),
    address         jsonb,
    anonymized_at   timestamptz,
    created_at      timestamptz  NOT NULL DEFAULT now(),
    updated_at      timestamptz  NOT NULL DEFAULT now(),
    version         bigint       NOT NULL DEFAULT 0,
    UNIQUE (organization_id, document),
    UNIQUE (organization_id, id)
);

CREATE TABLE rental_contract (
    id                   uuid PRIMARY KEY,
    organization_id      uuid           NOT NULL REFERENCES organization (id),
    number               int            NOT NULL,
    property_id          uuid           NOT NULL,
    owner_id             uuid           NOT NULL,
    tenant_id            uuid           NOT NULL,
    start_date           date           NOT NULL,
    end_date             date           NOT NULL,
    monthly_rent         numeric(14, 2) NOT NULL CHECK (monthly_rent > 0),
    due_day              smallint       NOT NULL CHECK (due_day BETWEEN 1 AND 28),
    adjustment_index     varchar(16)    NOT NULL DEFAULT 'NENHUM'
                         CHECK (adjustment_index IN ('NENHUM', 'IGPM', 'IPCA', 'PERCENTUAL_FIXO')),
    adjustment_percent   numeric(6, 2)  CHECK (adjustment_percent >= 0),
    guarantee_type       varchar(24)    NOT NULL DEFAULT 'NENHUMA'
                         CHECK (guarantee_type IN ('NENHUMA', 'CAUCAO', 'FIADOR', 'SEGURO_FIANCA', 'TITULO_CAPITALIZACAO')),
    guarantee_value      numeric(14, 2) CHECK (guarantee_value >= 0),
    guarantee_notes      varchar(500),
    status               varchar(10)    NOT NULL DEFAULT 'RASCUNHO'
                         CHECK (status IN ('RASCUNHO', 'ATIVO', 'ENCERRADO', 'CANCELADO')),
    notes                varchar(2000),
    previous_contract_id uuid,
    ended_at             date,
    end_reason           varchar(500),
    created_at           timestamptz    NOT NULL DEFAULT now(),
    updated_at           timestamptz    NOT NULL DEFAULT now(),
    version              bigint         NOT NULL DEFAULT 0,
    CHECK (end_date > start_date),
    UNIQUE (organization_id, number),
    UNIQUE (organization_id, id),
    FOREIGN KEY (organization_id, property_id) REFERENCES property (organization_id, id),
    FOREIGN KEY (organization_id, owner_id) REFERENCES owner (organization_id, id),
    FOREIGN KEY (organization_id, tenant_id) REFERENCES tenant (organization_id, id),
    FOREIGN KEY (organization_id, previous_contract_id) REFERENCES rental_contract (organization_id, id),
    -- última barreira contra dois contratos ativos no mesmo imóvel e período (vale até com requisições simultâneas)
    CONSTRAINT rental_contract_no_overlap
        EXCLUDE USING gist (property_id WITH =, daterange(start_date, end_date, '[]') WITH &&)
        WHERE (status = 'ATIVO')
);
CREATE INDEX rental_contract_tenant_idx ON rental_contract (organization_id, tenant_id);
CREATE INDEX rental_contract_status_idx ON rental_contract (organization_id, status, end_date);

CREATE TABLE contract_adjustment (
    id              uuid PRIMARY KEY,
    organization_id uuid           NOT NULL REFERENCES organization (id),
    contract_id     uuid           NOT NULL,
    percent         numeric(6, 2)  NOT NULL,
    effective_date  date           NOT NULL,
    old_rent        numeric(14, 2) NOT NULL,
    new_rent        numeric(14, 2) NOT NULL,
    user_id         uuid           NOT NULL REFERENCES app_user (id),
    created_at      timestamptz    NOT NULL DEFAULT now(),
    FOREIGN KEY (organization_id, contract_id) REFERENCES rental_contract (organization_id, id)
);
CREATE INDEX contract_adjustment_contract_idx ON contract_adjustment (contract_id, effective_date);

CREATE TABLE rent_installment (
    id              uuid PRIMARY KEY,
    organization_id uuid           NOT NULL REFERENCES organization (id),
    contract_id     uuid           NOT NULL,
    reference_month date           NOT NULL, -- dia 1 do mês de competência
    due_date        date           NOT NULL,
    amount          numeric(14, 2) NOT NULL CHECK (amount >= 0),
    status          varchar(10)    NOT NULL DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'CANCELADA')),
    created_at      timestamptz    NOT NULL DEFAULT now(),
    updated_at      timestamptz    NOT NULL DEFAULT now(),
    version         bigint         NOT NULL DEFAULT 0,
    UNIQUE (contract_id, reference_month),
    FOREIGN KEY (organization_id, contract_id) REFERENCES rental_contract (organization_id, id)
);
CREATE INDEX rent_installment_due_idx ON rent_installment (organization_id, due_date);

CREATE TABLE audit_event (
    id              uuid PRIMARY KEY,
    organization_id uuid        NOT NULL REFERENCES organization (id),
    user_id         uuid        NOT NULL REFERENCES app_user (id),
    entity          varchar(40) NOT NULL,
    entity_id       uuid        NOT NULL,
    action          varchar(40) NOT NULL,
    before          jsonb,
    after           jsonb,
    at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_event_entity_idx ON audit_event (organization_id, entity, entity_id, at);
-- trilha só de inserção: a aplicação não altera nem apaga eventos
REVOKE UPDATE, DELETE ON audit_event FROM app_user;

DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['tenant', 'rental_contract', 'contract_adjustment', 'rent_installment', 'audit_event'] LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
        EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (organization_id = app.current_org())', t);
    END LOOP;
END $$;
