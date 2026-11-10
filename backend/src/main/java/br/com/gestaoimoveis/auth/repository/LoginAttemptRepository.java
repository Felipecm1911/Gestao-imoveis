package br.com.gestaoimoveis.auth.repository;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import br.com.gestaoimoveis.auth.domain.LoginAttempt;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    @Query("""
            select count(a) from LoginAttempt a
            where a.email = ?1 and a.ip = ?2 and a.success = false and a.attemptedAt > ?3
            """)
    long countFailuresSince(String email, String ip, Instant since);

    @Query("select count(a) from LoginAttempt a where a.email = ?1 and a.success = false and a.attemptedAt > ?2")
    long countFailuresSince(String email, Instant since);

    boolean existsByEmailAndIpAndSuccessTrue(String email, String ip);

    /** Fila por e-mail até o fim da transação: contar falhas e gravar a tentativa viram um passo só. */
    @Query(value = "select 1 from (select pg_advisory_xact_lock(hashtext(?1))) l", nativeQuery = true)
    int lockEmail(String email);

    // os sucessos ficam: a regra de "IP conhecido" depende deles
    @Modifying
    @Query("delete from LoginAttempt a where a.success = false and a.attemptedAt < ?1")
    int deleteFailuresBefore(Instant before);
}
