package br.com.gestaoimoveis.properties;

import static br.com.gestaoimoveis.TestData.CPFS;
import static br.com.gestaoimoveis.TestData.PNG;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import com.jayway.jsonpath.JsonPath;

import br.com.gestaoimoveis.IntegrationTest;
import br.com.gestaoimoveis.TestData;

class PropertyIT extends IntegrationTest {

    Cookie session;
    String ownerId;

    @BeforeEach
    void setUp() throws Exception {
        session = signup();
        ownerId = createOwner(session, CPFS[0]);
    }

    @Test
    void ownerCrudWithValidationAndDuplicateDocument() throws Exception {
        mvc.perform(post("/api/owners").with(csrf()).cookie(session).contentType(MediaType.APPLICATION_JSON)
                        .content(TestData.owner("529.982.247-24")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("document"));
        // mesmo CPF com pontuação diferente continua duplicado
        mvc.perform(post("/api/owners").with(csrf()).cookie(session).contentType(MediaType.APPLICATION_JSON)
                        .content(TestData.owner("529.982.247-25")))
                .andExpect(status().isConflict());

        mvc.perform(get("/api/owners?q=maria").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].address.city").value("São Paulo"));
    }

    @Test
    void updateWithStaleVersionIsRejected() throws Exception {
        String body = TestData.owner(CPFS[0]).replace("Maria Proprietária", "Maria P. Silva");
        String withVersion = body.substring(0, body.lastIndexOf('}')) + ",\"version\":%d}";
        mvc.perform(put("/api/owners/" + ownerId).with(csrf()).cookie(session).contentType(MediaType.APPLICATION_JSON)
                        .content(withVersion.formatted(0)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1));
        mvc.perform(put("/api/owners/" + ownerId).with(csrf()).cookie(session).contentType(MediaType.APPLICATION_JSON)
                        .content(withVersion.formatted(0)))
                .andExpect(status().isConflict());
    }

    @Test
    void propertyCrudAndFilters() throws Exception {
        createProperty("AP-0001", "São Paulo", "2300.00");
        createProperty("ap-0002", "Campinas", "1800");
        createProperty("AP-0003", "São Paulo", "3900.5");

        mvc.perform(get("/api/properties?city=são paulo&minRent=2000&sort=suggestedRent,desc").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].code").value("AP-0003"))
                .andExpect(jsonPath("$.content[0].suggestedRent").value(3900.50))
                .andExpect(jsonPath("$.content[0].owner.name").value("Maria Proprietária"));

        mvc.perform(get("/api/properties?q=ap-0002").cookie(session))
                .andExpect(jsonPath("$.content[0].code").value("AP-0002"));

        // código duplicado (normalizado para maiúsculas)
        mvc.perform(post("/api/properties").with(csrf()).cookie(session).contentType(MediaType.APPLICATION_JSON)
                        .content(TestData.property(ownerId, "ap-0001", "Santos", "100")))
                .andExpect(status().isConflict());

        mvc.perform(get("/api/properties?sort=senha,asc").cookie(session)).andExpect(status().isBadRequest());

        // % e _ digitados são texto, não curinga
        mvc.perform(get("/api/properties").param("q", "%").cookie(session))
                .andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/properties").param("q", "AP_0001").cookie(session))
                .andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/owners").param("q", "%").cookie(session))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void statusOcupadoIsReservedForContracts() throws Exception {
        String id = createProperty("AP-0010", "Santos", "1500");
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/properties/" + id + "/status")
                        .with(csrf()).cookie(session).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"OCUPADO\"}"))
                .andExpect(status().isConflict());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/properties/" + id + "/status")
                        .with(csrf()).cookie(session).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"MANUTENCAO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MANUTENCAO"));
    }

    @Test
    void ownerWithPropertiesCannotBeDeleted() throws Exception {
        createProperty("AP-0020", "Santos", "1500");
        mvc.perform(delete("/api/owners/" + ownerId).with(csrf()).cookie(session)).andExpect(status().isConflict());
    }

    @Test
    void photosUploadCoverDownloadAndDelete() throws Exception {
        String id = createProperty("AP-0030", "Santos", "1500");
        String json = mvc.perform(multipart("/api/properties/" + id + "/photos")
                        .file(new MockMultipartFile("files", "sala.png", "image/png", PNG))
                        .file(new MockMultipartFile("files", "quarto.png", "image/png", PNG))
                        .with(csrf()).cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photos", hasSize(2)))
                .andExpect(jsonPath("$.photos[0].cover").value(true))
                .andReturn().getResponse().getContentAsString();
        String secondPhoto = JsonPath.read(json, "$.photos[1].id");
        String url = JsonPath.read(json, "$.photos[0].url");

        mvc.perform(get(url).cookie(session))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));

        mvc.perform(put("/api/properties/" + id + "/photos/" + secondPhoto + "/cover").with(csrf()).cookie(session))
                .andExpect(jsonPath("$.photos[1].cover").value(true))
                .andExpect(jsonPath("$.photos[0].cover").value(false));

        mvc.perform(get("/api/properties").cookie(session))
                .andExpect(jsonPath("$.content[0].coverUrl", startsWith("/api/files/")));

        mvc.perform(delete("/api/properties/" + id + "/photos/" + secondPhoto).with(csrf()).cookie(session))
                .andExpect(jsonPath("$.photos", hasSize(1)))
                .andExpect(jsonPath("$.photos[0].cover").value(true)); // a capa passa para a que sobrou

        mvc.perform(delete("/api/properties/" + id).with(csrf()).cookie(session)).andExpect(status().isNoContent());
        mvc.perform(get(url).cookie(session)).andExpect(status().isNotFound());
        mvc.perform(get("/api/properties/" + id).cookie(session)).andExpect(status().isNotFound());
    }

    @Test
    void uploadRejectsFilesThatAreNotImages() throws Exception {
        String id = createProperty("AP-0040", "Santos", "1500");
        // extensão e Content-Type mentem; os bytes não são imagem
        mvc.perform(multipart("/api/properties/" + id + "/photos")
                        .file(new MockMultipartFile("files", "foto.png", "image/png", "<script>alert(1)</script>".getBytes()))
                        .with(csrf()).cookie(session))
                .andExpect(status().isBadRequest());
    }

    String createProperty(String code, String city, String rent) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/properties").with(csrf()).cookie(session)
                        .contentType(MediaType.APPLICATION_JSON).content(TestData.property(ownerId, code, city, rent)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
    }

    protected String createOwner(Cookie session, String cpf) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/owners").with(csrf()).cookie(session)
                        .contentType(MediaType.APPLICATION_JSON).content(TestData.owner(cpf)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
    }
}
