package br.com.gestaoimoveis.contracts;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

import br.com.gestaoimoveis.contracts.domain.InstallmentPlan;
import br.com.gestaoimoveis.contracts.domain.InstallmentPlan.Item;

class InstallmentPlanTest {

    /** Exemplo do plano: 15/01 a 14/01 do ano seguinte, vencimento no dia 10. */
    @Test
    void contractFromMidJanuaryToMidJanuaryHasThirteenInstallments() {
        List<Item> plan = InstallmentPlan.generate(LocalDate.of(2026, 1, 15), LocalDate.of(2027, 1, 14),
                new BigDecimal("3100.00"), 10);

        assertThat(plan).hasSize(13);
        // janeiro: 17 dos 31 dias, vence em 10/02
        assertThat(plan.getFirst()).isEqualTo(new Item(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 10), new BigDecimal("1700.00")));
        // meses cheios pagam o aluguel inteiro
        assertThat(plan.subList(1, 12)).allSatisfy(i -> assertThat(i.amount()).isEqualByComparingTo("3100.00"));
        // último mês: 14 dos 31 dias, vence em 10/02 do ano seguinte
        assertThat(plan.getLast()).isEqualTo(new Item(LocalDate.of(2027, 1, 1), LocalDate.of(2027, 2, 10), new BigDecimal("1400.00")));
    }

    @Test
    void proportionalAmountRoundsHalfEvenToCents() {
        // 1000 × 10 / 30 = 333,333… → 333,33
        List<Item> plan = InstallmentPlan.generate(LocalDate.of(2026, 4, 21), LocalDate.of(2026, 5, 31),
                new BigDecimal("1000.00"), 5);

        assertThat(plan).extracting(Item::amount).containsExactly(new BigDecimal("333.33"), new BigDecimal("1000.00"));
        assertThat(plan).extracting(Item::dueDate).containsExactly(LocalDate.of(2026, 5, 5), LocalDate.of(2026, 6, 5));
    }
}
