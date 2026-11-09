package br.com.gestaoimoveis.auth.repository;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import br.com.gestaoimoveis.auth.domain.LoginAttempt;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    @Query("""
            select count(a) from LoginAttempt a
            where lower(a.email) = lower(?1) and a.ip = ?2 and a.success = false and a.attemptedAt > ?3
            """)
    long countFailuresSince(String email, String ip, Instant since);
}
