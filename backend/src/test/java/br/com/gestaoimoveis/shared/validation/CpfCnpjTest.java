package br.com.gestaoimoveis.shared.validation;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class CpfCnpjTest {

    @ParameterizedTest
    @ValueSource(strings = {"529.982.247-25", "52998224725", "11.222.333/0001-81", "11222333000181"})
    void acceptsValidDocuments(String doc) {
        assertThat(CpfCnpj.Validator.isValidDocument(doc)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"529.982.247-24", "111.111.111-11", "11.222.333/0001-80", "123", "", "abc"})
    void rejectsInvalidDocuments(String doc) {
        assertThat(CpfCnpj.Validator.isValidDocument(doc)).isFalse();
    }
}
