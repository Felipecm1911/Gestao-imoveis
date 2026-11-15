-- Fase 4: pagamentos (parciais, idempotentes, estornáveis) e despesas do imóvel.

-- total já pago de cada parcela, mantido pelo serviço de pagamentos sob trava de linha;
-- o CHECK é a última barreira contra pagar mais do que o valor da parcela
ALTER TABLE rent_installment
    ADD COLUMN paid_amount numeric(14, 2) NOT NULL DEFAULT 0,
    ADD CONSTRAINT rent_installment_paid_check CHECK (paid_amount >= 0 AND paid_amount <= amount),
    ADD UNIQUE (organization_id, id);

CREATE TABLE payment (
    id              uuid PRIMARY KEY,
    organization_id uuid           NOT NULL REFERENCES organization (id),
    installment_id  uuid           NOT NULL,
    amount          numeric(14, 2) NOT NULL CHECK (amount > 0),
    paid_on         date           NOT NULL,
    method          varchar(16)    NOT NULL
                    CHECK (method IN ('PIX', 'BOLETO', 'TRANSFERENCIA', 'DINHEIRO', 'CARTAO')),
    notes           varchar(500),
    idempotency_key varchar(64)    NOT NULL,
    user_id         uuid           NOT NULL REFERENCES app_user (id),
    reversed_at     timestamptz,
    reversed_by     uuid REFERENCES app_user (id),
    reversal_reason varchar(500),
    created_at      timestamptz    NOT NULL DEFAULT now(),
    -- a mesma requisição repetida não vira dois pagamentos
    UNIQUE (organization_id, idempotency_key),
    FOREIGN KEY (organization_id, installment_id) REFERENCES rent_installment (organization_id, id),
    CHECK ((reversed_at IS NULL) = (reversal_reason IS NULL))
);
CREATE INDEX payment_installment_idx ON payment (installment_id);
CREATE INDEX payment_paid_on_idx ON payment (organization_id, paid_on);
-- pagamento não se apaga: estorna-se
REVOKE DELETE ON payment FROM app_user;

CREATE TABLE expense (
    id              uuid PRIMARY KEY,
    organization_id uuid           NOT NULL REFERENCES organization (id),
    property_id     uuid           NOT NULL,
    expense_date    date           NOT NULL,
    category        varchar(16)    NOT NULL
                    CHECK (category IN ('CONDOMINIO', 'IPTU', 'MANUTENCAO', 'SEGURO', 'TAXAS', 'OUTROS')),
    description     varchar(200)   NOT NULL,
    amount          numeric(14, 2) NOT NULL CHECK (amount > 0),
    user_id         uuid           NOT NULL REFERENCES app_user (id),
    created_at      timestamptz    NOT NULL DEFAULT now(),
    FOREIGN KEY (organization_id, property_id) REFERENCES property (organization_id, id)
);
CREATE INDEX expense_date_idx ON expense (organization_id, expense_date);

DO $$
DECLARE t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['payment', 'expense'] LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
        EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (organization_id = app.current_org())', t);
    END LOOP;
END $$;
