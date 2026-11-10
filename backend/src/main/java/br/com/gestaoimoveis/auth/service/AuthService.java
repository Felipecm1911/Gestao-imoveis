package br.com.gestaoimoveis.auth.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.gestaoimoveis.auth.api.AuthDtos.SignupRequest;
import br.com.gestaoimoveis.auth.domain.LoginAttempt;
import br.com.gestaoimoveis.auth.repository.LoginAttemptRepository;
import br.com.gestaoimoveis.organizations.service.OrganizationService;
import br.com.gestaoimoveis.shared.error.BusinessException;
import br.com.gestaoimoveis.shared.security.CurrentUser;
import br.com.gestaoimoveis.shared.security.Emails;
import br.com.gestaoimoveis.users.domain.AppUser;
import br.com.gestaoimoveis.users.service.UserService;

@Service
public class AuthService {

    static final int MAX_FAILURES = 5;
    // limite por conta somando todos os IPs: freia ataque distribuído
    static final int MAX_FAILURES_PER_ACCOUNT = 20;
    static final Duration WINDOW = Duration.ofMinutes(15);

    private final OrganizationService organizations;
    private final UserService users;
    private final LoginAttemptRepository attempts;
    private final PasswordEncoder passwordEncoder;
    // compara contra um hash qualquer quando o e-mail não existe: o tempo de resposta não denuncia o cadastro
    private final String dummyHash;

    AuthService(OrganizationService organizations, UserService users, LoginAttemptRepository attempts,
            PasswordEncoder passwordEncoder) {
        this.organizations = organizations;
        this.users = users;
        this.attempts = attempts;
        this.passwordEncoder = passwordEncoder;
        this.dummyHash = passwordEncoder.encode("senha-que-nao-existe");
    }

    @Transactional
    public CurrentUser signup(SignupRequest req) {
        var orgId = organizations.create(req.organizationName());
        return users.createAdmin(orgId, req.name(), req.email(), req.password()).toCurrentUser();
    }

    /**
     * Uma transação por tentativa, travada pelo e-mail: um segundo login simultâneo da mesma conta
     * recebe 429 na hora, então contar falhas e gravar a tentativa nunca correm em paralelo.
     * noRollbackFor mantém a falha gravada mesmo com o 401/429.
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public CurrentUser login(String rawEmail, String password, String ip) {
        String email = Emails.normalize(rawEmail);
        Instant since = Instant.now().minus(WINDOW);
        // conta sob ataque: só passam IPs onde essa conta já entrou com sucesso. O ataque distribuído
        // para, e um terceiro não tranca o dono no IP de costume (IP novo espera a janela)
        if (!attempts.tryLockEmail(email)
                || attempts.countFailuresSince(email, ip, since) >= MAX_FAILURES
                || (attempts.countFailuresSince(email, since) >= MAX_FAILURES_PER_ACCOUNT
                        && !attempts.existsByEmailAndIpAndSuccessTrue(email, ip))) {
            throw new BusinessException(HttpStatus.TOO_MANY_REQUESTS,
                    "Muitas tentativas. Aguarde 15 minutos e tente de novo.");
        }
        Optional<AppUser> user = users.findForLogin(email);
        boolean ok = passwordEncoder.matches(password, user.map(AppUser::getPasswordHash).orElse(dummyHash))
                && user.get().isActive();
        attempts.save(new LoginAttempt(email, ip, ok));
        if (!ok) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos.");
        }
        return user.get().toCurrentUser();
    }

    /** Falhas fora da janela não servem para nada; sem isto a tabela cresce sem fim. */
    @Scheduled(fixedDelay = 1, timeUnit = TimeUnit.HOURS)
    @Transactional
    public int purgeOldFailures() {
        return attempts.deleteFailuresBefore(Instant.now().minus(WINDOW));
    }
}
