package br.com.gestaoimoveis;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.MountableFile;

/**
 * Mesma imagem e mesmo script de papéis do docker-compose: a aplicação conecta como app_user,
 * então o RLS também é exercitado nos testes. Sem @ServiceConnection de propósito, porque ele
 * trocaria o usuário pelo superusuário do container (que ignora RLS).
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    static final String OWNER_PW = "owner-test";
    static final String USER_PW = "user-test";

    @Bean
    PostgreSQLContainer postgresContainer() {
        return new PostgreSQLContainer("postgres:17-alpine")
                .withEnv("APP_OWNER_PASSWORD", OWNER_PW)
                .withEnv("APP_USER_PASSWORD", USER_PW)
                .withCopyFileToContainer(MountableFile.forHostPath("../docker/postgres/01-roles.sh", 0755),
                        "/docker-entrypoint-initdb.d/01-roles.sh");
    }

    @Bean
    DynamicPropertyRegistrar databaseProperties(PostgreSQLContainer pg) {
        return r -> {
            r.add("spring.datasource.url", pg::getJdbcUrl);
            r.add("spring.datasource.password", () -> USER_PW);
            r.add("spring.flyway.password", () -> OWNER_PW);
        };
    }
}
