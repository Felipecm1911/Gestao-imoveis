package br.com.gestaoimoveis.tenants.api;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import br.com.gestaoimoveis.owners.domain.Address;
import br.com.gestaoimoveis.tenants.domain.Tenant;
import br.com.gestaoimoveis.shared.validation.CpfCnpj;

public final class TenantDtos {

    private TenantDtos() {}

    public record TenantRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @CpfCnpj String document,
            @Email @Size(max = 254) String email,
            @Pattern(regexp = "\\d{10,11}", message = "Telefone com DDD, só números") String phone,
            @Valid Address address,
            Long version) {}

    public record TenantResponse(UUID id, String name, String document, String email, String phone,
            Address address, Instant createdAt, Long version) {
        public static TenantResponse of(Tenant o) {
            return new TenantResponse(o.getId(), o.getName(), o.getDocument(), o.getEmail(), o.getPhone(),
                    o.getAddress(), o.getCreatedAt(), o.getVersion());
        }
    }

    /** Resumo usado por outros módulos (ex.: contrato mostra o inquilino). */
    public record TenantSummary(UUID id, String name, String document) {}
}
