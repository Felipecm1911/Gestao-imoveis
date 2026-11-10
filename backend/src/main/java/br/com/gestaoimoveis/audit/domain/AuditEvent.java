package br.com.gestaoimoveis.audit.domain;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Evento da trilha de auditoria. Só se insere: o banco nega UPDATE e DELETE à aplicação. */
@Entity
public class AuditEvent {

    @Id
    private UUID id = UUID.randomUUID();
    @Column(updatable = false)
    private UUID organizationId;
    private UUID userId;
    private String entity;
    private UUID entityId;
    private String action;
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> before;
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> after;
    @CreationTimestamp
    @Column(name = "at")
    private Instant occurredAt;

    protected AuditEvent() {}

    public AuditEvent(UUID organizationId, UUID userId, String entity, UUID entityId, String action,
            Map<String, Object> before, Map<String, Object> after) {
        this.organizationId = organizationId;
        this.userId = userId;
        this.entity = entity;
        this.entityId = entityId;
        this.action = action;
        this.before = before;
        this.after = after;
    }

    public UUID getUserId() { return userId; }
    public String getAction() { return action; }
    public Map<String, Object> getBefore() { return before; }
    public Map<String, Object> getAfter() { return after; }
    public Instant getOccurredAt() { return occurredAt; }
}
