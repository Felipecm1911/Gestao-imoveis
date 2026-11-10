package br.com.gestaoimoveis.shared.money;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Único lugar onde valores em reais são arredondados. */
public final class Money {

    private Money() {}

    public static BigDecimal of(BigDecimal value) {
        return value == null ? null : value.setScale(2, RoundingMode.HALF_EVEN);
    }

    /** value × part / whole, arredondado uma única vez (ex.: aluguel proporcional aos dias ocupados). */
    public static BigDecimal fraction(BigDecimal value, long part, long whole) {
        return value.multiply(BigDecimal.valueOf(part)).divide(BigDecimal.valueOf(whole), 2, RoundingMode.HALF_EVEN);
    }
}
