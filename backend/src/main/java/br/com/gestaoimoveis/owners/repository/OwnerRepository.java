package br.com.gestaoimoveis.owners.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import br.com.gestaoimoveis.owners.domain.Owner;

public interface OwnerRepository extends JpaRepository<Owner, UUID> {

    Optional<Owner> findByIdAndOrganizationId(UUID id, UUID organizationId);

    @Query("""
            select o from Owner o where o.organizationId = ?1
            and (?2 = '' or lower(o.name) like concat('%', ?2, '%') or o.document like concat('%', ?2, '%'))
            """)
    Page<Owner> search(UUID organizationId, String q, Pageable pageable);
}
