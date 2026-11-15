package br.com.gestaoimoveis.contracts.api;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import br.com.gestaoimoveis.contracts.domain.Payment;
import br.com.gestaoimoveis.contracts.domain.RentInstallment;
import br.com.gestaoimoveis.contracts.domain.RentalContract.AdjustmentIndex;
import br.com.gestaoimoveis.contracts.domain.RentalContract.GuaranteeType;
import br.com.gestaoimoveis.contracts.domain.RentalContract.Situation;
import br.com.gestaoimoveis.contracts.domain.RentalContract.Status;
import br.com.gestaoimoveis.owners.api.OwnerDtos.OwnerSummary;
import br.com.gestaoimoveis.tenants.api.TenantDtos.TenantSummary;

public final class ContractDtos {

    private ContractDtos() {}

    public record ContractRequest(
            @NotNull UUID propertyId,
            @NotNull UUID tenantId,
            @NotNull LocalDate startDate,
            @NotNull LocalDate endDate,
            @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal monthlyRent,
            @Min(value = 1, message = "Dia de 1 a 28") @Max(value = 28, message = "Dia de 1 a 28") short dueDay,
            @NotNull AdjustmentIndex adjustmentIndex,
            @DecimalMin("0.00") @Digits(integer = 4, fraction = 2) BigDecimal adjustmentPercent,
            @NotNull GuaranteeType guaranteeType,
            @DecimalMin("0.00") @Digits(integer = 12, fraction = 2) BigDecimal guaranteeValue,
            @Size(max = 500) String guaranteeNotes,
            @Size(max = 2000) String notes,
            Long version) {}

    public record AdjustRequest(
            @NotNull @DecimalMin("-99.99") @DecimalMax("999.99") @Digits(integer = 3, fraction = 2) BigDecimal percent,
            @NotNull LocalDate effectiveDate) {}

    public record TerminateRequest(@NotNull LocalDate date, @NotBlank @Size(max = 500) String reason) {}

    public record ContractListItem(UUID id, String code, UUID propertyId, String propertyCode, String propertyTitle,
            UUID tenantId, String tenantName, BigDecimal monthlyRent, LocalDate startDate, LocalDate endDate,
            Status status, Situation situation) {}

    public record PropertyRef(UUID id, String code, String title, String address, String coverUrl) {}

    public record ContractRef(UUID id, String code) {}

    public record PaymentRequest(
            @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal amount,
            @NotNull LocalDate paidOn,
            @NotNull Payment.Method method,
            @Size(max = 500) String notes) {}

    public record ReverseRequest(@NotBlank @Size(max = 500) String reason) {}

    public record PaymentResponse(UUID id, UUID installmentId, BigDecimal amount, LocalDate paidOn,
            Payment.Method method, String notes, String userName, Instant createdAt, Instant reversedAt,
            String reversalReason) {}

    /** paidOn: data do último pagamento válido. payments inclui os estornados, para o histórico da parcela. */
    public record InstallmentResponse(UUID id, int number, LocalDate referenceMonth, LocalDate dueDate,
            BigDecimal amount, BigDecimal paid, BigDecimal balance, LocalDate paidOn,
            RentInstallment.Situation status, List<PaymentResponse> payments) {}

    public record AdjustmentResponse(UUID id, BigDecimal percent, LocalDate effectiveDate, BigDecimal oldRent,
            BigDecimal newRent, Instant createdAt) {}

    /** Resumo financeiro calculado aqui: o frontend só mostra. */
    public record Summary(BigDecimal total, BigDecimal received, BigDecimal open, BigDecimal overdue,
            BigDecimal progressPercent) {}

    public record ContractResponse(UUID id, String code, Status status, Situation situation, PropertyRef property,
            OwnerSummary owner, TenantSummary tenant, LocalDate startDate, LocalDate endDate, BigDecimal monthlyRent,
            short dueDay, AdjustmentIndex adjustmentIndex, BigDecimal adjustmentPercent, GuaranteeType guaranteeType,
            BigDecimal guaranteeValue, String guaranteeNotes, String notes, ContractRef previousContract,
            ContractRef renewal, LocalDate endedAt, String endReason, List<InstallmentResponse> installments,
            List<AdjustmentResponse> adjustments, Summary summary, Instant createdAt, Long version) {}

    public record Stats(long total, long active, long renewing, long ending, long ended) {}

    public record HistoryEntry(String action, Instant at, String userName, Map<String, Object> before,
            Map<String, Object> after) {}
}
