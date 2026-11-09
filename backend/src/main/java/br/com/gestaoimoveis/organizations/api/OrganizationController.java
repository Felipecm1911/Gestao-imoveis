package br.com.gestaoimoveis.organizations.api;

import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.gestaoimoveis.organizations.api.OrganizationDtos.OrganizationResponse;
import br.com.gestaoimoveis.organizations.api.OrganizationDtos.UpdateOrganizationRequest;
import br.com.gestaoimoveis.organizations.service.OrganizationService;

@RestController
@RequestMapping("/api/organization")
class OrganizationController {

    private final OrganizationService service;

    OrganizationController(OrganizationService service) {
        this.service = service;
    }

    @GetMapping
    OrganizationResponse get() {
        return service.current();
    }

    @PatchMapping
    @PreAuthorize("hasRole('ADMIN')")
    OrganizationResponse update(@Valid @RequestBody UpdateOrganizationRequest req) {
        return service.rename(req.name());
    }
}
