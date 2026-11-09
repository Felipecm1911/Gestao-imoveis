package br.com.gestaoimoveis.properties.domain;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import org.hibernate.annotations.CreationTimestamp;

@Entity
public class PropertyPhoto {

    @Id
    private UUID id = UUID.randomUUID();
    private UUID organizationId;
    private UUID propertyId;
    private UUID fileId;
    private int position;
    @Column(name = "is_cover")
    private boolean cover;
    @CreationTimestamp
    private Instant createdAt;

    protected PropertyPhoto() {}

    public PropertyPhoto(UUID organizationId, UUID propertyId, UUID fileId, int position, boolean cover) {
        this.organizationId = organizationId;
        this.propertyId = propertyId;
        this.fileId = fileId;
        this.position = position;
        this.cover = cover;
    }

    public void setCover(boolean cover) {
        this.cover = cover;
    }

    public UUID getId() { return id; }
    public UUID getPropertyId() { return propertyId; }
    public UUID getFileId() { return fileId; }
    public int getPosition() { return position; }
    public boolean isCover() { return cover; }
}
