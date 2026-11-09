package br.com.gestaoimoveis.auth.domain;

import br.com.gestaoimoveis.shared.security.Emails;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private String ip;
    private Instant attemptedAt = Instant.now();
    private boolean success;

    protected LoginAttempt() {}

    public LoginAttempt(String email, String ip, boolean success) {
        this.email = Emails.normalize(email);
        this.ip = ip;
        this.success = success;
    }
}
