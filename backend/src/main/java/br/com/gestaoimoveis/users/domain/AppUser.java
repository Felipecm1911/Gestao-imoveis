package br.com.gestaoimoveis.users.domain;

import br.com.gestaoimoveis.shared.security.Emails;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Version;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import br.com.gestaoimoveis.shared.security.CurrentUser;
import br.com.gestaoimoveis.shared.security.Role;

@Entity
public class AppUser {

    @Id
    private UUID id = UUID.randomUUID();
    @Column(updatable = false)
    private UUID organizationId;
    private String email;
    private String passwordHash;
    private String name;
    @Enumerated(EnumType.STRING)
    private Role role;
    private UUID ownerId;
    private boolean active = true;
    @CreationTimestamp
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
    @Version
    private Long version;

    protected AppUser() {}

    public AppUser(UUID organizationId, String email, String passwordHash, String name, Role role) {
        this.organizationId = organizationId;
        this.email = Emails.normalize(email);
        this.passwordHash = passwordHash;
        this.name = name.trim();
        this.role = role;
    }

    public CurrentUser toCurrentUser() {
        return new CurrentUser(id, organizationId, email, name, role, ownerId);
    }

    public void update(String name, Role role) {
        this.name = name.trim();
        this.role = role;
    }

    public void deactivate() {
        this.active = false;
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getName() { return name; }
    public Role getRole() { return role; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
}
