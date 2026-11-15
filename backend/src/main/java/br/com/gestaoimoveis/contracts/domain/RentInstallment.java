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

    /** O que se mostra: a parcela aberta vira PAGA quando o saldo zera e EM_ATRASO quando vence com saldo. */
    public enum Situation { ABERTA, EM_ATRASO, PAGA, CANCELADA }

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
    private BigDecimal paidAmount = BigDecimal.ZERO.setScale(2);
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

    public BigDecimal balance() {
        return amount.subtract(paidAmount);
    }

    /** Sem pagamento algum: só essas mudam de valor (reajuste) ou são canceladas (encerramento). */
    public boolean isUnpaid() {
        return paidAmount.signum() == 0;
    }

    public void pay(BigDecimal value) {
        this.paidAmount = paidAmount.add(value);
    }

    public void unpay(BigDecimal value) {
        this.paidAmount = paidAmount.subtract(value);
    }

    public Situation situation(LocalDate today) {
        if (!isOpen()) return Situation.CANCELADA;
        if (balance().signum() <= 0) return Situation.PAGA;
        return dueDate.isBefore(today) ? Situation.EM_ATRASO : Situation.ABERTA;
    }

    public UUID getId() { return id; }
    public UUID getContractId() { return contractId; }
    public LocalDate getReferenceMonth() { return referenceMonth; }
    public LocalDate getDueDate() { return dueDate; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public Status getStatus() { return status; }
}
