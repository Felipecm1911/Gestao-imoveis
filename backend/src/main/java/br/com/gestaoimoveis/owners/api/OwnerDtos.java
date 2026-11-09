package br.com.gestaoimoveis.owners.api;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import br.com.gestaoimoveis.owners.domain.Address;
import br.com.gestaoimoveis.owners.domain.Owner;
import br.com.gestaoimoveis.shared.validation.CpfCnpj;

public final class OwnerDtos {

    private OwnerDtos() {}

    public record OwnerRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @CpfCnpj String document,
            @Email @Size(max = 254) String email,
            @Pattern(regexp = "\\d{10,11}", message = "Telefone com DDD, só números") String phone,
            @Valid Address address,
            @Size(max = 300) String bankInfo,
            Long version) {}

    public record OwnerResponse(UUID id, String name, String document, String email, String phone,
            Address address, String bankInfo, Instant createdAt, Long version) {
        public static OwnerResponse of(Owner o) {
            return new OwnerResponse(o.getId(), o.getName(), o.getDocument(), o.getEmail(), o.getPhone(),
                    o.getAddress(), o.getBankInfo(), o.getCreatedAt(), o.getVersion());
        }
    }

    /** Resumo usado por outros módulos (ex.: imóvel mostra o nome do proprietário). */
    public record OwnerSummary(@NotNull UUID id, String name) {}
}
