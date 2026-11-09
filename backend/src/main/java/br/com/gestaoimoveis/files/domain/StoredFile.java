package br.com.gestaoimoveis.files.domain;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import org.hibernate.annotations.CreationTimestamp;

@Entity
public class StoredFile {

    @Id
    private UUID id = UUID.randomUUID();
    private UUID organizationId;
    private String originalName;
    private String contentType;
    private long size;
    private String storageKey;
    private String visibility = "INTERNO";
    @CreationTimestamp
    private Instant createdAt;

    protected StoredFile() {}

    public StoredFile(UUID organizationId, String originalName, String contentType, long size) {
        this.organizationId = organizationId;
        this.originalName = originalName;
        this.contentType = contentType;
        this.size = size;
        // a chave nunca usa o nome enviado: evita path traversal e nomes duplicados
        this.storageKey = organizationId + "/" + id;
    }

    public UUID getId() { return id; }
    public String getOriginalName() { return originalName; }
    public String getContentType() { return contentType; }
    public long getSize() { return size; }
    public String getStorageKey() { return storageKey; }
}
