package br.com.gestaoimoveis.contracts;

import static br.com.gestaoimoveis.TestData.CPFS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import br.com.gestaoimoveis.IntegrationTest;
import br.com.gestaoimoveis.TestData;

class ContractIT extends IntegrationTest {

    @Autowired
    JdbcTemplate jdbc;

    Cookie session;
    String propertyId;
    String tenantId;

    @BeforeEach
    void setUp() throws Exception {
        session = signup();
        String ownerId = id(send(post("/api/owners"), TestData.owner(CPFS[0])));
        propertyId = id(send(post("/api/properties"), TestData.property(ownerId, "AP-0001", "São Paulo", "3100")));
        tenantId = id(send(post("/api/tenants"), TestData.tenant(CPFS[1])));
    }

    @Test
    void activationGeneratesInstallmentsAndOccupiesProperty() throws Exception {
        String contract = draft("2026-01-15", "2027-01-14");
        mvc.perform(get("/api/contracts/" + contract).cookie(session))
                .andExpect(jsonPath("$.code").value("CT-0001"))
                .andExpect(jsonPath("$.status").value("RASCUNHO"))
                .andExpect(jsonPath("$.installments", hasSize(0)));

        act(contract, "activate", null).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ATIVO"))
                .andExpect(jsonPath("$.installments", hasSize(13)))
                .andExpect(jsonPath("$.installments[0].number").value(1))
                .andExpect(jsonPath("$.installments[0].dueDate").value("2026-02-10"))
                .andExpect(jsonPath("$.installments[0].amount").value(1700.00))
                .andExpect(jsonPath("$.installments[1].amount").value(3100.00))
                .andExpect(jsonPath("$.installments[12].amount").value(1400.00))
                .andExpect(jsonPath("$.summary.total").value(37200.00))
                .andExpect(jsonPath("$.summary.received").value(0.00));
        mvc.perform(get("/api/properties/" + propertyId).cookie(session))
                .andExpect(jsonPath("$.status").value("OCUPADO"));

        // em vigor: partes, prazo e valor travados; só garantia e observações mudam
        String changed = TestData.contract(propertyId, tenantId, "2026-01-15", "2027-01-14")
                .replace("3100.00", "9999.00").replace("Contrato de teste", "Nova observação");
        send(put("/api/contracts/" + contract), changed.substring(0, changed.lastIndexOf('}')) + ",\"version\":1}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.monthlyRent").value(3100.00))
                .andExpect(jsonPath("$.notes").value("Nova observação"));

