package br.com.gestaoimoveis.organizations.service;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.HexFormat;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import br.com.gestaoimoveis.organizations.api.OrganizationDtos.OrganizationResponse;
import br.com.gestaoimoveis.organizations.domain.Organization;
import br.com.gestaoimoveis.organizations.repository.OrganizationRepository;
import br.com.gestaoimoveis.shared.error.NotFoundException;
import br.com.gestaoimoveis.shared.security.CurrentUser;
import br.com.gestaoimoveis.shared.tenancy.TenantSession;

@Service
public class OrganizationService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OrganizationRepository repository;
    private final TenantSession tenantSession;

    OrganizationService(OrganizationRepository repository, TenantSession tenantSession) {
        this.repository = repository;
        this.tenantSession = tenantSession;
    }

    /** Cria a organização e passa a transação atual para ela (usado só no cadastro). */
    @Transactional(propagation = Propagation.MANDATORY)
    public UUID create(String name) {
        UUID id = UUID.randomUUID();
        tenantSession.setOrganization(id);
        repository.save(new Organization(id, name.trim(), slug(name)));
        return id;
    }

    @Transactional(readOnly = true)
    public OrganizationResponse current() {
        return OrganizationResponse.of(load());
    }

    @Transactional
    public OrganizationResponse rename(String name) {
        Organization org = load();
        org.rename(name.trim());
        return OrganizationResponse.of(org);
    }

    private Organization load() {
        return repository.findById(CurrentUser.get().organizationId())
                .orElseThrow(() -> new NotFoundException("Organização"));
    }

    // sufixo aleatório: o RLS esconde as outras organizações, então não dá para checar colisão antes
    static String slug(String name) {
        String base = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase()
                .replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        if (base.length() > 40) base = base.substring(0, 40);
        byte[] b = new byte[3];
        RANDOM.nextBytes(b);
        return (base.isEmpty() ? "org" : base) + "-" + HexFormat.of().formatHex(b);
    }
}
