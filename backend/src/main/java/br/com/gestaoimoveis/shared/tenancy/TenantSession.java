package br.com.gestaoimoveis.shared.tenancy;

import java.util.UUID;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Grava as variáveis lidas pelas políticas RLS. O terceiro argumento de set_config (true)
 * faz o valor valer só até o fim da transação, então nada vaza entre requisições no pool.
 */
@Component
public class TenantSession {

    @PersistenceContext
    private EntityManager em;

    @Transactional(propagation = Propagation.MANDATORY)
    public void setOrganization(UUID organizationId) {
        set(em, "app.org_id", organizationId.toString());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void setLoginEmail(String email) {
        set(em, "app.login_email", email.trim().toLowerCase());
    }

    static void set(EntityManager target, String key, String value) {
        target.createNativeQuery("select set_config(:k, :v, true)")
                .setParameter("k", key).setParameter("v", value).getSingleResult();
    }
}
