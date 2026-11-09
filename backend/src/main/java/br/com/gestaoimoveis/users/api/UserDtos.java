package br.com.gestaoimoveis.users.api;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import br.com.gestaoimoveis.shared.security.Role;
import br.com.gestaoimoveis.users.domain.AppUser;

public final class UserDtos {

    private UserDtos() {}

    public record UserResponse(UUID id, String name, String email, Role role, boolean active, Instant createdAt) {
        public static UserResponse of(AppUser u) {
            return new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.isActive(), u.getCreatedAt());
        }
    }

    /** bcrypt usa no máximo 72 bytes da senha; o limite evita senha truncada sem aviso. */
    public record CreateUserRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotNull Role role) {}

    public record UpdateUserRequest(@NotBlank @Size(max = 120) String name, @NotNull Role role) {}
}
