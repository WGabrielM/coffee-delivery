package com.coffeedelivery.orders.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A confirmed purchase. Amounts are integer cents (USD). {@link #place} is the totals rule: the
 * subtotal is the sum of the lines, the fee comes from {@link DeliveryPolicy}, and the total is the
 * subtotal plus the fee (the rule is {@link OrderTotals}, shared with the quote). The {@code
 * address} is {@code null} once the retention period has passed and the address was cleared (spec
 * 038); everything else stays.
 */
public record Order(
    UUID id,
    OrderStatus status,
    List<OrderItem> items,
    Address address,
    PaymentMethod paymentMethod,
    int subtotalInCents,
    int deliveryFeeInCents,
    int totalInCents,
    Instant createdAt) {

  public Order {
    items = List.copyOf(items);
  }

  /** The same order with its address cleared. */
  public Order withoutAddress() {
    return new Order(
        id,
        status,
        items,
        null,
        paymentMethod,
        subtotalInCents,
        deliveryFeeInCents,
        totalInCents,
        createdAt);
  }

  public static Order place(
      UUID id,
      List<OrderItem> items,
      Address address,
      PaymentMethod paymentMethod,
      Instant createdAt) {
    OrderTotals totals = OrderTotals.of(items, address.zipCode());
    return new Order(
        id,
        OrderStatus.CONFIRMED,
        items,
        address,
        paymentMethod,
        totals.subtotalInCents(),
        totals.deliveryFeeInCents(),
        totals.totalInCents(),
        createdAt);
  }
}
