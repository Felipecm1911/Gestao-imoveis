package br.com.gestaoimoveis.contracts.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.gestaoimoveis.audit.service.AuditService;
import br.com.gestaoimoveis.contracts.api.ContractDtos.AdjustRequest;
import br.com.gestaoimoveis.contracts.api.ContractDtos.AdjustmentResponse;
import br.com.gestaoimoveis.contracts.api.ContractDtos.ContractListItem;
import br.com.gestaoimoveis.contracts.api.ContractDtos.ContractRef;
import br.com.gestaoimoveis.contracts.api.ContractDtos.ContractRequest;
import br.com.gestaoimoveis.contracts.api.ContractDtos.ContractResponse;
import br.com.gestaoimoveis.contracts.api.ContractDtos.HistoryEntry;
import br.com.gestaoimoveis.contracts.api.ContractDtos.InstallmentResponse;
import br.com.gestaoimoveis.contracts.api.ContractDtos.PaymentResponse;
import br.com.gestaoimoveis.contracts.api.ContractDtos.PropertyRef;
import br.com.gestaoimoveis.contracts.api.ContractDtos.Stats;
import br.com.gestaoimoveis.contracts.api.ContractDtos.Summary;
import br.com.gestaoimoveis.contracts.api.ContractDtos.TerminateRequest;
import br.com.gestaoimoveis.contracts.domain.ContractAdjustment;
import br.com.gestaoimoveis.contracts.domain.InstallmentPlan;
import br.com.gestaoimoveis.contracts.domain.Payment;
import br.com.gestaoimoveis.contracts.domain.RentInstallment;
import br.com.gestaoimoveis.contracts.domain.RentalContract;
import br.com.gestaoimoveis.contracts.domain.RentalContract.AdjustmentIndex;
import br.com.gestaoimoveis.contracts.domain.RentalContract.Extras;
import br.com.gestaoimoveis.contracts.domain.RentalContract.Situation;
import br.com.gestaoimoveis.contracts.domain.RentalContract.Status;
import br.com.gestaoimoveis.contracts.domain.RentalContract.Terms;
import br.com.gestaoimoveis.contracts.repository.ContractAdjustmentRepository;
import br.com.gestaoimoveis.contracts.repository.PaymentRepository;
import br.com.gestaoimoveis.contracts.repository.RentInstallmentRepository;
import br.com.gestaoimoveis.contracts.repository.RentalContractRepository;
import br.com.gestaoimoveis.contracts.repository.RentalContractRepository.Filter;
import br.com.gestaoimoveis.organizations.service.OrganizationService;
import br.com.gestaoimoveis.owners.service.OwnerService;
import br.com.gestaoimoveis.properties.api.PropertyDtos.PhotoResponse;
import br.com.gestaoimoveis.properties.api.PropertyDtos.PropertyResponse;
import br.com.gestaoimoveis.properties.api.PropertyDtos.PropertySummary;
import br.com.gestaoimoveis.properties.domain.Property;
import br.com.gestaoimoveis.properties.service.PropertyService;
import br.com.gestaoimoveis.shared.error.BusinessException;
import br.com.gestaoimoveis.shared.error.NotFoundException;
import br.com.gestaoimoveis.shared.money.Money;
import br.com.gestaoimoveis.shared.security.CurrentUser;
import br.com.gestaoimoveis.shared.web.PageResponse;
import br.com.gestaoimoveis.shared.web.Versions;
import br.com.gestaoimoveis.tenants.service.TenantService;
import br.com.gestaoimoveis.users.api.UserDtos.UserResponse;
import br.com.gestaoimoveis.users.service.UserService;

@Service
public class ContractService {

    /** "Hoje" para vencimentos e prazos: o do Brasil, não o do servidor. */
    static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private static final String ENTITY = "rental_contract";
    private static final String OVERLAP = "Este imóvel já tem contrato ativo neste período.";

    private final RentalContractRepository contracts;
    private final RentInstallmentRepository installments;
    private final ContractAdjustmentRepository adjustments;
    private final PaymentRepository payments;
    private final PropertyService properties;
    private final OwnerService owners;
    private final TenantService tenants;
    private final UserService users;
    private final OrganizationService organizations;
    private final AuditService audit;

