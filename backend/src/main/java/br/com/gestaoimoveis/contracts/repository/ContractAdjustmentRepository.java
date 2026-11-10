package br.com.gestaoimoveis.contracts.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.gestaoimoveis.contracts.domain.ContractAdjustment;

public interface ContractAdjustmentRepository extends JpaRepository<ContractAdjustment, UUID> {

    List<ContractAdjustment> findByContractIdOrderByEffectiveDate(UUID contractId);
}
