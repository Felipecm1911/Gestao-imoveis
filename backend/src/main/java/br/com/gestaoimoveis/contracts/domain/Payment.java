package br.com.gestaoimoveis.contracts.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;

import org.hibernate.annotations.CreationTimestamp;

/** Pagamento de uma parcela. Não se altera nem se apaga: só pode ser estornado, com motivo. */
@Entity
public class Payment {

    public enum Method { PIX, BOLETO, TRANSFERENCIA, DINHEIRO, CARTAO }

    @Id
    private UUID id = UUID.randomUUID();
    @Column(updatable = false)
    private UUID organizationId;
    @Column(updatable = false)
    private UUID installmentId;
    @Column(updatable = false)
    private BigDecimal amount;
    @Column(updatable = false)
    private LocalDate paidOn;
    @Enumerated(EnumType.STRING)
    @Column(updatable = false)
    private Method method;
    @Column(updatable = false)
    private String notes;
    @Column(updatable = false)
    private String idempotencyKey;
    @Column(updatable = false)
    private UUID userId;
    private Instant reversedAt;
    private UUID reversedBy;
    private String reversalReason;
    @CreationTimestamp
    private Instant createdAt;

    protected Payment() {}

    public Payment(UUID organizationId, UUID installmentId, BigDecimal amount, LocalDate paidOn, Method method,
            String notes, String idempotencyKey, UUID userId) {
        this.organizationId = organizationId;
        this.installmentId = installmentId;
        this.amount = amount;
        this.paidOn = paidOn;
        this.method = method;
        this.notes = notes;
        this.idempotencyKey = idempotencyKey;
        this.userId = userId;
    }

    public void reverse(UUID userId, String reason) {
        this.reversedAt = Instant.now();
        this.reversedBy = userId;
        this.reversalReason = reason;
    }

    public boolean isReversed() {
        return reversedAt != null;
    }

    public UUID getId() { return id; }
    public UUID getInstallmentId() { return installmentId; }
    public BigDecimal getAmount() { return amount; }
    public LocalDate getPaidOn() { return paidOn; }
    public Method getMethod() { return method; }
    public String getNotes() { return notes; }
    public UUID getUserId() { return userId; }
    public Instant getReversedAt() { return reversedAt; }
    public String getReversalReason() { return reversalReason; }
    public Instant getCreatedAt() { return createdAt; }
}
