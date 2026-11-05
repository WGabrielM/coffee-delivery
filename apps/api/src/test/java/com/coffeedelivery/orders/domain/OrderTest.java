package com.coffeedelivery.orders.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class OrderTest {

  private static final Address ADDRESS =
      new Address("01310-100", "Paulista Avenue", "1000", null, "Bela Vista", "Sao Paulo", "SP");
  private static final Instant NOW = Instant.parse("2026-11-04T12:00:00Z");

  @Test
  void anItemTotalsItsUnitPriceTimesItsQuantity() {
    OrderItem item = OrderItem.of(UUID.randomUUID(), "Latte", 990, 3);

    assertThat(item.unitPriceInCents()).isEqualTo(990);
    assertThat(item.quantity()).isEqualTo(3);
    assertThat(item.lineTotalInCents()).isEqualTo(2970);
  }

  @Test
  void oneCoffeePlusTwoCoffeesPlusTheFeeIsThirtyThreeTwenty() {
    List<OrderItem> items =
        List.of(
            OrderItem.of(UUID.randomUUID(), "Latte", 990, 1),
            OrderItem.of(UUID.randomUUID(), "Cuban", 990, 2));

    Order order = Order.place(UUID.randomUUID(), items, ADDRESS, PaymentMethod.CREDIT_CARD, NOW);

    assertThat(order.subtotalInCents()).isEqualTo(2970);
    assertThat(order.deliveryFeeInCents()).isEqualTo(350);
    assertThat(order.totalInCents()).isEqualTo(3320);
  }

  @Test
  void aNewOrderIsConfirmedAndKeepsItsPartsAndItemOrder() {
    UUID id = UUID.randomUUID();
    OrderItem first = OrderItem.of(UUID.randomUUID(), "Irish", 990, 1);
    OrderItem second = OrderItem.of(UUID.randomUUID(), "Arabic", 1200, 2);

    Order order = Order.place(id, List.of(first, second), ADDRESS, PaymentMethod.CASH, NOW);

    assertThat(order.id()).isEqualTo(id);
    assertThat(order.status()).isEqualTo(OrderStatus.CONFIRMED);
    assertThat(order.items()).containsExactly(first, second);
    assertThat(order.address()).isEqualTo(ADDRESS);
    assertThat(order.paymentMethod()).isEqualTo(PaymentMethod.CASH);
    assertThat(order.createdAt()).isEqualTo(NOW);
    assertThat(order.subtotalInCents()).isEqualTo(990 + 2400);
    assertThat(order.totalInCents()).isEqualTo(990 + 2400 + 350);
  }

  @Test
  void theFeeComesFromTheDeliveryPolicy() {
    Order order =
        Order.place(
            UUID.randomUUID(),
            List.of(OrderItem.of(UUID.randomUUID(), "Latte", 100, 1)),
            ADDRESS,
            PaymentMethod.DEBIT_CARD,
            NOW);

    assertThat(order.deliveryFeeInCents()).isEqualTo(DeliveryPolicy.DELIVERY_FEE_IN_CENTS);
  }

  @Test
  void theItemsOfAnOrderCannotBeChanged() {
    List<OrderItem> source =
        new ArrayList<>(List.of(OrderItem.of(UUID.randomUUID(), "Latte", 990, 1)));
    Order order = Order.place(UUID.randomUUID(), source, ADDRESS, PaymentMethod.CASH, NOW);

    source.add(OrderItem.of(UUID.randomUUID(), "Cuban", 990, 1));

    assertThat(order.items()).hasSize(1);
    assertThatThrownBy(() -> order.items().add(OrderItem.of(UUID.randomUUID(), "X", 1, 1)))
        .isInstanceOf(UnsupportedOperationException.class);
  }
}
