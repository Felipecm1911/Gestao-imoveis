package br.com.gestaoimoveis.contracts.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import br.com.gestaoimoveis.contracts.domain.Payment;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<Payment> findByOrganizationIdAndIdempotencyKey(UUID organizationId, String idempotencyKey);

    List<Payment> findByInstallmentIdInOrderByCreatedAt(Collection<UUID> installmentIds);

    /** Só o id da parcela, sem carregar o pagamento: quem estorna trava a parcela antes de ler o pagamento. */
    @Query("select p.installmentId from Payment p where p.id = ?1 and p.organizationId = ?2")
    Optional<UUID> installmentIdOf(UUID id, UUID organizationId);
}
