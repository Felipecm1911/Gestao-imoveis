package br.com.gestaoimoveis.organizations.api;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import br.com.gestaoimoveis.organizations.domain.Organization;

public final class OrganizationDtos {

    private OrganizationDtos() {}

    public record OrganizationResponse(UUID id, String name, String slug, String plan) {
        public static OrganizationResponse of(Organization o) {
            return new OrganizationResponse(o.getId(), o.getName(), o.getSlug(), o.getPlan());
        }
    }

    public record UpdateOrganizationRequest(@NotBlank @Size(max = 120) String name) {}
}
