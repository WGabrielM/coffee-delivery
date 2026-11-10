package com.coffeedelivery.orders.infrastructure;

import com.coffeedelivery.orders.application.OrderRepository;
import com.coffeedelivery.orders.application.StoredOrder;
import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.Order;
import com.coffeedelivery.orders.domain.OrderItem;
import com.coffeedelivery.orders.domain.OrderStatus;
import com.coffeedelivery.orders.domain.PaymentMethod;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * Stores and reads orders in the orders and order_items tables. Saving an order is two statements
 * however many lines it has: one insert for the order and one batch for all its lines, inside the
 * one transaction of {@link #save}.
 */
@Repository
@Transactional
class JdbcOrderRepository implements OrderRepository {

  private record OrderRow(
      OrderStatus status,
      PaymentMethod paymentMethod,
      Address address,
      int subtotalInCents,
      int deliveryFeeInCents,
      int totalInCents,
      OffsetDateTime createdAt) {}

  private static final String INSERT_ITEM =
      """
      INSERT INTO order_items (order_id, coffee_id, coffee_name, unit_price_in_cents,
                               quantity, line_total_in_cents)
      VALUES (?, ?, ?, ?, ?, ?)
      """;

  private final JdbcClient jdbc;
  private final JdbcTemplate template;

  JdbcOrderRepository(JdbcClient jdbc, JdbcTemplate template) {
    this.jdbc = jdbc;
    this.template = template;
  }

  @Override
  public boolean save(Order order, UUID idempotencyKey, String requestFingerprint) {
    Address address = order.address();
    // With a key, the unique constraint decides: a second insert with the same key does nothing
    // (it waits for the first to commit), and then no line is stored. Null keys never conflict.
    int inserted =
        jdbc.sql(
                """
            INSERT INTO orders (id, status, payment_method, zip_code, street, number, complement,
                                neighborhood, city, state, subtotal_in_cents,
                                delivery_fee_in_cents, total_in_cents, created_at,
                                idempotency_key, request_fingerprint)
            VALUES (:id, :status, :paymentMethod, :zipCode, :street, :number, :complement,
                    :neighborhood, :city, :state, :subtotal, :deliveryFee, :total, :createdAt,
                    :idempotencyKey, :requestFingerprint)
            ON CONFLICT (idempotency_key) DO NOTHING
            """)
            .param("id", order.id())
            .param("status", order.status().value())
            .param("paymentMethod", order.paymentMethod().value())
            .param("zipCode", address.zipCode())
            .param("street", address.street())
            .param("number", address.number())
            .param("complement", address.complement(), Types.VARCHAR)
            .param("neighborhood", address.neighborhood())
            .param("city", address.city())
            .param("state", address.state())
            .param("subtotal", order.subtotalInCents())
            .param("deliveryFee", order.deliveryFeeInCents())
            .param("total", order.totalInCents())
            .param("createdAt", OffsetDateTime.ofInstant(order.createdAt(), ZoneOffset.UTC))
            .param("idempotencyKey", idempotencyKey, Types.OTHER)
            .param("requestFingerprint", requestFingerprint, Types.VARCHAR)
            .update();
    if (inserted == 0) {
      return false;
    }
    // One batch for all the lines, in the order they were sent: the identity id of order_items
    // grows with each row of the batch, and reading the order back sorts by it.
    List<OrderItem> items = order.items();
    template.batchUpdate(
        INSERT_ITEM,
        items,
        items.size(),
        (PreparedStatement statement, OrderItem item) -> setItem(statement, order.id(), item));
    return true;
  }

  private static void setItem(PreparedStatement statement, UUID orderId, OrderItem item)
      throws SQLException {
    statement.setObject(1, orderId);
    statement.setObject(2, item.coffeeId());
    statement.setString(3, item.name());
    statement.setInt(4, item.unitPriceInCents());
    statement.setInt(5, item.quantity());
    statement.setInt(6, item.lineTotalInCents());
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<StoredOrder> findByIdempotencyKey(UUID idempotencyKey) {
    return jdbc.sql("SELECT id, request_fingerprint FROM orders WHERE idempotency_key = :key")
        .param("key", idempotencyKey)
        .query(
            (rs, rowNumber) ->
                new Object[] {rs.getObject("id", UUID.class), rs.getString("request_fingerprint")})
        .optional()
        .flatMap(
            row -> findById((UUID) row[0]).map(order -> new StoredOrder(order, (String) row[1])));
  }

  /** Reads the stored snapshot only: nothing here touches the catalog. */
  @Override
  @Transactional(readOnly = true)
  public Optional<Order> findById(UUID id) {
    return findRow(id)
        .map(
            row ->
                new Order(
                    id,
                    row.status(),
                    findItems(id),
                    row.address(),
                    row.paymentMethod(),
                    row.subtotalInCents(),
                    row.deliveryFeeInCents(),
                    row.totalInCents(),
                    row.createdAt().toInstant()));
  }

  private Optional<OrderRow> findRow(UUID id) {
    return jdbc.sql(
            """
            SELECT status, payment_method, zip_code, street, number, complement, neighborhood,
                   city, state, subtotal_in_cents, delivery_fee_in_cents, total_in_cents,
                   created_at
            FROM orders
            WHERE id = :id
            """)
        .param("id", id)
        .query(
            (rs, rowNumber) ->
                new OrderRow(
                    OrderStatus.fromValue(rs.getString("status")).orElseThrow(),
                    PaymentMethod.fromValue(rs.getString("payment_method")).orElseThrow(),
                    addressOf(rs),
                    rs.getInt("subtotal_in_cents"),
                    rs.getInt("delivery_fee_in_cents"),
                    rs.getInt("total_in_cents"),
                    rs.getObject("created_at", OffsetDateTime.class)))
        .optional();
  }

  /** The address, or null for an order whose address was cleared after the retention period. */
  private static Address addressOf(ResultSet rs) throws SQLException {
    if (rs.getString("zip_code") == null) {
      return null;
    }
    return new Address(
        rs.getString("zip_code"),
        rs.getString("street"),
        rs.getString("number"),
        rs.getString("complement"),
        rs.getString("neighborhood"),
        rs.getString("city"),
        rs.getString("state"));
  }

  /** The lines in creation order: the identity id grows with each insert. */
  private List<OrderItem> findItems(UUID orderId) {
    return jdbc.sql(
            """
            SELECT coffee_id, coffee_name, quantity, unit_price_in_cents, line_total_in_cents
            FROM order_items
            WHERE order_id = :orderId
            ORDER BY id
            """)
        .param("orderId", orderId)
        .query(
            (rs, rowNumber) ->
                new OrderItem(
                    rs.getObject("coffee_id", UUID.class),
                    rs.getString("coffee_name"),
                    rs.getInt("quantity"),
                    rs.getInt("unit_price_in_cents"),
                    rs.getInt("line_total_in_cents")))
        .list();
  }
}
