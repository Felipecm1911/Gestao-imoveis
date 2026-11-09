package br.com.gestaoimoveis.owners.domain;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Endereço de contato (jsonb). Todos os campos são opcionais. */
public record Address(
        @Size(max = 120) String street,
        @Size(max = 10) String number,
        @Size(max = 60) String complement,
        @Size(max = 80) String district,
        @Size(max = 80) String city,
        @Pattern(regexp = "[A-Z]{2}", message = "UF com 2 letras maiúsculas") String state,
        @Pattern(regexp = "\\d{8}", message = "CEP com 8 dígitos") String zip) {}
