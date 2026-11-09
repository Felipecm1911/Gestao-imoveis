package br.com.gestaoimoveis.properties.repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import br.com.gestaoimoveis.properties.domain.Property;

public interface PropertyRepository extends JpaRepository<Property, UUID>, JpaSpecificationExecutor<Property> {

    Optional<Property> findByIdAndOrganizationId(UUID id, UUID organizationId);

    record Filter(String q, String city, Property.Type type, Property.Status status, BigDecimal minRent,
            BigDecimal maxRent, UUID ownerId) {}

    static Specification<Property> matching(UUID organizationId, Filter f) {
        return (root, query, cb) -> {
            var p = cb.equal(root.get("organizationId"), organizationId);
            if (f.q() != null && !f.q().isBlank()) {
                String like = "%" + f.q().trim().toLowerCase() + "%";
                p = cb.and(p, cb.or(cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("code")), like),
                        cb.like(cb.lower(root.get("district")), like),
                        cb.like(cb.lower(root.get("street")), like)));
            }
            if (f.city() != null && !f.city().isBlank()) {
                p = cb.and(p, cb.equal(cb.lower(root.get("city")), f.city().trim().toLowerCase()));
            }
            if (f.type() != null) p = cb.and(p, cb.equal(root.get("type"), f.type()));
            if (f.status() != null) p = cb.and(p, cb.equal(root.get("status"), f.status()));
            if (f.minRent() != null) p = cb.and(p, cb.ge(root.get("suggestedRent"), f.minRent()));
            if (f.maxRent() != null) p = cb.and(p, cb.le(root.get("suggestedRent"), f.maxRent()));
            if (f.ownerId() != null) p = cb.and(p, cb.equal(root.get("ownerId"), f.ownerId()));
            return p;
        };
    }
}
