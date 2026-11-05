package com.coffeedelivery.orders.infrastructure;

import com.coffeedelivery.orders.application.OrderRepository;
import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.Order;
import com.coffeedelivery.orders.domain.OrderItem;
import com.coffeedelivery.orders.domain.OrderStatus;
import com.coffeedelivery.orders.domain.PaymentMethod;
import java.sql.Types;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** Stores and reads orders in the orders and order_items tables. */
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

  private final JdbcClient jdbc;

  JdbcOrderRepository(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public void save(Order order) {
    Address address = order.address();
    jdbc.sql(
            """
            INSERT INTO orders (id, status, payment_method, zip_code, street, number, complement,
                                neighborhood, city, state, subtotal_in_cents,
                                delivery_fee_in_cents, total_in_cents, created_at)
            VALUES (:id, :status, :paymentMethod, :zipCode, :street, :number, :complement,
                    :neighborhood, :city, :state, :subtotal, :deliveryFee, :total, :createdAt)
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
        .update();
    for (OrderItem item : order.items()) {
      jdbc.sql(
              """
              INSERT INTO order_items (order_id, coffee_id, coffee_name, unit_price_in_cents,
                                       quantity, line_total_in_cents)
              VALUES (:orderId, :coffeeId, :name, :unitPrice, :quantity, :lineTotal)
              """)
          .param("orderId", order.id())
          .param("coffeeId", item.coffeeId())
          .param("name", item.name())
          .param("unitPrice", item.unitPriceInCents())
          .param("quantity", item.quantity())
          .param("lineTotal", item.lineTotalInCents())
          .update();
    }
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
                    new Address(
                        rs.getString("zip_code"),
                        rs.getString("street"),
                        rs.getString("number"),
                        rs.getString("complement"),
                        rs.getString("neighborhood"),
                        rs.getString("city"),
                        rs.getString("state")),
                    rs.getInt("subtotal_in_cents"),
                    rs.getInt("delivery_fee_in_cents"),
                    rs.getInt("total_in_cents"),
                    rs.getObject("created_at", OffsetDateTime.class)))
        .optional();
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
