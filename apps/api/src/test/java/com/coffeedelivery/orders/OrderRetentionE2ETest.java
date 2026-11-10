package com.coffeedelivery.orders;

import static org.assertj.core.api.Assertions.assertThat;

import com.coffeedelivery.e2e.ApiClient;
import com.coffeedelivery.e2e.PostgresContainerSupport;
import com.coffeedelivery.orders.infrastructure.ClearOldAddressesJob;
import com.jayway.jsonpath.JsonPath;
import io.micrometer.core.instrument.MeterRegistry;
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
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;

/** The retention of the address of an order, on the real application and PostgreSQL (spec 038). */
@Tag("e2e")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderRetentionE2ETest extends PostgresContainerSupport {

  private static final String ADDRESS =
      "{\"zipCode\": \"01310-100\", \"street\": \"Paulista Avenue\", \"number\": \"1000\","
          + " \"complement\": \"Apt 12\", \"neighborhood\": \"Bela Vista\","
          + " \"city\": \"Sao Paulo\", \"state\": \"SP\"}";

  @Value("${local.server.port}")
  private int port;

  @Autowired private JdbcTemplate jdbc;
  @Autowired private ClearOldAddressesJob job;
  @Autowired private MeterRegistry registry;
  @Autowired private Environment environment;

  @AfterEach
  void deleteTheOrdersOfTheTest() {
    jdbc.update("DELETE FROM orders");
  }

  private String createOrder() {
    String coffee =
        jdbc.queryForObject("SELECT id FROM coffees WHERE slug = 'latte'", String.class);
    String body =
        "{\"items\": [{\"coffeeId\": \"%s\", \"quantity\": 2}], \"address\": %s,"
                .formatted(coffee, ADDRESS)
            + " \"paymentMethod\": \"credit_card\"}";
    HttpResponse<String> response = new ApiClient(port).post("/api/v1/orders", body);
    assertThat(response.statusCode()).isEqualTo(201);
    return JsonPath.read(response.body(), "$.id");
  }

  private void age(String id, int days) {
    jdbc.update(
        "UPDATE orders SET created_at = now() - make_interval(days => ?) WHERE id = ?",
        days,
        UUID.fromString(id));
  }

  private double cleared() {
    return registry.counter("orders.addresses.cleared").count();
  }

  @Test
  void theJobClearsTheAddressOfAnOrderOf91DaysAndKeepsAnOrderOf89() {
    String old = createOrder();
    String young = createOrder();
    age(old, 91);
    age(young, 89);
    double before = cleared();

    job.run();

    assertThat(cleared() - before).isEqualTo(1);
    Map<String, Object> row =
        jdbc.queryForMap(
            "SELECT zip_code, street, number, complement, neighborhood, city, state,"
                + " address_cleared_at FROM orders WHERE id = ?",
            UUID.fromString(old));
    assertThat(row.get("address_cleared_at")).isNotNull();
    for (String column :
        List.of("zip_code", "street", "number", "complement", "neighborhood", "city", "state")) {
      assertThat(row.get(column)).as(column).isNull();
    }
    assertThat(
            jdbc.queryForObject(
                "SELECT address_cleared_at FROM orders WHERE id = ?",
                Object.class,
                UUID.fromString(young)))
        .isNull();
  }

  @Test
  void aSecondRunClearsNothingMore() {
    String old = createOrder();
    age(old, 120);
    job.run();
    double afterFirst = cleared();
    Object clearedAt =
        jdbc.queryForObject(
            "SELECT address_cleared_at FROM orders WHERE id = ?",
            Object.class,
            UUID.fromString(old));

    job.run();

    assertThat(cleared()).isEqualTo(afterFirst);
    assertThat(
            jdbc.queryForObject(
                "SELECT address_cleared_at FROM orders WHERE id = ?",
                Object.class,
                UUID.fromString(old)))
        .isEqualTo(clearedAt);
  }

  @Test
  void theGetOfAClearedOrderAnswers200WithANullAddressAndEverythingElseAsBefore() {
    String id = createOrder();
    String before = new ApiClient(port).get("/api/v1/orders/" + id).body();
    age(id, 100);
    job.run();

    HttpResponse<String> response = new ApiClient(port).get("/api/v1/orders/" + id);

    assertThat(response.statusCode()).isEqualTo(200);
    String body = response.body();
    assertThat(JsonPath.<Object>read(body, "$.address")).isNull();
    assertThat((Integer) JsonPath.read(body, "$.addressRetentionDays")).isEqualTo(90);
    for (String path :
        List.of(
            "$.id",
            "$.status",
            "$.items",
            "$.paymentMethod",
            "$.subtotalInCents",
            "$.deliveryFeeInCents",
            "$.totalInCents",
            "$.currency",
            "$.estimatedDeliveryMinutes")) {
      assertThat(JsonPath.<Object>read(body, path)).as(path).isEqualTo(JsonPath.read(before, path));
    }
    // The test moved created_at back to age the order, so the date is the aged one: it stays in the
    // row.
    assertThat(JsonPath.<String>read(body, "$.createdAt")).isNotBlank();
    assertThat(jdbc.queryForObject("SELECT count(*) FROM order_items", Integer.class)).isEqualTo(1);
  }

  @Test
  void theDaysAndTheScheduleComeFromTheSettingsWithTheDefaults() throws Exception {
    assertThat(environment.getProperty("orders.retention.days", Integer.class)).isEqualTo(90);
    assertThat(environment.getProperty("orders.retention.cron")).isEqualTo("0 0 3 * * *");
    Scheduled scheduled =
        ClearOldAddressesJob.class.getMethod("run").getAnnotation(Scheduled.class);
    assertThat(scheduled.cron()).isEqualTo("${orders.retention.cron}");
  }
}
