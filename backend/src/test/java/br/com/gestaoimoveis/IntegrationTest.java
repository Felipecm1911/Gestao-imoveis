package br.com.gestaoimoveis;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import jakarta.servlet.http.Cookie;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Base dos testes de integração: Postgres real (Testcontainers) com RLS ativo.
 * O contexto é compartilhado entre as classes; cada teste cria a própria organização.
 */
@SpringBootTest(properties = "app.upload-dir=target/test-uploads")
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
public abstract class IntegrationTest {

    protected static final String PASSWORD = "senha-forte-123";

    @Autowired
    protected MockMvc mvc;

    /** Organização nova com um ADMIN logado; devolve o cookie de sessão. */
    protected Cookie signup() throws Exception {
        return signup(uniqueEmail());
    }

    protected Cookie signup(String email) throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/signup").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"organizationName":"Imobiliária Teste","name":"Ana Admin",
                                 "email":"%s","password":"%s"}""".formatted(email, PASSWORD)))
                .andExpect(status().isCreated())
                .andReturn();
        return sessionCookie(r);
    }

    protected Cookie login(String email, String password) throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();
        return sessionCookie(r);
    }

    protected static Cookie sessionCookie(MvcResult r) {
        Cookie c = r.getResponse().getCookie("SESSION");
        if (c == null) throw new AssertionError("Resposta sem cookie SESSION");
        return c;
    }

    protected static String uniqueEmail() {
        return "u" + UUID.randomUUID().toString().substring(0, 8) + "@teste.com";
    }
}
