package br.com.gestaoimoveis.auth.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.gestaoimoveis.auth.api.AuthDtos.CsrfResponse;
import br.com.gestaoimoveis.auth.api.AuthDtos.LoginRequest;
import br.com.gestaoimoveis.auth.api.AuthDtos.MeResponse;
import br.com.gestaoimoveis.auth.api.AuthDtos.SignupRequest;
import br.com.gestaoimoveis.auth.service.AuthService;
import br.com.gestaoimoveis.organizations.service.OrganizationService;
import br.com.gestaoimoveis.shared.security.CurrentUser;

@RestController
@RequestMapping("/api/auth")
class AuthController {

    private final AuthService auth;
    private final OrganizationService organizations;
    private final SecurityContextRepository contextRepository;

    AuthController(AuthService auth, OrganizationService organizations, SecurityContextRepository contextRepository) {
        this.auth = auth;
        this.organizations = organizations;
        this.contextRepository = contextRepository;
    }

    /** Força a criação do cookie XSRF-TOKEN antes do primeiro POST. */
    @GetMapping("/csrf")
    CsrfResponse csrf(CsrfToken token) {
        return new CsrfResponse(token.getHeaderName(), token.getToken());
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    MeResponse signup(@Valid @RequestBody SignupRequest req, HttpServletRequest request, HttpServletResponse response) {
        return startSession(auth.signup(req), request, response);
    }

    @PostMapping("/login")
    MeResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest request, HttpServletResponse response) {
        return startSession(auth.login(req.email(), req.password(), request.getRemoteAddr()), request, response);
    }

    @GetMapping("/me")
    MeResponse me() {
        CurrentUser u = CurrentUser.get();
        return new MeResponse(u.userId(), u.name(), u.email(), u.role(), u.organizationId(),
                organizations.current().name());
    }

    private MeResponse startSession(CurrentUser user, HttpServletRequest request, HttpServletResponse response) {
        if (request.getSession(false) != null) {
            request.changeSessionId(); // evita fixação de sessão
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(user.toAuthentication());
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);
        return me();
    }
}
