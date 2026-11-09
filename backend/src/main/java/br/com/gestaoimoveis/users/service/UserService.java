package br.com.gestaoimoveis.users.service;

import br.com.gestaoimoveis.shared.security.Emails;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.gestaoimoveis.shared.error.BusinessException;
import br.com.gestaoimoveis.shared.error.NotFoundException;
import br.com.gestaoimoveis.shared.security.CurrentUser;
import br.com.gestaoimoveis.shared.security.Role;
import br.com.gestaoimoveis.shared.tenancy.TenantSession;
import br.com.gestaoimoveis.users.api.UserDtos.CreateUserRequest;
import br.com.gestaoimoveis.users.api.UserDtos.UpdateUserRequest;
import br.com.gestaoimoveis.users.api.UserDtos.UserResponse;
import br.com.gestaoimoveis.users.domain.AppUser;
import br.com.gestaoimoveis.users.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final TenantSession tenantSession;
    private final FindByIndexNameSessionRepository<? extends Session> sessions;

    UserService(UserRepository repository, PasswordEncoder passwordEncoder, TenantSession tenantSession,
            FindByIndexNameSessionRepository<? extends Session> sessions) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.tenantSession = tenantSession;
        this.sessions = sessions;
    }

    /** Busca para o login: única leitura de usuário fora de uma organização (política RLS login_lookup). */
    @Transactional(readOnly = true)
    public Optional<AppUser> findForLogin(String email) {
        tenantSession.setLoginEmail(email);
        return repository.findByEmail(Emails.normalize(email));
    }

    /** Cria o primeiro ADMIN junto com a organização (a transação já está na organização nova). */
    @Transactional
    public AppUser createAdmin(UUID organizationId, String name, String email, String password) {
        return save(new AppUser(organizationId, email, passwordEncoder.encode(password), name, Role.ADMIN));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return repository.findByOrganizationIdOrderByName(CurrentUser.get().organizationId()).stream()
                .map(UserResponse::of).toList();
    }

    @Transactional
    public UserResponse create(CreateUserRequest req) {
        requireInternalRole(req.role());
        AppUser user = new AppUser(CurrentUser.get().organizationId(), req.email(),
                passwordEncoder.encode(req.password()), req.name(), req.role());
        return UserResponse.of(save(user));
    }

    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest req) {
        requireInternalRole(req.role());
        AppUser user = load(id);
        if (user.getId().equals(CurrentUser.get().userId()) && req.role() != Role.ADMIN) {
            throw BusinessException.conflict("Você não pode remover o próprio perfil de administrador.");
        }
        user.update(req.name(), req.role());
        return UserResponse.of(user);
    }

    @Transactional
    public void deactivate(UUID id) {
        AppUser user = load(id);
        if (user.getId().equals(CurrentUser.get().userId())) {
            throw BusinessException.conflict("Você não pode desativar o próprio usuário.");
        }
        user.deactivate();
    }

    /**
     * Derruba todas as sessões abertas do usuário. Chamar depois do commit e fora de transação:
     * o Spring Session usa outro gerenciador de transação e, dentro da transação JPA, comitaria a
     * conexão dela antes da hora (perdendo o app.org_id).
     */
    public void revokeSessions(UUID userId) {
        sessions.findByPrincipalName(userId.toString()).keySet().forEach(sessions::deleteById);
    }

    private AppUser load(UUID id) {
        return repository.findByIdAndOrganizationId(id, CurrentUser.get().organizationId())
                .orElseThrow(() -> new NotFoundException("Usuário"));
    }

    private AppUser save(AppUser user) {
        try {
            return repository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw BusinessException.conflict("Este e-mail já está cadastrado.");
        }
    }

    // portais de proprietário e inquilino ganham usuários junto com seus cadastros (fases 3 e 6)
    private static void requireInternalRole(Role role) {
        if (role != Role.ADMIN && role != Role.STAFF) {
            throw BusinessException.badRequest("Perfil inválido para usuário interno.");
        }
    }
}
