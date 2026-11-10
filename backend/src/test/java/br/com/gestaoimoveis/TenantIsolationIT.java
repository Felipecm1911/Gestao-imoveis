package br.com.gestaoimoveis;

import static br.com.gestaoimoveis.TestData.CPFS;
import static br.com.gestaoimoveis.TestData.PNG;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import jakarta.persistence.EntityManager;
import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.RequestBuilder;
import org.springframework.transaction.support.TransactionTemplate;

import com.jayway.jsonpath.JsonPath;

import br.com.gestaoimoveis.shared.tenancy.TenantSession;

/**
 * Teste obrigatório da ARQUITETURA: com dois tenants, todo endpoint chamado com o ID de recurso
 * do outro responde 404, e o banco (RLS) não devolve linhas do outro mesmo numa query sem filtro.
 */
class TenantIsolationIT extends IntegrationTest {

    @Autowired TransactionTemplate tx;
    @Autowired TenantSession tenantSession;
    @Autowired EntityManager em;

    @Test
    void otherOrganizationGets404EverywhereAndDatabaseHidesRows() throws Exception {
        Cookie a = signup();
        String ownerA = json(post("/api/owners").with(csrf()).cookie(a).contentType(MediaType.APPLICATION_JSON)
                .content(TestData.owner(CPFS[1])), "$.id");
        String propertyA = json(post("/api/properties").with(csrf()).cookie(a).contentType(MediaType.APPLICATION_JSON)
                .content(TestData.property(ownerA, "AP-0001", "Santos", "1000")), "$.id");
        String photoJson = mvc.perform(multipart("/api/properties/" + propertyA + "/photos")
                        .file(new MockMultipartFile("files", "a.png", "image/png", PNG)).with(csrf()).cookie(a))
                .andReturn().getResponse().getContentAsString();
        String photoA = JsonPath.read(photoJson, "$.photos[0].id");
        String fileUrlA = JsonPath.read(photoJson, "$.photos[0].url");
        String userA = JsonPath.<List<String>>read(mvc.perform(get("/api/users").cookie(a))
                .andReturn().getResponse().getContentAsString(), "$[*].id").getFirst();

        String tenantA = json(post("/api/tenants").with(csrf()).cookie(a).contentType(MediaType.APPLICATION_JSON)
                .content(TestData.tenant(CPFS[2])), "$.id");
        String contractBody = TestData.contract(propertyA, tenantA, "2026-01-15", "2027-01-14");
        String contractA = json(post("/api/contracts").with(csrf()).cookie(a).contentType(MediaType.APPLICATION_JSON)
                .content(contractBody), "$.id");
        String contractUrl = "/api/contracts/" + contractA;

        Cookie b = signup();
        String ownerB = json(post("/api/owners").with(csrf()).cookie(b).contentType(MediaType.APPLICATION_JSON)
                .content(TestData.owner(CPFS[1])), "$.id"); // mesmo CPF em outra organização é permitido

        List<RequestBuilder> attempts = List.of(
                get("/api/owners/" + ownerA).cookie(b),
                put("/api/owners/" + ownerA).with(csrf()).cookie(b).contentType(MediaType.APPLICATION_JSON)
                        .content(withVersion(TestData.owner(CPFS[1]))),
                delete("/api/owners/" + ownerA).with(csrf()).cookie(b),
                get("/api/properties/" + propertyA).cookie(b),
                put("/api/properties/" + propertyA).with(csrf()).cookie(b).contentType(MediaType.APPLICATION_JSON)
                        .content(withVersion(TestData.property(ownerB, "X-1", "Santos", "1"))),
                patch("/api/properties/" + propertyA + "/status").with(csrf()).cookie(b)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INATIVO\"}"),
                delete("/api/properties/" + propertyA).with(csrf()).cookie(b),
                multipart("/api/properties/" + propertyA + "/photos")
                        .file(new MockMultipartFile("files", "b.png", "image/png", PNG)).with(csrf()).cookie(b),
                delete("/api/properties/" + propertyA + "/photos/" + photoA).with(csrf()).cookie(b),
                put("/api/properties/" + propertyA + "/photos/" + photoA + "/cover").with(csrf()).cookie(b),
                get(fileUrlA).cookie(b),
                patch("/api/users/" + userA).with(csrf()).cookie(b).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"x\",\"role\":\"STAFF\"}"),
                post("/api/users/" + userA + "/deactivate").with(csrf()).cookie(b),
                get("/api/tenants/" + tenantA).cookie(b),
                put("/api/tenants/" + tenantA).with(csrf()).cookie(b).contentType(MediaType.APPLICATION_JSON)
                        .content(withVersion(TestData.tenant(CPFS[2]))),
                delete("/api/tenants/" + tenantA).with(csrf()).cookie(b),
                get(contractUrl).cookie(b),
                put(contractUrl).with(csrf()).cookie(b).contentType(MediaType.APPLICATION_JSON)
                        .content(withVersion(contractBody)),
                post(contractUrl + "/activate").with(csrf()).cookie(b),
                post(contractUrl + "/adjust").with(csrf()).cookie(b).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"percent\":10,\"effectiveDate\":\"2026-07-01\"}"),
                post(contractUrl + "/renew").with(csrf()).cookie(b),
                post(contractUrl + "/terminate").with(csrf()).cookie(b).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"date\":\"2026-06-30\",\"reason\":\"x\"}"),
                post(contractUrl + "/cancel").with(csrf()).cookie(b),
                get(contractUrl + "/history").cookie(b),
                get(contractUrl + "/pdf").cookie(b),
                // B tentando fechar contrato com o imóvel e o inquilino de A
                post("/api/contracts").with(csrf()).cookie(b).contentType(MediaType.APPLICATION_JSON)
                        .content(contractBody),
                // B tentando usar o proprietário de A num imóvel próprio
                post("/api/properties").with(csrf()).cookie(b).contentType(MediaType.APPLICATION_JSON)
                        .content(TestData.property(ownerA, "X-2", "Santos", "1")));
        for (RequestBuilder attempt : attempts) {
            mvc.perform(attempt).andExpect(status().isNotFound());
        }

        mvc.perform(get("/api/owners").cookie(b)).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/properties").cookie(b)).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/tenants").cookie(b)).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/contracts").cookie(b)).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/contracts/stats").cookie(b)).andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/properties/" + propertyA).cookie(a)).andExpect(status().isOk()); // A intacto
        mvc.perform(get(contractUrl).cookie(a)).andExpect(jsonPath("$.status").value("RASCUNHO"));

        // segunda camada: SQL sem filtro de organização, só com o RLS
        UUID orgB = UUID.fromString(json(get("/api/auth/me").cookie(b), "$.organizationId"));
        UUID orgA = UUID.fromString(json(get("/api/auth/me").cookie(a), "$.organizationId"));
        assertThat(countAllProperties(orgB)).isZero();
        assertThat(countAllProperties(orgA)).isEqualTo(1);

        // imóvel próprio de B com o inquilino de A: o inquilino também não existe para B
        String propertyB = json(post("/api/properties").with(csrf()).cookie(b).contentType(MediaType.APPLICATION_JSON)
                .content(TestData.property(ownerB, "B-0001", "Santos", "1000")), "$.id");
        mvc.perform(post("/api/contracts").with(csrf()).cookie(b).contentType(MediaType.APPLICATION_JSON)
                        .content(TestData.contract(propertyB, tenantA, "2026-01-15", "2027-01-14")))
                .andExpect(status().isNotFound());
    }

    private long countAllProperties(UUID org) {
        return tx.execute(s -> {
            tenantSession.setOrganization(org);
            return ((Number) em.createNativeQuery("select count(*) from property").getSingleResult()).longValue();
        });
    }

    private String json(RequestBuilder request, String path) throws Exception {
        return JsonPath.read(mvc.perform(request).andReturn().getResponse().getContentAsString(), path);
    }

    private static String withVersion(String body) {
        return body.substring(0, body.lastIndexOf('}')) + ",\"version\":0}";
    }
}
