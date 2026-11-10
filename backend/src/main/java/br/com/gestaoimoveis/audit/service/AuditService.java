package br.com.gestaoimoveis.audit.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import br.com.gestaoimoveis.audit.domain.AuditEvent;
import br.com.gestaoimoveis.audit.repository.AuditEventRepository;
import br.com.gestaoimoveis.shared.security.CurrentUser;

@Service
public class AuditService {

    /** Evento como os outros módulos o leem (quem, o quê, quando, antes e depois). */
    public record AuditEntry(String action, Instant at, UUID userId, Map<String, Object> before,
            Map<String, Object> after) {}

    private final AuditEventRepository repository;

    AuditService(AuditEventRepository repository) {
        this.repository = repository;
    }

    /** Grava na mesma transação da mudança: se a mudança desfaz, o evento também. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void record(String entity, UUID entityId, String action, Map<String, Object> before,
            Map<String, Object> after) {
        CurrentUser user = CurrentUser.get();
        repository.save(new AuditEvent(user.organizationId(), user.userId(), entity, entityId, action, before, after));
    }

    @Transactional(readOnly = true)
    public List<AuditEntry> history(String entity, UUID entityId) {
        return repository.findByOrganizationIdAndEntityAndEntityIdOrderByOccurredAtDesc(
                        CurrentUser.get().organizationId(), entity, entityId).stream()
                .map(e -> new AuditEntry(e.getAction(), e.getOccurredAt(), e.getUserId(), e.getBefore(), e.getAfter()))
                .toList();
    }
}
