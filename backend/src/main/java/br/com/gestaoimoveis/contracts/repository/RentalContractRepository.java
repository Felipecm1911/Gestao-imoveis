package br.com.gestaoimoveis.contracts.repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import br.com.gestaoimoveis.contracts.domain.RentalContract;
import br.com.gestaoimoveis.contracts.domain.RentalContract.Situation;
import br.com.gestaoimoveis.contracts.domain.RentalContract.Status;
import br.com.gestaoimoveis.properties.domain.Property;
import br.com.gestaoimoveis.shared.web.Like;
import br.com.gestaoimoveis.tenants.domain.Tenant;

public interface RentalContractRepository
        extends JpaRepository<RentalContract, UUID>, JpaSpecificationExecutor<RentalContract> {

    Optional<RentalContract> findByIdAndOrganizationId(UUID id, UUID organizationId);

    // shortcut: max+1 na transação; duas criações simultâneas batem no UNIQUE e uma recebe 409. Trocar por sequência por organização se virar gargalo
    @Query("select coalesce(max(c.number), 0) + 1 from RentalContract c where c.organizationId = ?1")
    int nextNumber(UUID organizationId);

    @Query("""
            select count(c) > 0 from RentalContract c
            where c.organizationId = ?1 and c.propertyId = ?2 and c.status = ?3 and c.id <> ?4
            and c.startDate <= ?6 and c.endDate >= ?5
            """)
    boolean existsOverlap(UUID organizationId, UUID propertyId, Status status, UUID selfId, LocalDate start,
            LocalDate end);

    boolean existsByOrganizationIdAndPropertyIdAndStatus(UUID organizationId, UUID propertyId, Status status);

    /** A renovação de um contrato (a não cancelada). */
    Optional<RentalContract> findFirstByOrganizationIdAndPreviousContractIdAndStatusNot(UUID organizationId,
            UUID previousContractId, Status status);

    /** Dos contratos informados, quais têm uma renovação no status dado. */
    @Query("select c.previousContractId from RentalContract c where c.previousContractId in ?1 and c.status = ?2")
    Set<UUID> renewedIds(Collection<UUID> ids, Status renewalStatus);

    record Filter(String q, Situation situation, UUID propertyId, UUID tenantId) {}

    static Specification<RentalContract> matching(UUID organizationId, Filter f, LocalDate today) {
        return (root, query, cb) -> {
            Predicate p = cb.equal(root.get("organizationId"), organizationId);
            if (f.propertyId() != null) p = cb.and(p, cb.equal(root.get("propertyId"), f.propertyId()));
            if (f.tenantId() != null) p = cb.and(p, cb.equal(root.get("tenantId"), f.tenantId()));

            if (f.q() != null && !f.q().isBlank()) {
                String like = Like.contains(f.q());
                // nomes moram em outros módulos: a busca desce por subconsulta em vez de duplicar o nome aqui
                Subquery<UUID> tenants = query.subquery(UUID.class);
                var t = tenants.from(Tenant.class);
                tenants.select(t.get("id")).where(cb.equal(t.get("organizationId"), organizationId),
                        cb.like(cb.lower(t.get("name")), like, '\\'));
                Subquery<UUID> properties = query.subquery(UUID.class);
                var pr = properties.from(Property.class);
                properties.select(pr.get("id")).where(cb.equal(pr.get("organizationId"), organizationId),
                        cb.or(cb.like(cb.lower(pr.get("title")), like, '\\'),
                                cb.like(cb.lower(pr.get("code")), like, '\\')));
                Predicate match = cb.or(root.get("tenantId").in(tenants), root.get("propertyId").in(properties));
                // "CT-0048" ou "48" → número do contrato
                String digits = f.q().replaceAll("\\D", "");
                if (!digits.isEmpty() && digits.length() <= 9) {
                    match = cb.or(match, cb.equal(root.get("number"), Integer.parseInt(digits)));
                }
                p = cb.and(p, match);
            }

            if (f.situation() != null) {
                Subquery<UUID> renewals = query.subquery(UUID.class);
                var r = renewals.from(RentalContract.class);
                renewals.select(r.get("previousContractId")).where(cb.equal(r.get("status"), Status.RASCUNHO),
                        cb.isNotNull(r.get("previousContractId")));
                Predicate active = cb.equal(root.get("status"), Status.ATIVO);
                p = cb.and(p, switch (f.situation()) {
                    // "Ativos" inclui os que estão em renovação ou encerrando: continuam em vigor
                    case ATIVO -> active;
                    case EM_RENOVACAO -> cb.and(active, root.get("id").in(renewals));
                    case ENCERRANDO -> cb.and(active, cb.not(root.get("id").in(renewals)),
                            cb.lessThanOrEqualTo(root.get("endDate"), today.plusDays(RentalContract.ENDING_DAYS)));
                    default -> cb.equal(root.get("status"), Status.valueOf(f.situation().name()));
                });
            }
            return p;
        };
    }
}
