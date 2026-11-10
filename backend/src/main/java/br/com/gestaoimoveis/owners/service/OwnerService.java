package br.com.gestaoimoveis.owners.service;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.gestaoimoveis.owners.api.OwnerDtos.OwnerRequest;
import br.com.gestaoimoveis.owners.api.OwnerDtos.OwnerResponse;
import br.com.gestaoimoveis.owners.api.OwnerDtos.OwnerSummary;
import br.com.gestaoimoveis.owners.domain.Owner;
import br.com.gestaoimoveis.owners.repository.OwnerRepository;
import br.com.gestaoimoveis.shared.error.BusinessException;
import br.com.gestaoimoveis.shared.error.NotFoundException;
import br.com.gestaoimoveis.shared.security.CurrentUser;
import br.com.gestaoimoveis.shared.web.Like;
import br.com.gestaoimoveis.shared.web.PageResponse;
import br.com.gestaoimoveis.shared.web.Versions;

@Service
public class OwnerService {

    private final OwnerRepository repository;

    OwnerService(OwnerRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<OwnerResponse> search(String q, Pageable pageable) {
        return PageResponse.of(repository.search(org(), Like.contains(q), pageable), OwnerResponse::of);
    }

    @Transactional(readOnly = true)
    public OwnerResponse get(UUID id) {
        return OwnerResponse.of(load(id));
    }

    @Transactional
    public OwnerResponse create(OwnerRequest req) {
        Owner owner = new Owner(org());
        apply(owner, req);
        return OwnerResponse.of(save(owner));
    }

    @Transactional
    public OwnerResponse update(UUID id, OwnerRequest req) {
        Owner owner = load(id);
        Versions.check(owner.getVersion(), req.version());
        apply(owner, req);
        return OwnerResponse.of(save(owner));
    }

    @Transactional
    public void delete(UUID id) {
        Owner owner = load(id);
        try {
            repository.delete(owner);
            repository.flush();
        } catch (DataIntegrityViolationException e) {
            throw BusinessException.conflict("Este proprietário tem imóveis cadastrados e não pode ser excluído.");
        }
    }

    /** Usado pelo módulo de imóveis: garante que o proprietário existe nesta organização. */
    @Transactional(readOnly = true)
    public OwnerSummary summary(UUID id) {
        Owner o = load(id);
        return new OwnerSummary(o.getId(), o.getName());
    }

    @Transactional(readOnly = true)
    public Map<UUID, String> namesById(Collection<UUID> ids) {
        return repository.findAllById(ids).stream()
                .collect(Collectors.toMap(Owner::getId, Owner::getName));
    }

    private static void apply(Owner owner, OwnerRequest req) {
        owner.update(req.name(), req.document().replaceAll("\\D", ""), blankToNull(req.email()),
                blankToNull(req.phone()), req.address(), blankToNull(req.bankInfo()));
    }

    private Owner save(Owner owner) {
        try {
            return repository.saveAndFlush(owner);
        } catch (DataIntegrityViolationException e) {
            throw BusinessException.conflict("Já existe um proprietário com este CPF/CNPJ.");
        }
    }

    private Owner load(UUID id) {
        return repository.findByIdAndOrganizationId(id, org()).orElseThrow(() -> new NotFoundException("Proprietário"));
    }

    private static UUID org() {
        return CurrentUser.get().organizationId();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
