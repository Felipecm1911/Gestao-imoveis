package br.com.gestaoimoveis.properties.api;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import br.com.gestaoimoveis.owners.api.OwnerDtos.OwnerSummary;
import br.com.gestaoimoveis.properties.domain.Property;
import br.com.gestaoimoveis.properties.domain.Property.Status;
import br.com.gestaoimoveis.properties.domain.Property.Type;

public final class PropertyDtos {

    private PropertyDtos() {}

    public record PropertyRequest(
            @NotNull UUID ownerId,
            @NotBlank @Size(max = 20) @Pattern(regexp = "[A-Za-z0-9-]+", message = "Use letras, números e hífen") String code,
            @NotBlank @Size(max = 120) String title,
            @Size(max = 4000) String description,
            @NotNull Type type,
            @NotBlank @Size(max = 120) String street,
            @NotBlank @Size(max = 10) String number,
            @Size(max = 60) String complement,
            @NotBlank @Size(max = 80) String district,
            @NotBlank @Size(max = 80) String city,
            @NotBlank @Pattern(regexp = "[A-Z]{2}", message = "UF com 2 letras maiúsculas") String state,
            @NotBlank @Pattern(regexp = "\\d{8}", message = "CEP com 8 dígitos") String zip,
            @DecimalMin(value = "0.01") @Digits(integer = 8, fraction = 2) BigDecimal areaM2,
            @Min(0) @Max(99) short bedrooms,
            @Min(0) @Max(99) short bathrooms,
            @Min(0) @Max(99) short parking,
            @NotNull @DecimalMin("0.00") @Digits(integer = 12, fraction = 2) BigDecimal suggestedRent,
            Long version) {}

    public record StatusRequest(@NotNull Status status) {}

    public record PhotoResponse(UUID id, String url, int position, boolean cover) {}

    public record PropertyResponse(UUID id, String code, String title, String description, Type type,
            String street, String number, String complement, String district, String city, String state, String zip,
            BigDecimal areaM2, short bedrooms, short bathrooms, short parking, BigDecimal suggestedRent,
            Status status, OwnerSummary owner, List<PhotoResponse> photos, Instant createdAt, Long version) {

        public static PropertyResponse of(Property p, OwnerSummary owner, List<PhotoResponse> photos) {
            return new PropertyResponse(p.getId(), p.getCode(), p.getTitle(), p.getDescription(), p.getType(),
                    p.getStreet(), p.getNumber(), p.getComplement(), p.getDistrict(), p.getCity(), p.getState(),
                    p.getZip(), p.getAreaM2(), p.getBedrooms(), p.getBathrooms(), p.getParking(),
                    p.getSuggestedRent(), p.getStatus(), owner, photos, p.getCreatedAt(), p.getVersion());
        }
    }

    /** Resumo usado por outros módulos (ex.: contrato mostra o imóvel). */
    public record PropertySummary(UUID id, String code, String title) {}

    /** Item da listagem (cards): sem descrição nem galeria, só a capa. */
    public record PropertyListItem(UUID id, String code, String title, Type type, String street, String number,
            String district, String city,
            String state, BigDecimal areaM2, short bedrooms, short bathrooms, short parking,
            BigDecimal suggestedRent, Status status, OwnerSummary owner, String coverUrl) {

        public static PropertyListItem of(Property p, OwnerSummary owner, String coverUrl) {
            return new PropertyListItem(p.getId(), p.getCode(), p.getTitle(), p.getType(), p.getStreet(), p.getNumber(),
                    p.getDistrict(),
                    p.getCity(), p.getState(), p.getAreaM2(), p.getBedrooms(), p.getBathrooms(), p.getParking(),
                    p.getSuggestedRent(), p.getStatus(), owner, coverUrl);
        }
    }
}
