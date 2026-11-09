package br.com.gestaoimoveis.shared.tenancy;

import javax.sql.DataSource;

import jakarta.persistence.EntityManagerFactory;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.session.jdbc.config.annotation.SpringSessionTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration(proxyBeanMethods = false)
class TenancyConfig {

    @Bean
    @Primary
    PlatformTransactionManager transactionManager(EntityManagerFactory emf) {
        return new TenantTransactionManager(emf);
    }

    /**
     * As tabelas de sessão não têm RLS. Um gerenciador separado evita que carregar a sessão
     * (para descobrir o usuário) dispare de novo o TenantTransactionManager, que precisa do usuário.
     */
    @Bean
    @SpringSessionTransactionManager
    PlatformTransactionManager sessionTransactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
