package br.com.gestaoimoveis;

/** Corpos JSON válidos para os testes. CPFs com dígitos verificadores corretos. */
public final class TestData {

    private TestData() {}

    public static final String[] CPFS = {"52998224725", "11144477735", "39053344705", "15350946056", "07068093868"};

    public static String owner(String cpf) {
        return """
                {"name":"Maria Proprietária","document":"%s","email":"maria@exemplo.com","phone":"11987654321",
                 "address":{"city":"São Paulo","state":"SP","zip":"01310100"},"bankInfo":"PIX maria@exemplo.com"}"""
                .formatted(cpf);
    }

    public static String property(String ownerId, String code, String city, String rent) {
        return """
                {"ownerId":"%s","code":"%s","title":"Apartamento Centro","type":"APARTAMENTO",
                 "street":"Rua Augusta","number":"100","district":"Consolação","city":"%s","state":"SP",
                 "zip":"01305000","areaM2":65.5,"bedrooms":2,"bathrooms":1,"parking":1,"suggestedRent":%s}"""
                .formatted(ownerId, code, city, rent);
    }

    public static String tenant(String cpf) {
        return """
                {"name":"João Inquilino","document":"%s","email":"joao@exemplo.com","phone":"11912345678",
                 "address":{"city":"São Paulo","state":"SP","zip":"01310100"}}""".formatted(cpf);
    }

    /** Rascunho de contrato: aluguel de 3100,00 com vencimento no dia 10. */
    public static String contract(String propertyId, String tenantId, String start, String end) {
        return """
                {"propertyId":"%s","tenantId":"%s","startDate":"%s","endDate":"%s","monthlyRent":3100.00,
                 "dueDay":10,"adjustmentIndex":"IGPM","guaranteeType":"CAUCAO","guaranteeValue":9300,
                 "notes":"Contrato de teste"}""".formatted(propertyId, tenantId, start, end);
    }

    /** Menor PNG válido (1x1). */
    public static final byte[] PNG = java.util.Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
}
