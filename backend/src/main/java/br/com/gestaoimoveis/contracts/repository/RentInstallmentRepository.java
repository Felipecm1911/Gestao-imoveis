package br.com.gestaoimoveis.contracts.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.gestaoimoveis.contracts.domain.RentInstallment;

public interface RentInstallmentRepository extends JpaRepository<RentInstallment, UUID> {

    List<RentInstallment> findByContractIdOrderByReferenceMonth(UUID contractId);
}
