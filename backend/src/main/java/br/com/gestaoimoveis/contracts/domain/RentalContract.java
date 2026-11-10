package br.com.gestaoimoveis.contracts.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
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
public class RentalContract {

    public enum Status { RASCUNHO, ATIVO, ENCERRADO, CANCELADO }
    public enum AdjustmentIndex { NENHUM, IGPM, IPCA, PERCENTUAL_FIXO }
    public enum GuaranteeType { NENHUMA, CAUCAO, FIADOR, SEGURO_FIANCA, TITULO_CAPITALIZACAO }

    /** O que a tela mostra: o status, com o ATIVO aberto em "em renovação" e "encerrando". */
    public enum Situation { RASCUNHO, ATIVO, EM_RENOVACAO, ENCERRANDO, ENCERRADO, CANCELADO }

    /** Contrato ativo que termina em até 60 dias (ou já venceu) e não tem renovação está "encerrando". */
    public static final int ENDING_DAYS = 60;

    @Id
    private UUID id = UUID.randomUUID();
    @Column(updatable = false)
    private UUID organizationId;
    @Column(updatable = false)
    private int number;
    private UUID propertyId;
    private UUID ownerId;
    private UUID tenantId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal monthlyRent;
    private short dueDay;
    @Enumerated(EnumType.STRING)
    private AdjustmentIndex adjustmentIndex;
    private BigDecimal adjustmentPercent;
    @Enumerated(EnumType.STRING)
    private GuaranteeType guaranteeType;
    private BigDecimal guaranteeValue;
    private String guaranteeNotes;
    @Enumerated(EnumType.STRING)
    private Status status = Status.RASCUNHO;
    private String notes;
    @Column(updatable = false)
    private UUID previousContractId;
    private LocalDate endedAt;
    private String endReason;
    @CreationTimestamp
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
    @Version
    private Long version;

    protected RentalContract() {}

    public RentalContract(UUID organizationId, int number, UUID previousContractId) {
        this.organizationId = organizationId;
        this.number = number;
        this.previousContractId = previousContractId;
    }

    public record Terms(UUID propertyId, UUID ownerId, UUID tenantId, LocalDate startDate, LocalDate endDate,
            BigDecimal monthlyRent, short dueDay, AdjustmentIndex adjustmentIndex, BigDecimal adjustmentPercent) {}

    public record Extras(GuaranteeType guaranteeType, BigDecimal guaranteeValue, String guaranteeNotes, String notes) {}

    /** Partes, prazo e valor: só mudam enquanto o contrato é rascunho (quem chama garante). */
    public void changeTerms(Terms t) {
        this.propertyId = t.propertyId();
        this.ownerId = t.ownerId();
        this.tenantId = t.tenantId();
        this.startDate = t.startDate();
        this.endDate = t.endDate();
        this.monthlyRent = t.monthlyRent();
        this.dueDay = t.dueDay();
        this.adjustmentIndex = t.adjustmentIndex();
        this.adjustmentPercent = t.adjustmentPercent();
    }

    public void changeExtras(Extras e) {
        this.guaranteeType = e.guaranteeType();
        this.guaranteeValue = e.guaranteeValue();
        this.guaranteeNotes = e.guaranteeNotes();
        this.notes = e.notes();
    }

    public void activate() {
        this.status = Status.ATIVO;
    }

    public void adjustRent(BigDecimal newRent) {
        this.monthlyRent = newRent;
    }

    public void end(LocalDate date, String reason) {
        this.status = Status.ENCERRADO;
        this.endedAt = date;
        this.endReason = reason;
    }

    public void cancel() {
        this.status = Status.CANCELADO;
    }

    public Situation situation(boolean hasDraftRenewal, LocalDate today) {
        if (status != Status.ATIVO) return Situation.valueOf(status.name());
        if (hasDraftRenewal) return Situation.EM_RENOVACAO;
        return endDate.isAfter(today.plusDays(ENDING_DAYS)) ? Situation.ATIVO : Situation.ENCERRANDO;
    }

    /** CT-0048 */
    public String code() {
        return "CT-%04d".formatted(number);
    }

    /** Retrato para a auditoria: só texto e número, sem dado pessoal. */
    public Map<String, Object> snapshot() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("status", status.name());
        m.put("propertyId", propertyId.toString());
        m.put("tenantId", tenantId.toString());
        m.put("startDate", startDate.toString());
        m.put("endDate", endDate.toString());
        m.put("monthlyRent", monthlyRent.toPlainString());
        m.put("dueDay", (int) dueDay);
        m.put("adjustmentIndex", adjustmentIndex.name());
        m.put("adjustmentPercent", adjustmentPercent == null ? null : adjustmentPercent.toPlainString());
        m.put("guaranteeType", guaranteeType.name());
        m.put("guaranteeValue", guaranteeValue == null ? null : guaranteeValue.toPlainString());
        m.put("guaranteeNotes", guaranteeNotes);
        m.put("notes", notes);
        m.put("endedAt", endedAt == null ? null : endedAt.toString());
        m.put("endReason", endReason);
        return m;
    }

    public UUID getId() { return id; }
    public int getNumber() { return number; }
    public UUID getPropertyId() { return propertyId; }
    public UUID getOwnerId() { return ownerId; }
    public UUID getTenantId() { return tenantId; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public BigDecimal getMonthlyRent() { return monthlyRent; }
    public short getDueDay() { return dueDay; }
    public AdjustmentIndex getAdjustmentIndex() { return adjustmentIndex; }
    public BigDecimal getAdjustmentPercent() { return adjustmentPercent; }
    public GuaranteeType getGuaranteeType() { return guaranteeType; }
    public BigDecimal getGuaranteeValue() { return guaranteeValue; }
    public String getGuaranteeNotes() { return guaranteeNotes; }
    public Status getStatus() { return status; }
    public String getNotes() { return notes; }
    public UUID getPreviousContractId() { return previousContractId; }
    public LocalDate getEndedAt() { return endedAt; }
    public String getEndReason() { return endReason; }
    public Instant getCreatedAt() { return createdAt; }
    public Long getVersion() { return version; }
}
