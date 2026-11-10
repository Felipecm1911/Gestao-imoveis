package br.com.gestaoimoveis.contracts.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import org.hibernate.annotations.CreationTimestamp;

/** Reajuste aplicado a um contrato. Registro histórico: não se altera. */
@Entity
public class ContractAdjustment {

    @Id
    private UUID id = UUID.randomUUID();
    private UUID organizationId;
    private UUID contractId;
    private BigDecimal percent;
    private LocalDate effectiveDate;
    private BigDecimal oldRent;
    private BigDecimal newRent;
    private UUID userId;
    @CreationTimestamp
    private Instant createdAt;

    protected ContractAdjustment() {}

    public ContractAdjustment(UUID organizationId, UUID contractId, BigDecimal percent, LocalDate effectiveDate,
            BigDecimal oldRent, BigDecimal newRent, UUID userId) {
        this.organizationId = organizationId;
        this.contractId = contractId;
        this.percent = percent;
        this.effectiveDate = effectiveDate;
        this.oldRent = oldRent;
        this.newRent = newRent;
        this.userId = userId;
    }

    public UUID getId() { return id; }
    public BigDecimal getPercent() { return percent; }
    public LocalDate getEffectiveDate() { return effectiveDate; }
    public BigDecimal getOldRent() { return oldRent; }
    public BigDecimal getNewRent() { return newRent; }
    public Instant getCreatedAt() { return createdAt; }
}