    ContractService(RentalContractRepository contracts, RentInstallmentRepository installments,
            ContractAdjustmentRepository adjustments, PaymentRepository payments, PropertyService properties,
            OwnerService owners,
            TenantService tenants, UserService users, OrganizationService organizations, AuditService audit) {
        this.contracts = contracts;
        this.installments = installments;
        this.adjustments = adjustments;
        this.payments = payments;
        this.properties = properties;
        this.owners = owners;
        this.tenants = tenants;
        this.users = users;
        this.organizations = organizations;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public PageResponse<ContractListItem> search(Filter filter, Pageable pageable) {
        LocalDate today = today();
        Page<RentalContract> page = contracts.findAll(RentalContractRepository.matching(org(), filter, today), pageable);
        Map<UUID, String> tenantNames = tenants.namesById(page.map(RentalContract::getTenantId).toSet());
        Map<UUID, PropertySummary> props = properties.summariesById(page.map(RentalContract::getPropertyId).toSet());
        Set<UUID> renewing = contracts.renewedIds(page.map(RentalContract::getId).getContent(), Status.RASCUNHO);
        return PageResponse.of(page, c -> {
            PropertySummary p = props.get(c.getPropertyId());
            return new ContractListItem(c.getId(), c.code(), p.id(), p.code(), p.title(), c.getTenantId(),
                    tenantNames.get(c.getTenantId()), c.getMonthlyRent(), c.getStartDate(), c.getEndDate(),
                    c.getStatus(), c.situation(renewing.contains(c.getId()), today));
        });
    }

    @Transactional(readOnly = true)
    public Stats stats() {
        return new Stats(count(null), count(Situation.ATIVO), count(Situation.EM_RENOVACAO),
                count(Situation.ENCERRANDO), count(Situation.ENCERRADO));
    }

    @Transactional(readOnly = true)
    public ContractResponse get(UUID id) {
        return toResponse(load(id));
    }

    @Transactional
    public ContractResponse create(ContractRequest req) {
        RentalContract c = new RentalContract(org(), contracts.nextNumber(org()), null);
        c.changeTerms(terms(req));
        c.changeExtras(extras(req));
        saveNew(c);
        return toResponse(c);
    }

    @Transactional
    public ContractResponse update(UUID id, ContractRequest req) {
        RentalContract c = load(id);
        Versions.check(c.getVersion(), req.version());
        Map<String, Object> before = c.snapshot();
        switch (c.getStatus()) {
            case RASCUNHO -> {
                c.changeTerms(terms(req));
                c.changeExtras(extras(req));
            }
            // em vigor: partes, prazo e valor estão travados; só garantia e observações mudam
            case ATIVO -> c.changeExtras(extras(req));
            default -> throw BusinessException.conflict("Contrato encerrado ou cancelado não pode ser alterado.");
        }
        contracts.saveAndFlush(c);
        audit.record(ENTITY, c.getId(), "ALTERADO", before, c.snapshot());
        return toResponse(c);
    }

    /** RASCUNHO → ATIVO: gera as parcelas e ocupa o imóvel. */
    @Transactional
    public ContractResponse activate(UUID id) {
        RentalContract c = load(id);
        require(c, Status.RASCUNHO, "Só um rascunho pode ser ativado.");
        Map<String, Object> before = c.snapshot();
        properties.occupy(c.getPropertyId()); // trava o imóvel: duas ativações simultâneas passam uma de cada vez
        if (contracts.existsOverlap(org(), c.getPropertyId(), Status.ATIVO, c.getId(), c.getStartDate(), c.getEndDate())) {
            throw BusinessException.conflict(OVERLAP);
        }
        c.activate();
        try {
            contracts.saveAndFlush(c);
        } catch (DataIntegrityViolationException e) {
            throw BusinessException.conflict(OVERLAP); // a restrição do banco pegou o que a checagem não viu
        }
        installments.saveAll(InstallmentPlan.generate(c.getStartDate(), c.getEndDate(), c.getMonthlyRent(), c.getDueDay())
                .stream().map(item -> new RentInstallment(org(), c.getId(), item)).toList());
        audit.record(ENTITY, c.getId(), "ATIVADO", before, c.snapshot());

        // shortcut: contrato vencido não encerra sozinho (não há job); o anterior fecha aqui, quando a renovação entra em vigor, ou pelo botão Encerrar
        if (c.getPreviousContractId() != null) {
            contracts.findByIdAndOrganizationId(c.getPreviousContractId(), org())
                    .filter(prev -> prev.getStatus() == Status.ATIVO)
                    .ifPresent(prev -> {
                        Map<String, Object> prevBefore = prev.snapshot();
                        // as parcelas do anterior continuam valendo: ele foi cumprido até o fim
                        prev.end(prev.getEndDate(), "Renovado pelo contrato " + c.code());
                        audit.record(ENTITY, prev.getId(), "ENCERRADO", prevBefore, prev.snapshot());
                    });
        }
        return toResponse(c);
    }

    /** Reajuste manual: novo aluguel vale para as competências sem pagamento a partir da data de vigência. */
    @Transactional
    public ContractResponse adjust(UUID id, AdjustRequest req) {
        RentalContract c = load(id);
        require(c, Status.ATIVO, "Só contratos ativos podem ser reajustados.");
        if (req.effectiveDate().isBefore(c.getStartDate()) || req.effectiveDate().isAfter(c.getEndDate())) {
            throw BusinessException.badRequest("A data de vigência deve estar dentro do período do contrato.");
        }
        BigDecimal oldRent = c.getMonthlyRent();
        BigDecimal newRent = Money.of(oldRent.multiply(BigDecimal.ONE.add(req.percent().movePointLeft(2))));
        if (newRent.signum() <= 0 || newRent.compareTo(oldRent) == 0) {
            throw BusinessException.badRequest("O percentual informado não altera o aluguel.");
        }
        c.adjustRent(newRent);
        for (RentInstallment i : installments.findByContractIdOrderByReferenceMonth(id)) {
            if (i.isOpen() && i.isUnpaid() && !i.getReferenceMonth().isBefore(req.effectiveDate())) {
                i.changeAmount(InstallmentPlan.amount(newRent, YearMonth.from(i.getReferenceMonth()),
                        c.getStartDate(), c.getEndDate()));
            }
        }
        adjustments.save(new ContractAdjustment(org(), id, req.percent(), req.effectiveDate(), oldRent, newRent,
                CurrentUser.get().userId()));
        Map<String, Object> after = new LinkedHashMap<>();
        after.put("monthlyRent", newRent.toPlainString());
        after.put("percent", req.percent().toPlainString());
        after.put("effectiveDate", req.effectiveDate().toString());
        audit.record(ENTITY, id, "REAJUSTADO", Map.of("monthlyRent", oldRent.toPlainString()), after);
        contracts.flush();
        return toResponse(c);
    }

    /** Cria o rascunho do próximo período, começando no dia seguinte ao fim deste. */
    @Transactional
    public ContractResponse renew(UUID id) {
        RentalContract c = load(id);
        require(c, Status.ATIVO, "Só contratos ativos podem ser renovados.");
        if (renewalOf(id) != null) {
            throw BusinessException.conflict("Este contrato já tem uma renovação.");
        }
        LocalDate start = c.getEndDate().plusDays(1);
        LocalDate end = start.plus(Period.between(c.getStartDate(), start)).minusDays(1);
        RentalContract r = new RentalContract(org(), contracts.nextNumber(org()), c.getId());
        r.changeTerms(new Terms(c.getPropertyId(), c.getOwnerId(), c.getTenantId(), start, end, c.getMonthlyRent(),
                c.getDueDay(), c.getAdjustmentIndex(), c.getAdjustmentPercent()));
        r.changeExtras(new Extras(c.getGuaranteeType(), c.getGuaranteeValue(), c.getGuaranteeNotes(), null));
        saveNew(r);
        audit.record(ENTITY, id, "RENOVADO", null, Map.of("renewal", r.code()));
        return toResponse(r);
    }

    /** Encerra antes do fim: cancela as parcelas sem pagamento que venceriam depois da data. */
    @Transactional
    public ContractResponse terminate(UUID id, TerminateRequest req) {
        RentalContract c = load(id);
        require(c, Status.ATIVO, "Só contratos ativos podem ser encerrados.");
        if (req.date().isBefore(c.getStartDate()) || req.date().isAfter(c.getEndDate())) {
            throw BusinessException.badRequest("A data de encerramento deve estar dentro do período do contrato.");
        }
        Map<String, Object> before = c.snapshot();
        c.end(req.date(), req.reason().trim());
        installments.findByContractIdOrderByReferenceMonth(id).stream()
                .filter(i -> i.isOpen() && i.isUnpaid() && i.getDueDate().isAfter(req.date()))
                .forEach(RentInstallment::cancel);
        contracts.flush();
        if (!contracts.existsByOrganizationIdAndPropertyIdAndStatus(org(), c.getPropertyId(), Status.ATIVO)) {
            properties.release(c.getPropertyId());
        }
        audit.record(ENTITY, id, "ENCERRADO", before, c.snapshot());
        return toResponse(c);
    }

    /** Desiste de um rascunho. */
    @Transactional
    public ContractResponse cancel(UUID id) {
        RentalContract c = load(id);
        require(c, Status.RASCUNHO, "Só um rascunho pode ser cancelado. Para um contrato ativo, use Encerrar.");
        Map<String, Object> before = c.snapshot();
        c.cancel();
        contracts.flush();
        audit.record(ENTITY, id, "CANCELADO", before, c.snapshot());
        return toResponse(c);
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> history(UUID id) {
        load(id);
        Map<UUID, String> names = users.list().stream().collect(Collectors.toMap(UserResponse::id, UserResponse::name));
        return audit.history(ENTITY, id).stream()
                .map(e -> new HistoryEntry(e.action(), e.at(), names.get(e.userId()), e.before(), e.after()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Pdf pdf(UUID id) {
        ContractResponse c = toResponse(load(id));
        return new Pdf("contrato-" + c.code() + ".pdf", ContractPdf.render(c, organizations.current().name()));
    }

    public record Pdf(String filename, byte[] content) {}

    private Terms terms(ContractRequest r) {
        if (!r.endDate().isAfter(r.startDate())) {
            throw BusinessException.badRequest("O fim do contrato deve ser depois do início.");
        }
        PropertyResponse p = properties.get(r.propertyId()); // 404 se o imóvel não for desta organização
        if (p.status() == Property.Status.INATIVO) {
            throw BusinessException.conflict("Imóvel inativo não pode receber contrato.");
        }
        tenants.summary(r.tenantId()); // idem para o inquilino
        boolean fixed = r.adjustmentIndex() == AdjustmentIndex.PERCENTUAL_FIXO;
        if (fixed && r.adjustmentPercent() == null) {
            throw BusinessException.badRequest("Informe o percentual do reajuste fixo.");
        }
        return new Terms(r.propertyId(), p.owner().id(), r.tenantId(), r.startDate(), r.endDate(),
                Money.of(r.monthlyRent()), r.dueDay(), r.adjustmentIndex(), fixed ? r.adjustmentPercent() : null);
    }

    private static Extras extras(ContractRequest r) {
        return new Extras(r.guaranteeType(), Money.of(r.guaranteeValue()), blankToNull(r.guaranteeNotes()),
                blankToNull(r.notes()));
    }

    private void saveNew(RentalContract c) {
        try {
            contracts.saveAndFlush(c);
        } catch (DataIntegrityViolationException e) {
            throw BusinessException.conflict("Outro contrato foi criado ao mesmo tempo. Tente de novo.");
        }
        audit.record(ENTITY, c.getId(), "CRIADO", null, c.snapshot());
    }

    private ContractResponse toResponse(RentalContract c) {
        LocalDate today = today();
        PropertyResponse p = properties.get(c.getPropertyId());
        PropertyRef property = new PropertyRef(p.id(), p.code(), p.title(),
                "%s, %s – %s, %s – %s".formatted(p.street(), p.number(), p.district(), p.city(), p.state()),
                p.photos().stream().filter(PhotoResponse::cover).map(PhotoResponse::url).findFirst().orElse(null));
        RentalContract renewal = renewalOf(c.getId());
        ContractRef previous = c.getPreviousContractId() == null ? null
                : contracts.findByIdAndOrganizationId(c.getPreviousContractId(), org())
                        .map(prev -> new ContractRef(prev.getId(), prev.code())).orElse(null);

        List<RentInstallment> all = installments.findByContractIdOrderByReferenceMonth(c.getId());
        Map<UUID, List<PaymentResponse>> paymentsByInstallment = paymentResponses(
                payments.findByInstallmentIdInOrderByCreatedAt(all.stream().map(RentInstallment::getId).toList()))
                .stream().collect(Collectors.groupingBy(PaymentResponse::installmentId));
        List<InstallmentResponse> rows = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO.setScale(2);
        BigDecimal received = total;
        BigDecimal open = total;
        BigDecimal overdue = total;
        for (RentInstallment i : all) {
            RentInstallment.Situation situation = i.situation(today);
            List<PaymentResponse> paid = paymentsByInstallment.getOrDefault(i.getId(), List.of());
            rows.add(new InstallmentResponse(i.getId(), rows.size() + 1, i.getReferenceMonth(), i.getDueDate(),
                    i.getAmount(), i.getPaidAmount(), i.balance(),
                    paid.stream().filter(payment -> payment.reversedAt() == null).map(PaymentResponse::paidOn)
                            .max(LocalDate::compareTo).orElse(null),
                    situation, paid));
            if (!i.isOpen()) continue; // cancelada não entra no total
            total = total.add(i.getAmount());
            received = received.add(i.getPaidAmount());
            if (situation == RentInstallment.Situation.EM_ATRASO) overdue = overdue.add(i.balance());
            else open = open.add(i.balance());
        }
        BigDecimal progress = total.signum() == 0 ? BigDecimal.ZERO.setScale(1)
                : received.multiply(BigDecimal.valueOf(100)).divide(total, 1, RoundingMode.HALF_EVEN);

        return new ContractResponse(c.getId(), c.code(), c.getStatus(),
                c.situation(renewal != null && renewal.getStatus() == Status.RASCUNHO, today), property,
                owners.summary(c.getOwnerId()), tenants.summary(c.getTenantId()), c.getStartDate(), c.getEndDate(),
                c.getMonthlyRent(), c.getDueDay(), c.getAdjustmentIndex(), c.getAdjustmentPercent(),
                c.getGuaranteeType(), c.getGuaranteeValue(), c.getGuaranteeNotes(), c.getNotes(), previous,
                renewal == null ? null : new ContractRef(renewal.getId(), renewal.code()), c.getEndedAt(),
                c.getEndReason(), rows,
                adjustments.findByContractIdOrderByEffectiveDate(c.getId()).stream()
                        .map(a -> new AdjustmentResponse(a.getId(), a.getPercent(), a.getEffectiveDate(),
                                a.getOldRent(), a.getNewRent(), a.getCreatedAt()))
                        .toList(),
                new Summary(total, received, open, overdue, progress), c.getCreatedAt(), c.getVersion());
    }

    /** Pagamentos como a API os devolve, com o nome de quem registrou. */
    List<PaymentResponse> paymentResponses(List<Payment> list) {
        if (list.isEmpty()) return List.of();
        Map<UUID, String> names = users.list().stream().collect(Collectors.toMap(UserResponse::id, UserResponse::name));
        return list.stream()
                .map(p -> new PaymentResponse(p.getId(), p.getInstallmentId(), p.getAmount(), p.getPaidOn(),
                        p.getMethod(), p.getNotes(), names.get(p.getUserId()), p.getCreatedAt(), p.getReversedAt(),
                        p.getReversalReason()))
                .toList();
    }

    private RentalContract renewalOf(UUID id) {
        return contracts.findFirstByOrganizationIdAndPreviousContractIdAndStatusNot(org(), id, Status.CANCELADO)
                .orElse(null);
    }

    private long count(Situation situation) {
        return contracts.count(RentalContractRepository.matching(org(), new Filter(null, situation, null, null), today()));
    }

    private static void require(RentalContract c, Status expected, String message) {
        if (c.getStatus() != expected) throw BusinessException.conflict(message);
    }

    private RentalContract load(UUID id) {
        return contracts.findByIdAndOrganizationId(id, org()).orElseThrow(() -> new NotFoundException("Contrato"));
    }

    private static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    private static UUID org() {
        return CurrentUser.get().organizationId();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
