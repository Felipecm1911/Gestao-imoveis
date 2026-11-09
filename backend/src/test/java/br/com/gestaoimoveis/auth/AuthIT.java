package br.com.gestaoimoveis.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;

import br.com.gestaoimoveis.IntegrationTest;

class AuthIT extends IntegrationTest {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void signupCreatesOrganizationAndLogsIn() throws Exception {
        String email = uniqueEmail();
        Cookie session = signup(email);

        mvc.perform(get("/api/auth/me").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.organizationName").value("Imobiliária Teste"));
    }

    @Test
    void duplicateEmailIsRejected() throws Exception {
        String email = uniqueEmail();
        signup(email);
        mvc.perform(post("/api/auth/signup").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"organizationName":"Outra","name":"Bia","email":"%s","password":"%s"}"""
                                .formatted(email.toUpperCase(), PASSWORD)))
                .andExpect(status().isConflict());
    }

    @Test
    void invalidSignupReturnsFieldErrors() throws Exception {
        mvc.perform(post("/api/auth/signup").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"organizationName\":\"\",\"name\":\"x\",\"email\":\"nao-e-email\",\"password\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.length()").value(3));
    }

    @Test
    void loginWorksAndWrongPasswordIsRejected() throws Exception {
        String email = uniqueEmail();
        signup(email);
        Cookie session = login(email, PASSWORD);
        mvc.perform(get("/api/auth/me").cookie(session)).andExpect(status().isOk());

        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"errada\"}".formatted(email)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tooManyFailuresAreThrottled() throws Exception {
        String email = uniqueEmail();
        signup(email);
        // variações do mesmo e-mail contam juntas
        String[] variants = {email, email.toUpperCase(), " " + email, email + " ", " " + email.toUpperCase() + " "};
        for (String variant : variants) {
            String body = "{\"email\":\"%s\",\"password\":\"errada\"}".formatted(variant);
            mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isUnauthorized());
        }
        // nem a senha certa passa enquanto a janela estiver aberta
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, PASSWORD)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void protectedRoutesNeedSessionAndCsrf() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void logoutEndsSession() throws Exception {
        Cookie session = signup();
        mvc.perform(post("/api/auth/logout").with(csrf()).cookie(session)).andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/me").cookie(session)).andExpect(status().isUnauthorized());
    }

    @Test
    void deactivatedUserLosesSessionsAndCannotLogin() throws Exception {
        Cookie admin = signup();
        String staffEmail = uniqueEmail();
        String id = com.jayway.jsonpath.JsonPath.read(mvc.perform(post("/api/users").with(csrf()).cookie(admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Caio","email":"%s","password":"%s","role":"STAFF"}"""
                                .formatted(staffEmail, PASSWORD)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
        Cookie staff = login(staffEmail, PASSWORD);
        mvc.perform(get("/api/users").cookie(staff)).andExpect(status().isForbidden());

        mvc.perform(post("/api/users/" + id + "/deactivate").with(csrf()).cookie(admin))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/auth/me").cookie(staff)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(staffEmail, PASSWORD)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void demotedAdminLosesSessionImmediately() throws Exception {
        Cookie admin = signup();
        String otherEmail = uniqueEmail();
        String id = com.jayway.jsonpath.JsonPath.read(mvc.perform(post("/api/users").with(csrf()).cookie(admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Duda","email":"%s","password":"%s","role":"ADMIN"}"""
                                .formatted(otherEmail, PASSWORD)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
        Cookie other = login(otherEmail, PASSWORD);
        mvc.perform(get("/api/users").cookie(other)).andExpect(status().isOk());

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/users/" + id)
                        .with(csrf()).cookie(admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Duda\",\"role\":\"STAFF\"}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/users").cookie(other)).andExpect(status().isUnauthorized());
        Cookie again = login(otherEmail, PASSWORD);
        mvc.perform(get("/api/users").cookie(again)).andExpect(status().isForbidden());
    }

    @Test
    void databaseHidesRowsWithoutOrganization() {
        // conexão como app_user fora de uma transação com app.org_id: o RLS não devolve nada
        assertThat(jdbc.queryForObject("select count(*) from app_user", Long.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from organization", Long.class)).isZero();
    }
}
