package br.com.gestaoimoveis.files.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.gestaoimoveis.files.domain.StoredFile;

public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {

    Optional<StoredFile> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
