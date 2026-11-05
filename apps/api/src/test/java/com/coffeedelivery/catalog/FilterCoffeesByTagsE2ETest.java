package com.coffeedelivery.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import com.coffeedelivery.e2e.ApiClient;
import com.coffeedelivery.e2e.PostgresContainerSupport;
import com.jayway.jsonpath.JsonPath;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

/** GET /api/v1/coffees?tags=... against the seeded PostgreSQL: the filter cases of the design. */
@Tag("e2e")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class FilterCoffeesByTagsE2ETest extends PostgresContainerSupport {

  @Value("${local.server.port}")
  private int port;

  @ParameterizedTest(name = "tags={0} gives {1} coffees")
  @CsvSource({
    "traditional, 9",
    "special, 5",
    "with-milk, 6",
    "alcoholic, 2",
    "iced, 2",
    "'special,alcoholic', 2",
    "'special,iced', 1",
    "'traditional,alcoholic', 0",
    "'special,special', 5",
    "'iced,special', 1"
  })
  void filtersWithAndLogic(String tags, int expectedCount) {
    HttpResponse<String> response = list(tags);

    assertThat(response.statusCode()).isEqualTo(200);
    List<String> slugs = JsonPath.read(response.body(), "$.coffees[*].slug");
    assertThat(slugs).hasSize(expectedCount);
  }

  @Test
  void specialAndAlcoholicAreCubanAndIrishInCatalogOrder() {
    List<String> slugs = JsonPath.read(list("special,alcoholic").body(), "$.coffees[*].slug");

    assertThat(slugs).containsExactly("cuban", "irish");
  }

  @Test
  void specialAndIcedIsCuban() {
    List<String> slugs = JsonPath.read(list("special,iced").body(), "$.coffees[*].slug");

    assertThat(slugs).containsExactly("cuban");
  }

  @Test
  void aFilteredCoffeeStillCarriesAllItsTags() {
    List<String> tags =
        JsonPath.read(list("iced").body(), "$.coffees[?(@.slug=='cuban')].tags[*].slug");

    assertThat(tags).containsExactly("special", "alcoholic", "iced");
  }

  @Test
  void aBlankOrMissingParameterListsAllFourteen() {
    ApiClient client = new ApiClient(port);

    assertThat((List<?>) JsonPath.read(client.get("/api/v1/coffees?tags=").body(), "$.coffees"))
        .hasSize(14);
    assertThat((List<?>) JsonPath.read(client.get("/api/v1/coffees").body(), "$.coffees"))
        .hasSize(14);
  }

  @Test
  void anUnknownSlugIsAValidationFailureNamingIt() {
    HttpResponse<String> response = list("special,hot");

    assertThat(response.statusCode()).isEqualTo(400);
    assertThat((String) JsonPath.read(response.body(), "$.error.code"))
        .isEqualTo("validation_failed");
    Map<String, String> fields = JsonPath.read(response.body(), "$.error.fields");
    assertThat(fields).containsOnlyKeys("tags");
    assertThat(fields.get("tags")).contains("hot");
  }

  @Test
  void slugsAreCaseSensitive() {
    HttpResponse<String> response = list("Special");

    assertThat(response.statusCode()).isEqualTo(400);
    Map<String, String> fields = JsonPath.read(response.body(), "$.error.fields");
    assertThat(fields.get("tags")).contains("Special");
  }

  @Test
  void repeatedParametersAreRejected() {
    HttpResponse<String> response =
        new ApiClient(port).get("/api/v1/coffees?tags=special&tags=iced");

    assertThat(response.statusCode()).isEqualTo(400);
    assertThat((String) JsonPath.read(response.body(), "$.error.code"))
        .isEqualTo("validation_failed");
  }

  private HttpResponse<String> list(String tags) {
    return new ApiClient(port).get("/api/v1/coffees?tags=" + tags);
  }
}
