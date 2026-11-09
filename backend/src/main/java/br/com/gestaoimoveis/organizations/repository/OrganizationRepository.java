package br.com.gestaoimoveis.organizations.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.gestaoimoveis.organizations.domain.Organization;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {}
