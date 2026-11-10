package br.com.gestaoimoveis.contracts.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import br.com.gestaoimoveis.shared.money.Money;

/**
 * Parcelas de um contrato: uma por mês de ocupação, valor proporcional aos dias ocupados no mês,
 * vencendo no dia combinado do mês seguinte.
 */
public final class InstallmentPlan {

    private InstallmentPlan() {}

    public record Item(LocalDate referenceMonth, LocalDate dueDate, BigDecimal amount) {}

    public static List<Item> generate(LocalDate start, LocalDate end, BigDecimal rent, int dueDay) {
        List<Item> items = new ArrayList<>();
        YearMonth last = YearMonth.from(end);
        for (YearMonth m = YearMonth.from(start); !m.isAfter(last); m = m.plusMonths(1)) {
            items.add(new Item(m.atDay(1), m.plusMonths(1).atDay(dueDay), amount(rent, m, start, end)));
        }
        return items;
    }

    /** Aluguel do mês: cheio se o contrato cobre o mês inteiro, senão aluguel × dias ocupados / dias do mês. */
    public static BigDecimal amount(BigDecimal rent, YearMonth month, LocalDate start, LocalDate end) {
        LocalDate from = start.isAfter(month.atDay(1)) ? start : month.atDay(1);
        LocalDate to = end.isBefore(month.atEndOfMonth()) ? end : month.atEndOfMonth();
        return Money.fraction(rent, ChronoUnit.DAYS.between(from, to) + 1, month.lengthOfMonth());
    }
}
