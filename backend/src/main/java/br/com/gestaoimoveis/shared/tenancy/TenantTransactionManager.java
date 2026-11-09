package br.com.gestaoimoveis.shared.tenancy;

import jakarta.persistence.EntityManagerFactory;

import org.springframework.orm.jpa.EntityManagerHolder;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import br.com.gestaoimoveis.shared.security.CurrentUser;

/** Abre toda transação já com app.org_id = organização da sessão (ou vazio, que não enxerga nada). */
public class TenantTransactionManager extends JpaTransactionManager {

    public TenantTransactionManager(EntityManagerFactory emf) {
        super(emf);
    }

    @Override
    protected void doBegin(Object transaction, TransactionDefinition definition) {
        // lido antes de abrir a transação: resolver o usuário pode carregar a sessão do banco
        String org = CurrentUser.find().map(u -> u.organizationId().toString()).orElse("");
        super.doBegin(transaction, definition);
        var holder = (EntityManagerHolder) TransactionSynchronizationManager.getResource(obtainEntityManagerFactory());
        try {
            TenantSession.set(holder.getEntityManager(), "app.org_id", org);
        } catch (RuntimeException e) {
            doCleanupAfterCompletion(transaction); // devolve a conexão ao pool
            throw e;
        }
    }
}
