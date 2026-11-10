package br.com.gestaoimoveis.audit.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.gestaoimoveis.audit.domain.AuditEvent;

public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {

    List<AuditEvent> findByOrganizationIdAndEntityAndEntityIdOrderByOccurredAtDesc(UUID organizationId, String entity,
            UUID entityId);
}
