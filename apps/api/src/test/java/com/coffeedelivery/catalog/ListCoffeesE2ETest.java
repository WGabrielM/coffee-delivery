package com.coffeedelivery.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import com.coffeedelivery.e2e.ApiClient;
import com.coffeedelivery.e2e.PostgresContainerSupport;
import com.jayway.jsonpath.JsonPath;
import java.net.http.HttpResponse;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

/** GET /api/v1/coffees against the real application and the seeded PostgreSQL. */
@Tag("e2e")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ListCoffeesE2ETest extends PostgresContainerSupport {

  private static final List<String> SLUGS_IN_ORDER =
      List.of(
          "traditional-espresso",
          "american-espresso",
          "creamy-espresso",
          "iced-espresso",
          "coffee-with-milk",
          "latte",
          "cappuccino",
          "macchiato",
          "mochaccino",
          "hot-chocolate",
          "cuban",
          "hawaiian",
          "arabic",
          "irish");

  @Value("${local.server.port}")
  private int port;

  @Test
  void listsTheFourteenCoffeesInPositionOrder() {
    HttpResponse<String> response = new ApiClient(port).get("/api/v1/coffees");

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat(response.headers().firstValue("Content-Type").orElse(""))
        .contains("application/json");
    List<String> slugs = JsonPath.read(response.body(), "$.coffees[*].slug");
    assertThat(slugs).isEqualTo(SLUGS_IN_ORDER);
  }

  @Test
  void everyCoffeeHasAnIdADescriptionAndAPriceInCents() {
    HttpResponse<String> response = new ApiClient(port).get("/api/v1/coffees");

    List<String> ids = JsonPath.read(response.body(), "$.coffees[*].id");
    List<Integer> prices = JsonPath.read(response.body(), "$.coffees[*].priceInCents");
    List<String> descriptions = JsonPath.read(response.body(), "$.coffees[*].description");
    assertThat(ids)
        .hasSize(14)
        .allMatch(id -> id.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"));
    assertThat(prices).hasSize(14).containsOnly(990);
    assertThat(descriptions).hasSize(14).allMatch(description -> !description.isBlank());
  }

  @Test
  void tagsComeInTagPositionOrder() {
    HttpResponse<String> response = new ApiClient(port).get("/api/v1/coffees");

    List<String> cubanSlugs =
        JsonPath.read(response.body(), "$.coffees[?(@.slug=='cuban')].tags[*].slug");
    List<String> cubanNames =
        JsonPath.read(response.body(), "$.coffees[?(@.slug=='cuban')].tags[*].name");
    List<String> hotChocolate =
        JsonPath.read(response.body(), "$.coffees[?(@.slug=='hot-chocolate')].tags[*].slug");
    assertThat(cubanSlugs).containsExactly("special", "alcoholic", "iced");
    assertThat(cubanNames).containsExactly("Special", "Alcoholic", "Iced");
    assertThat(hotChocolate).containsExactly("special", "with-milk");
  }
}
