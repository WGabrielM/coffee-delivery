package com.coffeedelivery.catalog.application;

import static com.coffeedelivery.catalog.application.CatalogFixtures.CUBAN;
import static com.coffeedelivery.catalog.application.CatalogFixtures.ESPRESSO;
import static com.coffeedelivery.catalog.application.CatalogFixtures.ICED_ESPRESSO;
import static com.coffeedelivery.catalog.application.CatalogFixtures.IRISH;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coffeedelivery.shared.error.ValidationFailedException;
import java.util.List;
import org.junit.jupiter.api.Test;

class ListCoffeesUseCaseTest {

  private final ListCoffeesUseCase useCase =
      new ListCoffeesUseCase(new InMemoryCoffeeRepository(CatalogFixtures.catalog()));

  @Test
  void returnsTheCoffeesOfTheRepositoryInTheirOrder() {
    assertThat(useCase.execute(List.of())).containsExactly(ESPRESSO, ICED_ESPRESSO, CUBAN, IRISH);
  }

  @Test
  void returnsAnEmptyListWhenTheCatalogIsEmpty() {
    ListCoffeesUseCase empty = new ListCoffeesUseCase(new InMemoryCoffeeRepository(List.of()));

    assertThat(empty.execute(List.of())).isEmpty();
  }

  @Test
  void aSingleTagKeepsTheCoffeesThatHaveIt() {
    assertThat(useCase.execute(List.of("special"))).containsExactly(CUBAN, IRISH);
    assertThat(useCase.execute(List.of("traditional"))).containsExactly(ESPRESSO, ICED_ESPRESSO);
  }

  @Test
  void severalTagsKeepOnlyTheCoffeesThatHaveAllOfThem() {
    assertThat(useCase.execute(List.of("special", "alcoholic"))).containsExactly(CUBAN, IRISH);
    assertThat(useCase.execute(List.of("special", "iced"))).containsExactly(CUBAN);
  }

  @Test
  void tagsNoCoffeeHasTogetherGiveAnEmptyList() {
    assertThat(useCase.execute(List.of("traditional", "alcoholic"))).isEmpty();
  }

  @Test
  void aRepeatedTagCountsOnce() {
    assertThat(useCase.execute(List.of("special", "special", "iced"))).containsExactly(CUBAN);
  }

  @Test
  void anUnknownTagIsAValidationFailureNamingIt() {
    assertThatThrownBy(() -> useCase.execute(List.of("special", "hot")))
        .isInstanceOfSatisfying(
            ValidationFailedException.class,
            exception -> {
              assertThat(exception.fields()).containsOnlyKeys("tags");
              assertThat(exception.fields().get("tags")).startsWith("Unknown tag: hot.");
            });
  }

  @Test
  void tagSlugsAreCaseSensitive() {
    assertThatThrownBy(() -> useCase.execute(List.of("Special")))
        .isInstanceOfSatisfying(
            ValidationFailedException.class,
            exception -> assertThat(exception.fields().get("tags")).contains("Special"));
  }

  @Test
  void theMessageListsTheTagsThatExist() {
    assertThatThrownBy(() -> useCase.execute(List.of("hot")))
        .isInstanceOfSatisfying(
            ValidationFailedException.class,
            exception ->
                assertThat(exception.fields().get("tags"))
                    .contains("traditional", "special", "alcoholic", "iced"));
  }
}
