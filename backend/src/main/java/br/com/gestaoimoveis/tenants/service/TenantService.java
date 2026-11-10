package br.com.gestaoimoveis.tenants.service;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.gestaoimoveis.tenants.api.TenantDtos.TenantRequest;
import br.com.gestaoimoveis.tenants.api.TenantDtos.TenantResponse;
import br.com.gestaoimoveis.tenants.api.TenantDtos.TenantSummary;
import br.com.gestaoimoveis.tenants.domain.Tenant;
import br.com.gestaoimoveis.tenants.repository.TenantRepository;
import br.com.gestaoimoveis.shared.error.BusinessException;
import br.com.gestaoimoveis.shared.error.NotFoundException;
import br.com.gestaoimoveis.shared.security.CurrentUser;
import br.com.gestaoimoveis.shared.web.Like;
import br.com.gestaoimoveis.shared.web.PageResponse;
import br.com.gestaoimoveis.shared.web.Versions;

@Service
public class TenantService {

    private final TenantRepository repository;

    TenantService(TenantRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<TenantResponse> search(String q, Pageable pageable) {
        return PageResponse.of(repository.search(org(), Like.contains(q), pageable), TenantResponse::of);
    }

    @Transactional(readOnly = true)
    public TenantResponse get(UUID id) {
        return TenantResponse.of(load(id));
    }

    @Transactional
    public TenantResponse create(TenantRequest req) {
        Tenant tenant = new Tenant(org());
        apply(tenant, req);
        return TenantResponse.of(save(tenant));
    }

    @Transactional
    public TenantResponse update(UUID id, TenantRequest req) {
        Tenant tenant = load(id);
        Versions.check(tenant.getVersion(), req.version());
        apply(tenant, req);
        return TenantResponse.of(save(tenant));
    }

    @Transactional
    public void delete(UUID id) {
        Tenant tenant = load(id);
        try {
            repository.delete(tenant);
            repository.flush();
        } catch (DataIntegrityViolationException e) {
            throw BusinessException.conflict("Este inquilino tem contratos e não pode ser excluído.");
        }
    }

    /** Usado pelo módulo de contratos: garante que o inquilino existe nesta organização. */
    @Transactional(readOnly = true)
    public TenantSummary summary(UUID id) {
        Tenant o = load(id);
        return new TenantSummary(o.getId(), o.getName(), o.getDocument());
    }

    @Transactional(readOnly = true)
    public Map<UUID, String> namesById(Collection<UUID> ids) {
        return repository.findAllById(ids).stream()
                .collect(Collectors.toMap(Tenant::getId, Tenant::getName));
    }

    private static void apply(Tenant tenant, TenantRequest req) {
        tenant.update(req.name(), req.document().replaceAll("\\D", ""), blankToNull(req.email()),
                blankToNull(req.phone()), req.address());
    }

    private Tenant save(Tenant tenant) {
        try {
            return repository.saveAndFlush(tenant);
        } catch (DataIntegrityViolationException e) {
            throw BusinessException.conflict("Já existe um inquilino com este CPF/CNPJ.");
        }
    }

    private Tenant load(UUID id) {
        return repository.findByIdAndOrganizationId(id, org()).orElseThrow(() -> new NotFoundException("Inquilino"));
    }

    private static UUID org() {
        return CurrentUser.get().organizationId();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
