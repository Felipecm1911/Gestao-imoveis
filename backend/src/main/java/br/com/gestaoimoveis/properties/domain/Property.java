package br.com.gestaoimoveis.properties.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Version;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

@Entity
public class Property {

    public enum Type { APARTAMENTO, CASA, COMERCIAL, TERRENO, OUTRO }

    public enum Status { DISPONIVEL, OCUPADO, MANUTENCAO, INATIVO }

    @Id
    private UUID id = UUID.randomUUID();
    @Column(updatable = false)
    private UUID organizationId;
    private UUID ownerId;
    private String code;
    private String title;
    private String description;
    @Enumerated(EnumType.STRING)
    private Type type;
    private String street;
    private String number;
    private String complement;
    private String district;
    private String city;
    @JdbcTypeCode(SqlTypes.CHAR)
    private String state;
    @JdbcTypeCode(SqlTypes.CHAR)
    private String zip;
    private BigDecimal areaM2;
    private short bedrooms;
    private short bathrooms;
    private short parking;
    private BigDecimal suggestedRent;
    @Enumerated(EnumType.STRING)
    private Status status = Status.DISPONIVEL;
    @CreationTimestamp
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
    @Version
    private Long version;

    protected Property() {}

    public Property(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public record Data(UUID ownerId, String code, String title, String description, Type type, String street,
            String number, String complement, String district, String city, String state, String zip,
            BigDecimal areaM2, short bedrooms, short bathrooms, short parking, BigDecimal suggestedRent) {}

    public void update(Data d) {
        this.ownerId = d.ownerId();
        this.code = d.code();
        this.title = d.title();
        this.description = d.description();
        this.type = d.type();
        this.street = d.street();
        this.number = d.number();
        this.complement = d.complement();
        this.district = d.district();
        this.city = d.city();
        this.state = d.state();
        this.zip = d.zip();
        this.areaM2 = d.areaM2();
        this.bedrooms = d.bedrooms();
        this.bathrooms = d.bathrooms();
        this.parking = d.parking();
        this.suggestedRent = d.suggestedRent();
    }

    /** Contrato ativado: o imóvel passa a OCUPADO. Inativo não recebe contrato. */
    public void occupy() {
        if (status == Status.INATIVO) {
            throw new IllegalArgumentException("Imóvel inativo não pode receber contrato.");
        }
        this.status = Status.OCUPADO;
    }

    /** Sem contrato ativo, o imóvel OCUPADO volta a DISPONIVEL. */
    public void release() {
        if (status == Status.OCUPADO) this.status = Status.DISPONIVEL;
    }

    /** OCUPADO é controlado pelos contratos; manualmente só as outras situações. */
    public void changeStatus(Status newStatus) {
        if (newStatus == Status.OCUPADO || status == Status.OCUPADO) {
            throw new IllegalArgumentException("A situação OCUPADO é definida pelos contratos.");
        }
        this.status = newStatus;
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public String getCode() { return code; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Type getType() { return type; }
    public String getStreet() { return street; }
    public String getNumber() { return number; }
    public String getComplement() { return complement; }
    public String getDistrict() { return district; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public String getZip() { return zip; }
    public BigDecimal getAreaM2() { return areaM2; }
    public short getBedrooms() { return bedrooms; }
    public short getBathrooms() { return bathrooms; }
    public short getParking() { return parking; }
    public BigDecimal getSuggestedRent() { return suggestedRent; }
    public Status getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Long getVersion() { return version; }
}
