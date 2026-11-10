package br.com.gestaoimoveis.tenants.api;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.gestaoimoveis.tenants.api.TenantDtos.TenantRequest;
import br.com.gestaoimoveis.tenants.api.TenantDtos.TenantResponse;
import br.com.gestaoimoveis.tenants.service.TenantService;
import br.com.gestaoimoveis.shared.web.PageResponse;

@RestController
@RequestMapping("/api/tenants")
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
class TenantController {

    private final TenantService service;

    TenantController(TenantService service) {
        this.service = service;
    }

    @GetMapping
    PageResponse<TenantResponse> list(@RequestParam(required = false) String q,
            @PageableDefault(sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.search(q, pageable);
    }

    @GetMapping("/{id}")
    TenantResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    TenantResponse create(@Valid @RequestBody TenantRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    TenantResponse update(@PathVariable UUID id, @Valid @RequestBody TenantRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
