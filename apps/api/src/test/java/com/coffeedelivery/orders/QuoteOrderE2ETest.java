package com.coffeedelivery.orders;

import static org.assertj.core.api.Assertions.assertThat;

import com.coffeedelivery.e2e.ApiClient;
import com.coffeedelivery.e2e.PostgresContainerSupport;
import com.jayway.jsonpath.JsonPath;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

/** POST /api/v1/orders/quote against the real application and PostgreSQL (spec 039). */
@Tag("e2e")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class QuoteOrderE2ETest extends PostgresContainerSupport {

  private static final String ADDRESS =
      "{\"zipCode\": \"01310-100\", \"street\": \"Paulista Avenue\", \"number\": \"1000\","
          + " \"neighborhood\": \"Bela Vista\", \"city\": \"Sao Paulo\", \"state\": \"SP\"}";

  @Value("${local.server.port}")
  private int port;

  @Autowired private JdbcTemplate jdbc;

  @AfterEach
  void deleteTheOrdersOfTheTest() {
    jdbc.update("DELETE FROM orders");
  }

  private String coffeeId(String slug) {
    return jdbc.queryForObject("SELECT id FROM coffees WHERE slug = ?", String.class, slug);
  }

  /** Latte x 2 and Traditional Espresso x 1: 29.70 plus 3.50 is 33.20. */
  private String sampleItems() {
    return "[{\"coffeeId\": \"%s\", \"quantity\": 2}, {\"coffeeId\": \"%s\", \"quantity\": 1}]"
        .formatted(coffeeId("latte"), coffeeId("traditional-espresso"));
  }

  private HttpResponse<String> quote(String body) {
    return new ApiClient(port).post("/api/v1/orders/quote", body);
  }

  private int orderCount() {
    return jdbc.queryForObject("SELECT count(*) FROM orders", Integer.class);
  }

  @Test
  void theSampleCartIsTwentyNineSeventyPlusThreeFiftyIsThirtyThreeTwenty() {
    HttpResponse<String> response = quote("{\"items\": " + sampleItems() + "}");

    assertThat(response.statusCode()).isEqualTo(200);
    String body = response.body();
    assertThat((Integer) JsonPath.read(body, "$.subtotalInCents")).isEqualTo(2970);
    assertThat((Integer) JsonPath.read(body, "$.deliveryFeeInCents")).isEqualTo(350);
    assertThat((Integer) JsonPath.read(body, "$.totalInCents")).isEqualTo(3320);
    assertThat((String) JsonPath.read(body, "$.currency")).isEqualTo("USD");
    assertThat((List<String>) JsonPath.read(body, "$.items[*].name"))
        .containsExactly("Latte", "Traditional Espresso");
    assertThat((List<Integer>) JsonPath.read(body, "$.items[*].lineTotalInCents"))
        .containsExactly(1980, 990);
  }

  @Test
  void withAZipCodeTheAnswerIsTheSame() {
    String without = quote("{\"items\": " + sampleItems() + "}").body();

    HttpResponse<String> response =
        quote("{\"items\": " + sampleItems() + ", \"zipCode\": \"90250-440\"}");

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat(response.body()).isEqualTo(without);
  }

  @Test
  void anInvalidBodyIsA400WithTheFieldsByPath() {
    HttpResponse<String> response =
        quote("{\"items\": [{\"coffeeId\": \"nope\", \"quantity\": 100}], \"zipCode\": \"1\"}");

    assertThat(response.statusCode()).isEqualTo(400);
    Map<String, String> fields = JsonPath.read(response.body(), "$.error.fields");
    assertThat(fields).containsOnlyKeys("items[0].coffeeId", "items[0].quantity", "zipCode");
  }

  @Test
  void aCoffeeThatIsNotInTheCatalogIsA422NamingTheId() {
    String ghost = UUID.randomUUID().toString();

    HttpResponse<String> response =
        quote("{\"items\": [{\"coffeeId\": \"" + ghost + "\", \"quantity\": 1}]}");

    assertThat(response.statusCode()).isEqualTo(422);
    assertThat((String) JsonPath.read(response.body(), "$.error.fields.items")).contains(ghost);
  }

  @Test
  void aQuoteWritesNoRow() {
    quote("{\"items\": " + sampleItems() + "}");
    quote("{\"items\": " + sampleItems() + ", \"zipCode\": \"01310-100\"}");

    assertThat(orderCount()).isZero();
    assertThat(jdbc.queryForObject("SELECT count(*) FROM order_items", Integer.class)).isZero();
  }

  @Test
  void theQuoteIsEqualToTheOrderThatIsCreatedForTheSameCart() {
    String items = sampleItems();
    HttpResponse<String> quoted = quote("{\"items\": " + items + "}");

    HttpResponse<String> created =
        new ApiClient(port)
            .post(
                "/api/v1/orders",
                "{\"items\": %s, \"address\": %s, \"paymentMethod\": \"cash\"}"
                    .formatted(items, ADDRESS));

    assertThat(created.statusCode()).isEqualTo(201);
    for (String path :
        List.of(
            "$.items",
            "$.subtotalInCents",
            "$.deliveryFeeInCents",
            "$.totalInCents",
            "$.currency")) {
      assertThat(JsonPath.<Object>read(quoted.body(), path))
          .as(path)
          .isEqualTo(JsonPath.read(created.body(), path));
    }
  }
}
