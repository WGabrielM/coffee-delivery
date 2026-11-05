package com.coffeedelivery.orders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coffeedelivery.e2e.PostgresContainerSupport;
import com.coffeedelivery.orders.domain.PaymentMethod;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * The orders migration, checked with plain SQL against a real PostgreSQL: one assertion per rule.
 */
@Tag("e2e")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrdersMigrationE2ETest extends PostgresContainerSupport {

  @Autowired private JdbcTemplate jdbc;

  @AfterEach
  void deleteTheOrdersOfTheTest() {
    jdbc.update("DELETE FROM orders");
  }

  @Test
  void ordersHasTheColumnsOfTheSpec() {
    assertThat(columns("orders"))
        .containsExactlyInAnyOrder(
            "id",
            "status",
            "payment_method",
            "zip_code",
            "street",
            "number",
            "complement",
            "neighborhood",
            "city",
            "state",
            "subtotal_in_cents",
            "delivery_fee_in_cents",
            "total_in_cents",
            "created_at");
  }

  @Test
  void orderItemsHasTheColumnsOfTheSpec() {
    assertThat(columns("order_items"))
        .containsExactlyInAnyOrder(
            "id",
            "order_id",
            "coffee_id",
            "coffee_name",
            "unit_price_in_cents",
            "quantity",
            "line_total_in_cents");
  }

  @Test
  void complementIsTheOnlyNullableColumnOfOrders() {
    List<String> nullable =
        jdbc.queryForList(
            """
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'orders' AND is_nullable = 'YES'
            """,
            String.class);

    assertThat(nullable).containsExactly("complement");
  }

  @Test
  void createdAtIsATimestampWithTimeZoneThatDefaultsToNow() {
    String type =
        jdbc.queryForObject(
            """
            SELECT data_type FROM information_schema.columns
            WHERE table_name = 'orders' AND column_name = 'created_at'
            """,
            String.class);
    UUID id = insertOrder(2970, 350, 3320);
    OffsetDateTime createdAt =
        jdbc.queryForObject("SELECT created_at FROM orders WHERE id = ?", OffsetDateTime.class, id);

    assertThat(type).isEqualTo("timestamp with time zone");
    assertThat(createdAt).isNotNull().isBeforeOrEqualTo(OffsetDateTime.now().plusSeconds(5));
    assertThat(createdAt).isAfter(OffsetDateTime.now().minusMinutes(1));
  }

  @Test
  void aValidOrderWithTwoLinesIsStoredAndReadBackWithTheSameValues() {
    UUID orderId = UUID.randomUUID();
    insertOrder(orderId, "confirmed", "credit_card", "SP", 2970, 350, 3320);
    insertItem(orderId, coffeeId("latte"), "Latte", 990, 1, 990);
    insertItem(orderId, coffeeId("cuban"), "Cuban", 990, 2, 1980);

    Map<String, Object> order =
        jdbc.queryForMap(
            """
            SELECT status, payment_method, zip_code, street, number, complement, neighborhood,
                   city, state, subtotal_in_cents, delivery_fee_in_cents, total_in_cents
            FROM orders WHERE id = ?
            """,
            orderId);
    List<Map<String, Object>> lines =
        jdbc.queryForList(
            """
            SELECT coffee_name, unit_price_in_cents, quantity, line_total_in_cents
            FROM order_items WHERE order_id = ? ORDER BY id
            """,
            orderId);

    assertThat(order)
        .containsEntry("status", "confirmed")
        .containsEntry("payment_method", "credit_card")
        .containsEntry("zip_code", "01310-100")
        .containsEntry("street", "Paulista Avenue")
        .containsEntry("number", "1000")
        .containsEntry("complement", null)
        .containsEntry("neighborhood", "Bela Vista")
        .containsEntry("city", "Sao Paulo")
        .containsEntry("state", "SP")
        .containsEntry("subtotal_in_cents", 2970)
        .containsEntry("delivery_fee_in_cents", 350)
        .containsEntry("total_in_cents", 3320);
    assertThat(lines).hasSize(2);
    assertThat(lines.get(0))
        .containsEntry("coffee_name", "Latte")
        .containsEntry("unit_price_in_cents", 990)
        .containsEntry("quantity", 1)
        .containsEntry("line_total_in_cents", 990);
    assertThat(lines.get(1))
        .containsEntry("coffee_name", "Cuban")
        .containsEntry("quantity", 2)
        .containsEntry("line_total_in_cents", 1980);
  }

  @Test
  void theLinesOfAnOrderComeBackInTheOrderTheyWereInserted() {
    UUID orderId = insertOrder(2970, 350, 3320);
    insertItem(orderId, coffeeId("irish"), "Irish", 990, 1, 990);
    insertItem(orderId, coffeeId("arabic"), "Arabic", 990, 1, 990);
    insertItem(orderId, coffeeId("cuban"), "Cuban", 990, 1, 990);

    List<String> names =
        jdbc.queryForList(
            "SELECT coffee_name FROM order_items WHERE order_id = ? ORDER BY id",
            String.class,
            orderId);

    assertThat(names).containsExactly("Irish", "Arabic", "Cuban");
  }

  @Test
  void aStatusOtherThanConfirmedIsRejected() {
    assertRejected(() -> insertOrder(UUID.randomUUID(), "pending", "cash", "SP", 990, 350, 1340));
  }

  @Test
  void aPaymentMethodOutsideTheThreeIsRejected() {
    assertRejected(
        () -> insertOrder(UUID.randomUUID(), "confirmed", "bitcoin", "SP", 990, 350, 1340));
  }

  @Test
  void everyPaymentMethodOfTheDomainIsAccepted() {
    for (PaymentMethod method : PaymentMethod.values()) {
      insertOrder(UUID.randomUUID(), "confirmed", method.value(), "SP", 990, 350, 1340);
    }

    assertThat(jdbc.queryForObject("SELECT count(*) FROM orders", Integer.class))
        .isEqualTo(PaymentMethod.values().length);
  }

  @Test
  void aStateThatIsNotTwoUppercaseLettersIsRejected() {
    for (String state : List.of("sp", "SPA", "S", "S1", "", "Sp")) {
      assertRejected(
          () -> insertOrder(UUID.randomUUID(), "confirmed", "cash", state, 990, 350, 1340));
    }
  }

  @Test
  void aNegativeDeliveryFeeIsRejected() {
    assertRejected(() -> insertOrder(UUID.randomUUID(), "confirmed", "cash", "SP", 990, -1, 989));
  }

  @Test
  void aNegativeSubtotalIsRejected() {
    assertRejected(() -> insertOrder(UUID.randomUUID(), "confirmed", "cash", "SP", -1, 350, 349));
  }

  @Test
  void aTotalThatIsNotTheSubtotalPlusTheFeeIsRejected() {
    assertRejected(() -> insertOrder(UUID.randomUUID(), "confirmed", "cash", "SP", 990, 350, 1339));
    assertRejected(() -> insertOrder(UUID.randomUUID(), "confirmed", "cash", "SP", 990, 350, 1341));
  }

  @Test
  void aQuantityBelowOneOrAboveNinetyNineIsRejected() {
    UUID orderId = insertOrder(990, 350, 1340);

    assertRejected(() -> insertItem(orderId, coffeeId("latte"), "Latte", 990, 0, 0));
    assertRejected(() -> insertItem(orderId, coffeeId("latte"), "Latte", 990, -1, -990));
    assertRejected(() -> insertItem(orderId, coffeeId("latte"), "Latte", 990, 100, 99000));
  }

  @Test
  void theQuantityLimitsOneAndNinetyNineAreAccepted() {
    UUID orderId = insertOrder(990, 350, 1340);

    insertItem(orderId, coffeeId("latte"), "Latte", 990, 1, 990);
    insertItem(orderId, coffeeId("cuban"), "Cuban", 990, 99, 98010);

    assertThat(
            jdbc.queryForObject(
                "SELECT count(*) FROM order_items WHERE order_id = ?", Integer.class, orderId))
        .isEqualTo(2);
  }

  @Test
  void aNegativeUnitPriceIsRejected() {
    UUID orderId = insertOrder(990, 350, 1340);

    assertRejected(() -> insertItem(orderId, coffeeId("latte"), "Latte", -990, 1, -990));
  }

  @Test
  void aLineTotalThatIsNotTheUnitPriceTimesTheQuantityIsRejected() {
    UUID orderId = insertOrder(990, 350, 1340);

    assertRejected(() -> insertItem(orderId, coffeeId("latte"), "Latte", 990, 2, 990));
  }

  @Test
  void twoLinesWithTheSameCoffeeInOneOrderAreRejected() {
    UUID orderId = insertOrder(1980, 350, 2330);
    insertItem(orderId, coffeeId("latte"), "Latte", 990, 1, 990);

    assertRejected(() -> insertItem(orderId, coffeeId("latte"), "Latte", 990, 1, 990));
  }

  @Test
  void theSameCoffeeCanBeInDifferentOrders() {
    UUID first = insertOrder(990, 350, 1340);
    UUID second = insertOrder(990, 350, 1340);

    insertItem(first, coffeeId("latte"), "Latte", 990, 1, 990);
    insertItem(second, coffeeId("latte"), "Latte", 990, 1, 990);

    assertThat(jdbc.queryForObject("SELECT count(*) FROM order_items", Integer.class)).isEqualTo(2);
  }

  @Test
  void aLineMustPointToAnExistingOrderAndAnExistingCoffee() {
    UUID orderId = insertOrder(990, 350, 1340);

    assertRejected(() -> insertItem(UUID.randomUUID(), coffeeId("latte"), "Latte", 990, 1, 990));
    assertRejected(() -> insertItem(orderId, UUID.randomUUID(), "Ghost", 990, 1, 990));
  }

  @Test
  void deletingACoffeeThatHasAnOrderLineFails() {
    UUID orderId = insertOrder(990, 350, 1340);
    insertItem(orderId, coffeeId("latte"), "Latte", 990, 1, 990);

    assertRejected(() -> jdbc.update("DELETE FROM coffees WHERE slug = 'latte'"));

    assertThat(
            jdbc.queryForObject("SELECT count(*) FROM coffees WHERE slug = 'latte'", Integer.class))
        .isEqualTo(1);
  }

  @Test
  void deletingAnOrderDeletesItsLines() {
    UUID orderId = insertOrder(2970, 350, 3320);
    insertItem(orderId, coffeeId("latte"), "Latte", 990, 1, 990);
    insertItem(orderId, coffeeId("cuban"), "Cuban", 990, 2, 1980);

    jdbc.update("DELETE FROM orders WHERE id = ?", orderId);

    assertThat(
            jdbc.queryForObject(
                "SELECT count(*) FROM order_items WHERE order_id = ?", Integer.class, orderId))
        .isZero();
  }

  @Test
  void theCoffeeNameAndPriceOfALineSurviveACatalogChange() {
    UUID orderId = insertOrder(990, 350, 1340);
    insertItem(orderId, coffeeId("latte"), "Latte", 990, 1, 990);
    jdbc.update("UPDATE coffees SET price_in_cents = 1500, name = 'Renamed' WHERE slug = 'latte'");
    try {
      Map<String, Object> line =
          jdbc.queryForMap(
              "SELECT coffee_name, unit_price_in_cents FROM order_items WHERE order_id = ?",
              orderId);

      assertThat(line)
          .containsEntry("coffee_name", "Latte")
          .containsEntry("unit_price_in_cents", 990);
    } finally {
      jdbc.update("UPDATE coffees SET price_in_cents = 990, name = 'Latte' WHERE slug = 'latte'");
    }
  }

  private List<String> columns(String table) {
    return jdbc.queryForList(
        "SELECT column_name FROM information_schema.columns WHERE table_name = ?",
        String.class,
        table);
  }

  private UUID coffeeId(String slug) {
    return jdbc.queryForObject("SELECT id FROM coffees WHERE slug = ?", UUID.class, slug);
  }

  private UUID insertOrder(int subtotal, int fee, int total) {
    UUID id = UUID.randomUUID();
    insertOrder(id, "confirmed", "credit_card", "SP", subtotal, fee, total);
    return id;
  }

  private void insertOrder(
      UUID id,
      String status,
      String paymentMethod,
      String state,
      int subtotal,
      int fee,
      int total) {
    jdbc.update(
        """
        INSERT INTO orders (id, status, payment_method, zip_code, street, number, complement,
                            neighborhood, city, state, subtotal_in_cents, delivery_fee_in_cents,
                            total_in_cents)
        VALUES (?, ?, ?, '01310-100', 'Paulista Avenue', '1000', NULL, 'Bela Vista', 'Sao Paulo',
                ?, ?, ?, ?)
        """,
        id,
        status,
        paymentMethod,
        state,
        subtotal,
        fee,
        total);
  }

  private void insertItem(
      UUID orderId, UUID coffeeId, String name, int unitPrice, int quantity, int lineTotal) {
    jdbc.update(
        """
        INSERT INTO order_items (order_id, coffee_id, coffee_name, unit_price_in_cents, quantity,
                                 line_total_in_cents)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        orderId,
        coffeeId,
        name,
        unitPrice,
        quantity,
        lineTotal);
  }

  private static void assertRejected(Runnable statement) {
    assertThatThrownBy(statement::run).isInstanceOf(DataIntegrityViolationException.class);
  }
}
