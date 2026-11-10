package br.com.gestaoimoveis.tenants.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import br.com.gestaoimoveis.tenants.domain.Tenant;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    Optional<Tenant> findByIdAndOrganizationId(UUID id, UUID organizationId);

    @Query("""
            select o from Tenant o where o.organizationId = ?1
            and (lower(o.name) like ?2 escape '\\' or o.document like ?2 escape '\\')
            """)
    /** pattern vem de Like.contains. */
    Page<Tenant> search(UUID organizationId, String pattern, Pageable pageable);
}
