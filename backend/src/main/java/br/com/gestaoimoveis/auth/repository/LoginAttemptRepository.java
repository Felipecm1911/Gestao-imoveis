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

    /**
     * Trava por e-mail até o fim da transação, sem esperar: false se outro login do mesmo e-mail está em
     * andamento. Esperar seguraria uma conexão do pool por pedido e um ataque em paralelo travaria o sistema.
     */
    @Query(value = "select pg_try_advisory_xact_lock(hashtext(?1))", nativeQuery = true)
    boolean tryLockEmail(String email);

    // os sucessos ficam: a regra de "IP conhecido" depende deles
    @Modifying
    @Query("delete from LoginAttempt a where a.success = false and a.attemptedAt < ?1")
    int deleteFailuresBefore(Instant before);
}
