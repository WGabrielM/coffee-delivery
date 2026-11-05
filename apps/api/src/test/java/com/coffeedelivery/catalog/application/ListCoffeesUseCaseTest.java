package com.coffeedelivery.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.coffeedelivery.catalog.domain.Coffee;
import com.coffeedelivery.catalog.domain.Tag;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ListCoffeesUseCaseTest {

  private static final Tag TRADITIONAL = new Tag("traditional", "Traditional");
  private static final Tag ICED = new Tag("iced", "Iced");

  @Test
  void returnsTheCoffeesOfTheRepositoryInTheirOrder() {
    Coffee espresso =
        new Coffee(UUID.randomUUID(), "espresso", "Espresso", "Strong", 990, List.of(TRADITIONAL));
    Coffee iced =
        new Coffee(
            UUID.randomUUID(),
            "iced-espresso",
            "Iced Espresso",
            "Cold",
            990,
            List.of(TRADITIONAL, ICED));
    ListCoffeesUseCase useCase =
        new ListCoffeesUseCase(new InMemoryCoffeeRepository(List.of(espresso, iced)));

    assertThat(useCase.execute()).containsExactly(espresso, iced);
  }

  @Test
  void returnsAnEmptyListWhenTheCatalogIsEmpty() {
    ListCoffeesUseCase useCase = new ListCoffeesUseCase(new InMemoryCoffeeRepository(List.of()));

    assertThat(useCase.execute()).isEmpty();
  }
}
