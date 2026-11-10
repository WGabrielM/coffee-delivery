package com.coffeedelivery.orders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

/** POST /api/v1/orders against the real application and PostgreSQL. */
@Tag("e2e")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CreateOrderE2ETest extends PostgresContainerSupport {

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

  private static String order(String items, String address, String paymentMethod) {
    return "{\"items\": %s, \"address\": %s, \"paymentMethod\": \"%s\"}"
        .formatted(items, address, paymentMethod);
  }

  private static final String ADDRESS =
      """
      {"zipCode": "01310-100", "street": "Paulista Avenue", "number": "1000",
       "neighborhood": "Bela Vista", "city": "Sao Paulo", "state": "SP"}
      """;

  private String latteAndTwoCubans() {
    return "[{\"coffeeId\": \"%s\", \"quantity\": 1}, {\"coffeeId\": \"%s\", \"quantity\": 2}]"
        .formatted(coffeeId("latte"), coffeeId("cuban"));
  }

  private int orderCount() {
    return jdbc.queryForObject("SELECT count(*) FROM orders", Integer.class);
  }

  @Test
  void oneCoffeePlusTwoCoffeesPlusTheFeeIsThirtyThreeTwenty() {
    HttpResponse<String> response =
        api().post("/api/v1/orders", order(latteAndTwoCubans(), ADDRESS, "credit_card"));

    assertThat(response.statusCode()).isEqualTo(201);
    String body = response.body();
    String id = JsonPath.read(body, "$.id");
    assertThat(response.headers().firstValue("Location")).contains("/api/v1/orders/" + id);
    assertThat((String) JsonPath.read(body, "$.status")).isEqualTo("confirmed");
    assertThat((Integer) JsonPath.read(body, "$.subtotalInCents")).isEqualTo(2970);
    assertThat((Integer) JsonPath.read(body, "$.deliveryFeeInCents")).isEqualTo(350);
    assertThat((Integer) JsonPath.read(body, "$.totalInCents")).isEqualTo(3320);
    assertThat((String) JsonPath.read(body, "$.currency")).isEqualTo("USD");
    assertThat((Integer) JsonPath.read(body, "$.estimatedDeliveryMinutes.min")).isEqualTo(20);
    assertThat((Integer) JsonPath.read(body, "$.estimatedDeliveryMinutes.max")).isEqualTo(30);
    assertThat((String) JsonPath.read(body, "$.paymentMethod")).isEqualTo("credit_card");
    assertThat((List<String>) JsonPath.read(body, "$.items[*].name"))
        .containsExactly("Latte", "Cuban");
    assertThat((List<Integer>) JsonPath.read(body, "$.items[*].lineTotalInCents"))
        .containsExactly(990, 1980);
    assertThat(Instant.parse(JsonPath.read(body, "$.createdAt")))
        .isBefore(Instant.now().plusSeconds(5));
  }

  @Test
  void theOrderIsStoredWithASnapshotOfTheCatalog() {
    HttpResponse<String> response =
        api().post("/api/v1/orders", order(latteAndTwoCubans(), ADDRESS, "debit_card"));

    UUID id = UUID.fromString(JsonPath.read(response.body(), "$.id"));
    Map<String, Object> stored =
        jdbc.queryForMap(
            """
            SELECT status, payment_method, zip_code, street, number, complement, neighborhood,
                   city, state, subtotal_in_cents, delivery_fee_in_cents, total_in_cents
            FROM orders WHERE id = ?
            """,
            id);
    List<Map<String, Object>> lines =
        jdbc.queryForList(
            """
            SELECT coffee_name, unit_price_in_cents, quantity, line_total_in_cents
            FROM order_items WHERE order_id = ? ORDER BY id
            """,
            id);

    assertThat(stored)
        .containsEntry("status", "confirmed")
        .containsEntry("payment_method", "debit_card")
        .containsEntry("zip_code", "01310-100")
        .containsEntry("complement", null)
        .containsEntry("total_in_cents", 3320);
    assertThat(lines).hasSize(2);
    assertThat(lines.get(0))
        .containsEntry("coffee_name", "Latte")
        .containsEntry("unit_price_in_cents", 990)
        .containsEntry("quantity", 1);
    assertThat(lines.get(1)).containsEntry("coffee_name", "Cuban").containsEntry("quantity", 2);
  }

  @Test
  void pricesSentByTheClientAreIgnoredAndTheStoredPricesComeFromTheCatalog() {
    String items =
        "[{\"coffeeId\": \"%s\", \"quantity\": 1, \"priceInCents\": 1, \"unitPriceInCents\": 1},"
                .formatted(coffeeId("latte"))
            + " {\"coffeeId\": \"%s\", \"quantity\": 2, \"price\": 0.01}]"
                .formatted(coffeeId("cuban"));
    String body =
        "{\"items\": %s, \"address\": %s, \"paymentMethod\": \"cash\", \"totalInCents\": 1,"
                .formatted(items, ADDRESS)
            + " \"subtotalInCents\": 1, \"deliveryFeeInCents\": 0}";

    HttpResponse<String> response = api().post("/api/v1/orders", body);

    assertThat(response.statusCode()).isEqualTo(201);
    assertThat((Integer) JsonPath.read(response.body(), "$.totalInCents")).isEqualTo(3320);
    assertThat((List<Integer>) JsonPath.read(response.body(), "$.items[*].unitPriceInCents"))
        .containsOnly(990);
    assertThat(jdbc.queryForList("SELECT unit_price_in_cents FROM order_items", Integer.class))
        .containsOnly(990);
  }

  @Test
  void aComplementIsStoredTrimmedAndAnAddressIsStoredTrimmed() {
    String address =
        """
        {"zipCode": "01310-100", "street": "  Paulista Avenue ", "number": "1000",
         "complement": "  Apt 12 ", "neighborhood": "Bela Vista", "city": "Sao Paulo", "state": "SP"}
        """;

    HttpResponse<String> response =
        api().post("/api/v1/orders", order(latteAndTwoCubans(), address, "cash"));

    assertThat(response.statusCode()).isEqualTo(201);
    assertThat((String) JsonPath.read(response.body(), "$.address.complement")).isEqualTo("Apt 12");
    assertThat((String) JsonPath.read(response.body(), "$.address.street"))
        .isEqualTo("Paulista Avenue");
  }

  @Test
  void invalidFieldsAreA400AndNothingIsStored() {
    String items = "[{\"coffeeId\": \"nope\", \"quantity\": 100}]";
    String address =
        "{\"zipCode\": \"123\", \"street\": \" \", \"number\": \"1\","
            + " \"neighborhood\": \"N\", \"city\": \"C\", \"state\": \"sp\"}";

    HttpResponse<String> response = api().post("/api/v1/orders", order(items, address, "bitcoin"));

    assertThat(response.statusCode()).isEqualTo(400);
    assertThat((String) JsonPath.read(response.body(), "$.error.code"))
        .isEqualTo("validation_failed");
    Map<String, String> fields = JsonPath.read(response.body(), "$.error.fields");
    assertThat(fields)
        .containsOnlyKeys(
            "items[0].coffeeId",
            "items[0].quantity",
            "address.zipCode",
            "address.street",
            "address.state",
            "paymentMethod");
    assertThat(orderCount()).isZero();
  }

  @Test
  void theSameCoffeeTwiceIsA400InItems() {
    String id = coffeeId("latte");
    String items =
        "[{\"coffeeId\": \"%s\", \"quantity\": 1}, {\"coffeeId\": \"%s\", \"quantity\": 2}]"
            .formatted(id, id);

    HttpResponse<String> response = api().post("/api/v1/orders", order(items, ADDRESS, "cash"));

    assertThat(response.statusCode()).isEqualTo(400);
    Map<String, String> fields = JsonPath.read(response.body(), "$.error.fields");
    assertThat(fields).containsOnlyKeys("items");
  }

  @Test
  void aQuantityThatIsNotAnIntegerIsA400AtItsPath() {
    String items =
        "[{\"coffeeId\": \"%s\", \"quantity\": 1.5}, {\"coffeeId\": \"%s\", \"quantity\": \"2\"}]"
            .formatted(coffeeId("latte"), coffeeId("cuban"));

    HttpResponse<String> response = api().post("/api/v1/orders", order(items, ADDRESS, "cash"));

    assertThat(response.statusCode()).isEqualTo(400);
    Map<String, String> fields = JsonPath.read(response.body(), "$.error.fields");
    assertThat(fields).containsOnlyKeys("items[0].quantity", "items[1].quantity");
  }

  @Test
  void aValueOfTheWrongJsonTypeIsA400WithItsPath() {
    String body =
        "{\"items\": \"not a list\", \"address\": %s, \"paymentMethod\": \"cash\"}"
            .formatted(ADDRESS);

    HttpResponse<String> response = api().post("/api/v1/orders", body);

    assertThat(response.statusCode()).isEqualTo(400);
    Map<String, String> fields = JsonPath.read(response.body(), "$.error.fields");
    assertThat(fields).containsKey("items");
  }

  @Test
  void aCoffeeThatIsNotInTheCatalogIsA422NamingTheId() {
    String ghost = UUID.randomUUID().toString();
    String items =
        "[{\"coffeeId\": \"%s\", \"quantity\": 1}, {\"coffeeId\": \"%s\", \"quantity\": 1}]"
            .formatted(coffeeId("latte"), ghost);

    HttpResponse<String> response = api().post("/api/v1/orders", order(items, ADDRESS, "cash"));

    assertThat(response.statusCode()).isEqualTo(422);
    assertThat((String) JsonPath.read(response.body(), "$.error.code"))
        .isEqualTo("unprocessable_content");
    assertThat((String) JsonPath.read(response.body(), "$.error.fields.items")).contains(ghost);
    assertThat(orderCount()).isZero();
  }

  @Test
  void ifSavingALineFailsNoOrderRowIsStored() {
    Address address =
        new Address("01310-100", "Paulista Avenue", "1000", null, "Bela Vista", "Sao Paulo", "SP");
    Order order =
        Order.place(
            UUID.randomUUID(),
            List.of(
                OrderItem.of(UUID.fromString(coffeeId("latte")), "Latte", 990, 1),
                OrderItem.of(UUID.randomUUID(), "A coffee that does not exist", 990, 1)),
            address,
            PaymentMethod.CASH,
            Instant.now());

    assertThatThrownBy(() -> orderRepository.save(order, null, null))
        .isInstanceOf(DataIntegrityViolationException.class);

    assertThat(orderCount()).isZero();
    assertThat(jdbc.queryForObject("SELECT count(*) FROM order_items", Integer.class)).isZero();
  }

  private HttpResponse<String> postWithKey(UUID key, String body) {
    return api().post("/api/v1/orders", body, Map.of("Idempotency-Key", key.toString()));
  }

  @Test
  void theSameKeyAndRequestAnswers201ThenTheSameOrderWith200AndStoresOneOrder() {
    UUID key = UUID.randomUUID();
    String body = order(latteAndTwoCubans(), ADDRESS, "credit_card");

    HttpResponse<String> first = postWithKey(key, body);
    HttpResponse<String> second = postWithKey(key, body);

    assertThat(first.statusCode()).isEqualTo(201);
    assertThat(second.statusCode()).isEqualTo(200);
    assertThat(second.body()).isEqualTo(first.body());
    assertThat(second.headers().firstValue("Location"))
        .isEqualTo(first.headers().firstValue("Location"));
    assertThat(orderCount()).isEqualTo(1);
    assertThat(jdbc.queryForObject("SELECT count(*) FROM order_items", Integer.class)).isEqualTo(2);
  }

  @Test
  void theSameKeyWithAnotherRequestIs422OnTheKeyAndStoresNothingMore() {
    UUID key = UUID.randomUUID();
    postWithKey(key, order(latteAndTwoCubans(), ADDRESS, "credit_card"));

    HttpResponse<String> response = postWithKey(key, order(latteAndTwoCubans(), ADDRESS, "cash"));

    assertThat(response.statusCode()).isEqualTo(422);
    Map<String, String> fields = JsonPath.read(response.body(), "$.error.fields");
    assertThat(fields).containsOnlyKeys("Idempotency-Key");
    assertThat(orderCount()).isEqualTo(1);
  }

  @Test
  void aKeyThatIsNotAUuidIsA400OnTheKeyAndStoresNothing() {
    HttpResponse<String> response =
        api()
            .post(
                "/api/v1/orders",
                order(latteAndTwoCubans(), ADDRESS, "cash"),
                Map.of("Idempotency-Key", "not-a-uuid"));

    assertThat(response.statusCode()).isEqualTo(400);
    Map<String, String> fields = JsonPath.read(response.body(), "$.error.fields");
    assertThat(fields).containsOnlyKeys("Idempotency-Key");
    assertThat(orderCount()).isZero();
  }

  @Test
  void aRefusedRequestDoesNotUseUpTheKey() {
    UUID key = UUID.randomUUID();
    String ghost = "[{\"coffeeId\": \"%s\", \"quantity\": 1}]".formatted(UUID.randomUUID());
    assertThat(postWithKey(key, order(ghost, ADDRESS, "cash")).statusCode()).isEqualTo(422);

    HttpResponse<String> response = postWithKey(key, order(latteAndTwoCubans(), ADDRESS, "cash"));

    assertThat(response.statusCode()).isEqualTo(201);
    assertThat(orderCount()).isEqualTo(1);
  }

  @Test
  void requestsWithoutAKeyAlwaysCreateAnOrder() {
    String body = order(latteAndTwoCubans(), ADDRESS, "cash");

    assertThat(api().post("/api/v1/orders", body).statusCode()).isEqualTo(201);
    assertThat(api().post("/api/v1/orders", body).statusCode()).isEqualTo(201);

    assertThat(orderCount()).isEqualTo(2);
  }

  @Test
  void parallelRequestsWithTheSameKeyStoreExactlyOneOrder() throws Exception {
    UUID key = UUID.randomUUID();
    String body = order(latteAndTwoCubans(), ADDRESS, "cash");
    int requests = 8;
    CountDownLatch start = new CountDownLatch(1);
    ExecutorService pool = Executors.newFixedThreadPool(requests);
    try {
      List<Future<HttpResponse<String>>> answers = new ArrayList<>();
      for (int i = 0; i < requests; i++) {
        answers.add(
            pool.submit(
                () -> {
                  start.await();
                  return postWithKey(key, body);
                }));
      }
      start.countDown();
      List<Integer> statuses = new ArrayList<>();
      Set<String> ids = new HashSet<>();
      for (Future<HttpResponse<String>> answer : answers) {
        HttpResponse<String> response = answer.get(30, TimeUnit.SECONDS);
        statuses.add(response.statusCode());
        ids.add(JsonPath.read(response.body(), "$.id"));
      }

      assertThat(statuses.stream().filter(status -> status == 201)).hasSize(1);
      assertThat(statuses.stream().filter(status -> status == 200)).hasSize(requests - 1);
      assertThat(ids).hasSize(1);
      assertThat(orderCount()).isEqualTo(1);
    } finally {
      pool.shutdownNow();
    }
  }

  @Test
  void aBodyThatIsNotJsonIsA400() {
    HttpResponse<String> response = api().post("/api/v1/orders", "{not json");

    assertThat(response.statusCode()).isEqualTo(400);
    Map<String, String> fields = JsonPath.read(response.body(), "$.error.fields");
    assertThat(fields).containsKey("body");
  }

  @Test
  void anotherMethodIsA405() {
    HttpResponse<String> response = api().get("/api/v1/orders");

    assertThat(response.statusCode()).isEqualTo(405);
    assertThat((String) JsonPath.read(response.body(), "$.error.code"))
        .isEqualTo("method_not_allowed");
  }
}
