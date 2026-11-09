package br.com.gestaoimoveis.shared.security;

import java.io.Serializable;
import java.security.Principal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Usuário logado, guardado na sessão. É a única fonte do organizationId.
 * getName() devolve o id do usuário: o Spring Session indexa as sessões por ele,
 * o que permite derrubar todas as sessões de um usuário desativado.
 */
public record CurrentUser(UUID userId, UUID organizationId, String email, String name, Role role, UUID ownerId)
        implements Principal, Serializable {

    @Override
    public String getName() {
        return userId.toString();
    }

    public Authentication toAuthentication() {
        return UsernamePasswordAuthenticationToken.authenticated(this, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role.name())));
    }

    /** Usuário da requisição atual; falha se não houver (as rotas de negócio exigem login). */
    public static CurrentUser get() {
        return find().orElseThrow(() -> new IllegalStateException("Sem usuário autenticado"));
    }

    public static Optional<CurrentUser> find() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof CurrentUser u ? Optional.of(u) : Optional.empty();
    }
}
