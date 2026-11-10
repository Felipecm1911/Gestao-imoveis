package br.com.gestaoimoveis.tenants.domain;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Version;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import br.com.gestaoimoveis.owners.domain.Address;

@Entity
public class Tenant {

    @Id
    private UUID id = UUID.randomUUID();
    @Column(updatable = false)
    private UUID organizationId;
    private String name;
    private String document;
    private String email;
    private String phone;
    @JdbcTypeCode(SqlTypes.JSON)
    private Address address;
    private Instant anonymizedAt;
    @CreationTimestamp
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
    @Version
    private Long version;

    protected Tenant() {}

    public Tenant(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public void update(String name, String document, String email, String phone, Address address) {
        this.name = name.trim();
        this.document = document;
        this.email = email;
        this.phone = phone;
        this.address = address;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getDocument() { return document; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public Address getAddress() { return address; }
    public Instant getCreatedAt() { return createdAt; }
    public Long getVersion() { return version; }
}
