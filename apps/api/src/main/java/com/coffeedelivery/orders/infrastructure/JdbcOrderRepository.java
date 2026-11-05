package com.coffeedelivery.orders.infrastructure;

import com.coffeedelivery.orders.application.OrderRepository;
import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.Order;
import com.coffeedelivery.orders.domain.OrderItem;
import java.sql.Types;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** Stores orders in the orders and order_items tables, in one transaction. */
@Repository
@Transactional
class JdbcOrderRepository implements OrderRepository {

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
}
