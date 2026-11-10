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
import jakarta.persistence.Version;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
public class RentInstallment {

    public enum Status { ABERTA, CANCELADA }

    @Id
    private UUID id = UUID.randomUUID();
    @Column(updatable = false)
    private UUID organizationId;
    @Column(updatable = false)
    private UUID contractId;
    @Column(updatable = false)
    private LocalDate referenceMonth;
    private LocalDate dueDate;
    private BigDecimal amount;
    @Enumerated(EnumType.STRING)
    private Status status = Status.ABERTA;
    @CreationTimestamp
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
    @Version
    private Long version;

    protected RentInstallment() {}

    public RentInstallment(UUID organizationId, UUID contractId, InstallmentPlan.Item item) {
        this.organizationId = organizationId;
        this.contractId = contractId;
        this.referenceMonth = item.referenceMonth();
        this.dueDate = item.dueDate();
        this.amount = item.amount();
    }

    public void changeAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public void cancel() {
        this.status = Status.CANCELADA;
    }

    public boolean isOpen() {
        return status == Status.ABERTA;
    }

    public UUID getId() { return id; }
    public LocalDate getReferenceMonth() { return referenceMonth; }
    public LocalDate getDueDate() { return dueDate; }
    public BigDecimal getAmount() { return amount; }
    public Status getStatus() { return status; }
}
