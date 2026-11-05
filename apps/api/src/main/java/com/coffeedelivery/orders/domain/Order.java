package com.coffeedelivery.orders.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A confirmed purchase. Amounts are integer cents (USD). {@link #place} is the totals rule: the
 * subtotal is the sum of the lines, the fee comes from {@link DeliveryPolicy}, and the total is the
 * subtotal plus the fee.
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

  public static Order place(
      UUID id,
      List<OrderItem> items,
      Address address,
      PaymentMethod paymentMethod,
      Instant createdAt) {
    int subtotal = items.stream().mapToInt(OrderItem::lineTotalInCents).sum();
    int fee = DeliveryPolicy.DELIVERY_FEE_IN_CENTS;
    return new Order(
        id,
        OrderStatus.CONFIRMED,
        items,
        address,
        paymentMethod,
        subtotal,
        fee,
        subtotal + fee,
        createdAt);
  }
}