        mvc.perform(get("/api/contracts?situation=ATIVO&q=ct-0001").cookie(session))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].tenantName").value("João Inquilino"))
                .andExpect(jsonPath("$.content[0].propertyCode").value("AP-0001"));
        mvc.perform(get("/api/contracts?q=joão").cookie(session)).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/contracts?q=nada-disso").cookie(session)).andExpect(jsonPath("$.totalElements").value(0));

        // quem tem contrato não se apaga
        mvc.perform(delete("/api/properties/" + propertyId).with(csrf()).cookie(session)).andExpect(status().isConflict());
        mvc.perform(delete("/api/tenants/" + tenantId).with(csrf()).cookie(session)).andExpect(status().isConflict());

        mvc.perform(get("/api/contracts/" + contract + "/history").cookie(session))
                .andExpect(jsonPath("$[*].action").value(org.hamcrest.Matchers.contains("ALTERADO", "ATIVADO", "CRIADO")))
                .andExpect(jsonPath("$[0].userName").value("Ana Admin"))
                .andExpect(jsonPath("$[0].before.notes").value("Contrato de teste"));
        mvc.perform(get("/api/contracts/" + contract + "/pdf").cookie(session))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF));
    }

    @Test
    void overlappingActiveContractOnSamePropertyIsRejected() throws Exception {
        act(draft("2026-01-15", "2027-01-14"), "activate", null).andExpect(status().isOk());

        act(draft("2026-12-01", "2027-11-30"), "activate", null).andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Este imóvel já tem contrato ativo neste período."));
        // encostado no fim do anterior não sobrepõe
        act(draft("2027-01-15", "2027-12-31"), "activate", null).andExpect(status().isOk());
    }

    @Test
    void simultaneousActivationsLetOnlyOneThrough() throws Exception {
        List<Callable<Integer>> calls = new ArrayList<>();
        for (String contract : List.of(draft("2026-01-15", "2027-01-14"), draft("2026-06-01", "2027-05-31"))) {
            calls.add(() -> act(contract, "activate", null).andReturn().getResponse().getStatus());
        }
        List<Integer> statuses = new ArrayList<>();
        try (var pool = Executors.newFixedThreadPool(2)) {
            for (var f : pool.invokeAll(calls)) statuses.add(f.get());
        }
        assertThat(statuses).containsExactlyInAnyOrder(200, 409);
        mvc.perform(get("/api/contracts?situation=ATIVO").cookie(session))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void terminationCancelsOnlyUnpaidInstallmentsDueAfterTheDate() throws Exception {
        String contract = draft("2026-01-15", "2027-01-14");
        act(contract, "terminate", "{\"date\":\"2026-06-30\",\"reason\":\"x\"}").andExpect(status().isConflict()); // rascunho
        act(contract, "activate", null);

        String body = act(contract, "terminate", "{\"date\":\"2026-06-30\",\"reason\":\"Inquilino pediu a saída\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ENCERRADO"))
                .andExpect(jsonPath("$.endedAt").value("2026-06-30"))
                .andReturn().getResponse().getContentAsString();
        // vencimentos de 10/02 a 10/06 ficam; de 10/07 em diante, cancelados
        List<String> statuses = JsonPath.read(body, "$.installments[*].status");
        assertThat(statuses.subList(0, 5)).doesNotContain("CANCELADA");
        assertThat(statuses.subList(5, 13)).containsOnly("CANCELADA");
        assertThat(JsonPath.<Number>read(body, "$.summary.total").doubleValue()).isEqualTo(1700.00 + 4 * 3100.00);

        mvc.perform(get("/api/properties/" + propertyId).cookie(session))
                .andExpect(jsonPath("$.status").value("DISPONIVEL"));
    }

    @Test
    void adjustmentRecalculatesOpenInstallmentsFromEffectiveDate() throws Exception {
        String contract = draft("2026-01-15", "2027-01-14");
        act(contract, "activate", null);

        act(contract, "adjust", "{\"percent\":10,\"effectiveDate\":\"2026-07-01\"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.monthlyRent").value(3410.00))
                .andExpect(jsonPath("$.installments[5].amount").value(3100.00)) // junho: antes da vigência
                .andExpect(jsonPath("$.installments[6].amount").value(3410.00))
                .andExpect(jsonPath("$.installments[12].amount").value(1540.00)) // 3410 × 14/31
                .andExpect(jsonPath("$.adjustments", hasSize(1)))
                .andExpect(jsonPath("$.adjustments[0].oldRent").value(3100.00))
                .andExpect(jsonPath("$.adjustments[0].newRent").value(3410.00));
        act(contract, "adjust", "{\"percent\":10,\"effectiveDate\":\"2028-01-01\"}").andExpect(status().isBadRequest());
    }

    @Test
    void renewalCreatesDraftStartingTheDayAfterAndClosesPreviousOnActivation() throws Exception {
        LocalDate start = LocalDate.now().minusMonths(11);
        LocalDate end = start.plusYears(1).minusDays(1); // termina em ~1 mês: "encerrando"
        String contract = draft(start.toString(), end.toString());
        act(contract, "activate", null).andExpect(jsonPath("$.situation").value("ENCERRANDO"));
        mvc.perform(get("/api/contracts/stats").cookie(session))
                .andExpect(jsonPath("$.active").value(1)).andExpect(jsonPath("$.ending").value(1));

        String renewal = id(act(contract, "renew", null).andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("RASCUNHO"))
                .andExpect(jsonPath("$.startDate").value(end.plusDays(1).toString()))
                .andExpect(jsonPath("$.endDate").value(end.plusDays(1).plusYears(1).minusDays(1).toString()))
                .andExpect(jsonPath("$.previousContract.code").value("CT-0001")));
        act(contract, "renew", null).andExpect(status().isConflict()); // já tem renovação
        mvc.perform(get("/api/contracts/" + contract).cookie(session))
                .andExpect(jsonPath("$.situation").value("EM_RENOVACAO"))
                .andExpect(jsonPath("$.renewal.code").value("CT-0002"));
        mvc.perform(get("/api/contracts/stats").cookie(session))
                .andExpect(jsonPath("$.total").value(2)).andExpect(jsonPath("$.renewing").value(1))
                .andExpect(jsonPath("$.ending").value(0));

        act(renewal, "activate", null).andExpect(status().isOk());
        mvc.perform(get("/api/contracts/" + contract).cookie(session))
                .andExpect(jsonPath("$.status").value("ENCERRADO"))
                .andExpect(jsonPath("$.endReason").value("Renovado pelo contrato CT-0002"))
                .andExpect(jsonPath("$.installments[*].status").value(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.hasItem("CANCELADA"))));
        mvc.perform(get("/api/properties/" + propertyId).cookie(session))
                .andExpect(jsonPath("$.status").value("OCUPADO"));
    }

    @Test
    void draftRulesAndValidation() throws Exception {
        String valid = TestData.contract(propertyId, tenantId, "2026-01-15", "2027-01-14");
        send(post("/api/contracts"), valid.replace("\"dueDay\":10", "\"dueDay\":29"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("dueDay"));
        send(post("/api/contracts"), TestData.contract(propertyId, tenantId, "2026-01-15", "2026-01-15"))
                .andExpect(status().isBadRequest());
        send(post("/api/contracts"), valid.replace("IGPM", "PERCENTUAL_FIXO")).andExpect(status().isBadRequest());

        String contract = draft("2026-01-15", "2027-01-14");
        act(contract, "cancel", null).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELADO"));
        act(contract, "activate", null).andExpect(status().isConflict());

        // imóvel inativo não recebe contrato novo
        send(patch("/api/properties/" + propertyId + "/status"), "{\"status\":\"INATIVO\"}").andExpect(status().isOk());
        send(post("/api/contracts"), valid).andExpect(status().isConflict());
    }

    @Test
    void auditTrailCannotBeRewrittenByTheApplication() throws Exception {
        draft("2026-01-15", "2027-01-14");
        assertThatThrownBy(() -> jdbc.update("update audit_event set action = 'x'"))
                .isInstanceOf(DataAccessException.class).rootCause().hasMessageContaining("permission denied");
        assertThatThrownBy(() -> jdbc.update("delete from audit_event"))
                .isInstanceOf(DataAccessException.class).rootCause().hasMessageContaining("permission denied");
    }

    private String draft(String start, String end) throws Exception {
        return id(send(post("/api/contracts"), TestData.contract(propertyId, tenantId, start, end))
                .andExpect(status().isCreated()));
    }

    private ResultActions act(String contractId, String action, String body) throws Exception {
        return send(post("/api/contracts/" + contractId + "/" + action), body);
    }

    private ResultActions send(MockHttpServletRequestBuilder request, String body) throws Exception {
        if (body != null) request.contentType(MediaType.APPLICATION_JSON).content(body);
        return mvc.perform(request.with(csrf()).cookie(session));
    }

    private static String id(ResultActions result) throws Exception {
        return JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id");
    }
}
