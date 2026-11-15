package br.com.gestaoimoveis.contracts.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import br.com.gestaoimoveis.contracts.domain.RentInstallment;

public interface RentInstallmentRepository extends JpaRepository<RentInstallment, UUID> {

    List<RentInstallment> findByContractIdOrderByReferenceMonth(UUID contractId);

    /** Trava a linha: pagamentos e estornos simultâneos da mesma parcela passam um de cada vez. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from RentInstallment i where i.id = ?1 and i.organizationId = ?2")
    Optional<RentInstallment> lock(UUID id, UUID organizationId);
}
