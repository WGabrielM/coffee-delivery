package com.coffeedelivery.orders.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class OrderTotalsTest {

  private static final Address ADDRESS =
      new Address("01310-100", "Paulista Avenue", "1000", null, "Bela Vista", "Sao Paulo", "SP");

  private static List<OrderItem> sampleItems() {
    return List.of(
        OrderItem.of(UUID.randomUUID(), "Latte", 990, 2),
        OrderItem.of(UUID.randomUUID(), "Traditional Espresso", 990, 1));
  }

  @Test
  void theSubtotalIsTheSumOfTheLinesTheFeeIsFixedAndTheTotalIsTheirSum() {
    OrderTotals totals = OrderTotals.of(sampleItems(), null);

    assertThat(totals.subtotalInCents()).isEqualTo(2970);
    assertThat(totals.deliveryFeeInCents()).isEqualTo(350);
    assertThat(totals.totalInCents()).isEqualTo(3320);
  }

  @Test
  void theFeeIsTheSameForEveryZipCodeAndForNone() {
    List<OrderItem> items = sampleItems();

    assertThat(OrderTotals.of(items, null)).isEqualTo(OrderTotals.of(items, "01310-100"));
    assertThat(OrderTotals.of(items, "90250-440")).isEqualTo(OrderTotals.of(items, "01310-100"));
    assertThat(DeliveryPolicy.deliveryFeeInCents("90250-440")).isEqualTo(350);
  }

  @Test
  void aPlacedOrderHasTheSameNumbersAsTheTotalsOfItsItems() {
    List<OrderItem> items = sampleItems();

    Order order = Order.place(UUID.randomUUID(), items, ADDRESS, PaymentMethod.CASH, Instant.now());
    OrderTotals totals = OrderTotals.of(items, ADDRESS.zipCode());

    assertThat(order.subtotalInCents()).isEqualTo(totals.subtotalInCents());
    assertThat(order.deliveryFeeInCents()).isEqualTo(totals.deliveryFeeInCents());
    assertThat(order.totalInCents()).isEqualTo(totals.totalInCents());
  }
}
