package com.coffeedelivery.orders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coffeedelivery.e2e.ApiClient;
import com.coffeedelivery.e2e.CountingDataSourceConfiguration;
import com.coffeedelivery.e2e.PostgresContainerSupport;
import com.coffeedelivery.e2e.StatementCounter;
import com.coffeedelivery.orders.application.OrderRepository;
import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.Order;
import com.coffeedelivery.orders.domain.OrderItem;
import com.coffeedelivery.orders.domain.PaymentMethod;
import com.jayway.jsonpath.JsonPath;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * How many statements and connections saving an order takes, counted on the data source (spec 034):
 * an order is one insert and one batch for all its lines, in one transaction, however many lines.
 */
@Tag("e2e")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(CountingDataSourceConfiguration.class)
class OrderStatementsE2ETest extends PostgresContainerSupport {

  @Value("${local.server.port}")
  private int port;

  @Autowired private JdbcTemplate jdbc;
  @Autowired private OrderRepository orderRepository;
  @Autowired private StatementCounter counter;

  @AfterEach
  void deleteTheOrdersOfTheTest() {
    jdbc.update("DELETE FROM orders");
  }

  private List<UUID> coffeeIds() {
    return jdbc.queryForList("SELECT id FROM coffees ORDER BY position", UUID.class);
  }

  private static Order orderOf(List<UUID> coffees) {
    List<OrderItem> items = new ArrayList<>();
    for (int i = 0; i < coffees.size(); i++) {
      items.add(OrderItem.of(coffees.get(i), "Coffee " + i, 990, i % 3 + 1));
    }
    Address address =
        new Address("01310-100", "Paulista Avenue", "1000", null, "Bela Vista", "Sao Paulo", "SP");
    return Order.place(
        UUID.randomUUID(),
        items,
        address,
        PaymentMethod.CASH,
        Instant.now().truncatedTo(ChronoUnit.MICROS));
  }

  @ParameterizedTest
  @ValueSource(ints = {1, 3, 14})
  void anOrderIsOneInsertAndOneBatchOnOneConnectionHoweverManyLinesItHas(int lines) {
    Order order = orderOf(coffeeIds().subList(0, lines));
    counter.reset();

    boolean saved = orderRepository.save(order, null, null);

    assertThat(saved).isTrue();
    assertThat(counter.statements()).hasSize(2);
    assertThat(counter.statements().get(0)).startsWith("executeUpdate: INSERT INTO orders ");
    assertThat(counter.statements().get(1)).startsWith("executeBatch: INSERT INTO order_items ");
    assertThat(counter.connections()).isEqualTo(1);
    assertThat(orderRepository.findById(order.id())).contains(order);
  }

  @Test
  void theLinesKeepTheOrderTheyWereSentInAndComeBackInThatOrder() {
    List<UUID> reversed = new ArrayList<>(coffeeIds());
    Collections.reverse(reversed);
    Order order = orderOf(reversed);

    orderRepository.save(order, null, null);

    List<UUID> stored =
        orderRepository.findById(order.id()).orElseThrow().items().stream()
            .map(OrderItem::coffeeId)
            .toList();
    assertThat(stored).containsExactlyElementsOf(reversed);
  }

  @Test
  void ifOneLineOfTheBatchFailsNoOrderAndNoLineIsLeft() {
    List<UUID> coffees = new ArrayList<>(coffeeIds().subList(0, 3));
    coffees.set(1, UUID.randomUUID());
    Order order = orderOf(coffees);

    assertThatThrownBy(() -> orderRepository.save(order, null, null))
        .isInstanceOf(DataIntegrityViolationException.class);

    assertThat(jdbc.queryForObject("SELECT count(*) FROM orders", Integer.class)).isZero();
    assertThat(jdbc.queryForObject("SELECT count(*) FROM order_items", Integer.class)).isZero();
  }

  @Test
  void thePriceLookupRunsOutsideTheTransactionOfSave() {
    List<UUID> coffees = coffeeIds();
    String items =
        "[{\"coffeeId\": \"%s\", \"quantity\": 1}, {\"coffeeId\": \"%s\", \"quantity\": 2}]"
            .formatted(coffees.get(0), coffees.get(1));
    String body =
        "{\"items\": %s, \"address\": {\"zipCode\": \"01310-100\", \"street\": \"Paulista Avenue\","
                .formatted(items)
            + " \"number\": \"1000\", \"neighborhood\": \"Bela Vista\", \"city\": \"Sao Paulo\","
            + " \"state\": \"SP\"}, \"paymentMethod\": \"cash\"}";
    counter.reset();

    HttpResponse<String> response = new ApiClient(port).post("/api/v1/orders", body);

    assertThat(response.statusCode()).isEqualTo(201);
    List<String> statements = counter.statements();
    assertThat(statements).hasSize(3);
    assertThat(statements.get(0)).startsWith("executeQuery: SELECT").contains("FROM coffees");
    assertThat(statements.get(1)).startsWith("executeUpdate: INSERT INTO orders ");
    assertThat(statements.get(2)).startsWith("executeBatch: INSERT INTO order_items ");
    // The lookup took its own connection; the insert and the batch share the one of the
    // transaction.
    assertThat(counter.connections()).isEqualTo(2);
    assertThat((String) JsonPath.read(response.body(), "$.id")).isNotBlank();
  }
}
