package br.com.gestaoimoveis.owners.api;

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

import br.com.gestaoimoveis.owners.api.OwnerDtos.OwnerRequest;
import br.com.gestaoimoveis.owners.api.OwnerDtos.OwnerResponse;
import br.com.gestaoimoveis.owners.service.OwnerService;
import br.com.gestaoimoveis.shared.web.PageResponse;

@RestController
@RequestMapping("/api/owners")
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
class OwnerController {

    private final OwnerService service;

    OwnerController(OwnerService service) {
        this.service = service;
    }

    @GetMapping
    PageResponse<OwnerResponse> list(@RequestParam(required = false) String q,
            @PageableDefault(sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.search(q, pageable);
    }

    @GetMapping("/{id}")
    OwnerResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    OwnerResponse create(@Valid @RequestBody OwnerRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    OwnerResponse update(@PathVariable UUID id, @Valid @RequestBody OwnerRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
