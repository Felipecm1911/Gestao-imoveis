package br.com.gestaoimoveis.shared.validation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

/** CPF (11 dígitos) ou CNPJ (14 dígitos) com dígitos verificadores válidos. Aceita pontuação. */
@Target({ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = CpfCnpj.Validator.class)
public @interface CpfCnpj {

    String message() default "CPF ou CNPJ inválido";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<CpfCnpj, String> {
        @Override
        public boolean isValid(String value, ConstraintValidatorContext ctx) {
            return value == null || isValidDocument(value); // obrigatoriedade fica com @NotBlank
        }

        static String digits(String value) {
            return value.replaceAll("\\D", "");
        }

        public static boolean isValidDocument(String value) {
            String d = digits(value);
            if (d.chars().distinct().count() == 1) return false; // 000.000.000-00 e afins
            return switch (d.length()) {
                case 11 -> checkDigit(d, 9, new int[] {10, 9, 8, 7, 6, 5, 4, 3, 2})
                        && checkDigit(d, 10, new int[] {11, 10, 9, 8, 7, 6, 5, 4, 3, 2});
                case 14 -> checkDigit(d, 12, new int[] {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2})
                        && checkDigit(d, 13, new int[] {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2});
                default -> false;
            };
        }

        private static boolean checkDigit(String d, int position, int[] weights) {
            int sum = 0;
            for (int i = 0; i < weights.length; i++) sum += (d.charAt(i) - '0') * weights[i];
            int mod = sum % 11;
            int expected = mod < 2 ? 0 : 11 - mod;
            return d.charAt(position) - '0' == expected;
        }
    }
}
