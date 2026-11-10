package com.coffeedelivery.orders;

import static org.assertj.core.api.Assertions.assertThat;

import com.coffeedelivery.e2e.ApiClient;
import com.coffeedelivery.e2e.PostgresContainerSupport;
import com.coffeedelivery.orders.application.OrderRepository;
import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.Order;
import com.coffeedelivery.orders.domain.OrderItem;
import com.coffeedelivery.orders.domain.PaymentMethod;
import com.jayway.jsonpath.JsonPath;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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

/** GET /api/v1/orders/{id} against the real application and PostgreSQL. */
@Tag("e2e")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GetOrderE2ETest extends PostgresContainerSupport {

  private static final String ADDRESS =
      """
      {"zipCode": "01310-100", "street": "Paulista Avenue", "number": "1000",
       "complement": "Apt 12", "neighborhood": "Bela Vista", "city": "Sao Paulo", "state": "SP"}
      """;

  @Value("${local.server.port}")
  private int port;

  @Autowired private JdbcTemplate jdbc;
  @Autowired private OrderRepository orderRepository;

  @AfterEach
  void deleteTheOrdersOfTheTest() {
    jdbc.update("DELETE FROM orders");
  }

  private ApiClient api() {
    return new ApiClient(port);
  }

  private String coffeeId(String slug) {
    return jdbc.queryForObject("SELECT id FROM coffees WHERE slug = ?", String.class, slug);
  }

  private HttpResponse<String> createOrder(String address, String paymentMethod) {
    String body =
        ("{\"items\": [{\"coffeeId\": \"%s\", \"quantity\": 1},"
                + " {\"coffeeId\": \"%s\", \"quantity\": 2}],"
                + " \"address\": %s, \"paymentMethod\": \"%s\"}")
            .formatted(coffeeId("latte"), coffeeId("cuban"), address, paymentMethod);
    HttpResponse<String> response = api().post("/api/v1/orders", body);
    assertThat(response.statusCode()).isEqualTo(201);
    return response;
  }

  private static String idOf(HttpResponse<String> created) {
    return JsonPath.read(created.body(), "$.id");
  }

  @Test
  void theGetBodyIsTheSameAsTheCreateBody() {
    HttpResponse<String> created = createOrder(ADDRESS, "credit_card");

    HttpResponse<String> response = api().get("/api/v1/orders/" + idOf(created));

    assertThat(response.statusCode()).isEqualTo(200);
    assertThat(response.headers().firstValue("Content-Type").orElse(""))
        .contains("application/json");
    Map<String, Object> fromCreate = JsonPath.read(created.body(), "$");
    Map<String, Object> fromGet = JsonPath.read(response.body(), "$");
    assertThat(fromGet).isEqualTo(fromCreate);
    assertThat(fromGet.keySet()).isEqualTo(fromCreate.keySet());
  }

  @Test
  void theOrderComesBackWithItsLinesInTheOrderTheyWereCreated() {
    HttpResponse<String> created = createOrder(ADDRESS, "cash");

    HttpResponse<String> response = api().get("/api/v1/orders/" + idOf(created));

    assertThat((List<String>) JsonPath.read(response.body(), "$.items[*].name"))
        .containsExactly("Latte", "Cuban");
    assertThat((Integer) JsonPath.read(response.body(), "$.totalInCents")).isEqualTo(3320);
    assertThat((String) JsonPath.read(response.body(), "$.paymentMethod")).isEqualTo("cash");
    assertThat((String) JsonPath.read(response.body(), "$.address.complement")).isEqualTo("Apt 12");
  }

  @Test
  void anOrderWithoutAComplementKeepsItNull() {
    String address =
        """
        {"zipCode": "01310-100", "street": "Paulista Avenue", "number": "1000",
         "neighborhood": "Bela Vista", "city": "Sao Paulo", "state": "SP"}
        """;
    HttpResponse<String> created = createOrder(address, "debit_card");

    HttpResponse<String> response = api().get("/api/v1/orders/" + idOf(created));

    Map<String, Object> fromGet = JsonPath.read(response.body(), "$.address");
    assertThat(fromGet).containsEntry("complement", null);
    assertThat((String) JsonPath.read(response.body(), "$.paymentMethod")).isEqualTo("debit_card");
  }

  @Test
  void aLaterCatalogChangeDoesNotAlterAnEarlierOrder() {
    HttpResponse<String> created = createOrder(ADDRESS, "credit_card");
    jdbc.update("UPDATE coffees SET price_in_cents = 1500, name = 'Renamed' WHERE slug = 'latte'");
    try {
      HttpResponse<String> response = api().get("/api/v1/orders/" + idOf(created));

      assertThat((List<Integer>) JsonPath.read(response.body(), "$.items[*].unitPriceInCents"))
          .containsOnly(990);
      assertThat((List<String>) JsonPath.read(response.body(), "$.items[*].name"))
          .containsExactly("Latte", "Cuban");
      assertThat((Integer) JsonPath.read(response.body(), "$.subtotalInCents")).isEqualTo(2970);
      assertThat((Integer) JsonPath.read(response.body(), "$.totalInCents")).isEqualTo(3320);
    } finally {
      jdbc.update("UPDATE coffees SET price_in_cents = 990, name = 'Latte' WHERE slug = 'latte'");
    }
  }

  @Test
  void anIdThatDoesNotExistIsA404InTheErrorShape() {
    HttpResponse<String> response = api().get("/api/v1/orders/" + UUID.randomUUID());

    assertThat(response.statusCode()).isEqualTo(404);
    assertThat((String) JsonPath.read(response.body(), "$.error.code")).isEqualTo("not_found");
    assertThat((String) JsonPath.read(response.body(), "$.error.message")).isNotBlank();
  }

  @Test
  void anIdThatIsNotAUuidIsAlsoA404() {
    for (String bad : List.of("abc", "123", "not-a-uuid")) {
      HttpResponse<String> response = api().get("/api/v1/orders/" + bad);

      assertThat(response.statusCode()).as(bad).isEqualTo(404);
      assertThat((String) JsonPath.read(response.body(), "$.error.code")).isEqualTo("not_found");
    }
  }

  @Test
  void theRepositoryReadsBackExactlyWhatItSaved() {
    Instant createdAt = Instant.now().truncatedTo(ChronoUnit.MICROS);
    for (PaymentMethod method : PaymentMethod.values()) {
      Order saved =
          Order.place(
              UUID.randomUUID(),
              List.of(
                  OrderItem.of(UUID.fromString(coffeeId("irish")), "Irish", 990, 3),
                  OrderItem.of(UUID.fromString(coffeeId("arabic")), "Arabic", 990, 1)),
              new Address(
                  "01310-100", "Paulista Avenue", "1000", null, "Bela Vista", "Sao Paulo", "SP"),
              method,
              createdAt);

      orderRepository.save(saved, null, null);

      assertThat(orderRepository.findById(saved.id())).contains(saved);
    }
  }

  @Test
  void theRepositoryFindsNothingForAnUnknownId() {
    assertThat(orderRepository.findById(UUID.randomUUID())).isEmpty();
  }
}
