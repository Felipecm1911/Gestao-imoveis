package br.com.gestaoimoveis.auth.api;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import br.com.gestaoimoveis.shared.security.Role;

public final class AuthDtos {

    private AuthDtos() {}

    public record SignupRequest(
            @NotBlank @Size(max = 120) String organizationName,
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 8, max = 72) String password) {}

    public record LoginRequest(@NotBlank @Size(max = 254) String email, @NotBlank @Size(max = 72) String password) {}

    public record MeResponse(UUID id, String name, String email, Role role, UUID organizationId, String organizationName) {}

    public record CsrfResponse(String headerName, String token) {}
}
