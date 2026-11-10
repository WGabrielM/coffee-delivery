package com.coffeedelivery.orders.interfaces;

import com.coffeedelivery.orders.domain.Address;
import com.coffeedelivery.orders.domain.DeliveryPolicy;
import com.coffeedelivery.orders.domain.Order;
import com.coffeedelivery.orders.domain.OrderItem;
import java.time.Instant;
import java.util.List;

/** The order as the API shows it. Create and get share it, so both answer the same body. */
record OrderResponse(
    String id,
    String status,
    List<ItemResponse> items,
    AddressResponse address,
    int addressRetentionDays,
    String paymentMethod,
    int subtotalInCents,
    int deliveryFeeInCents,
    int totalInCents,
    String currency,
    EstimatedDeliveryMinutes estimatedDeliveryMinutes,
    Instant createdAt) {

  record ItemResponse(
      String coffeeId, String name, int quantity, int unitPriceInCents, int lineTotalInCents) {

    static ItemResponse from(OrderItem item) {
      return new ItemResponse(
          item.coffeeId().toString(),
          item.name(),
          item.quantity(),
          item.unitPriceInCents(),
          item.lineTotalInCents());
    }
  }

  record AddressResponse(
      String zipCode,
      String street,
      String number,
      String complement,
      String neighborhood,
      String city,
      String state) {}

  record EstimatedDeliveryMinutes(int min, int max) {}

  private static AddressResponse addressOf(Order order) {
    Address address = order.address();
    if (address == null) {
      return null;
    }
    return new AddressResponse(
        address.zipCode(),
        address.street(),
        address.number(),
        address.complement(),
        address.neighborhood(),
        address.city(),
        address.state());
  }

  /**
   * The order as the API shows it. The address is {@code null} for an order whose address was
   * cleared after {@code addressRetentionDays} days (spec 038); every other field is as before.
   */
  static OrderResponse from(Order order, int addressRetentionDays) {
    return new OrderResponse(
        order.id().toString(),
        order.status().value(),
        order.items().stream().map(ItemResponse::from).toList(),
        addressOf(order),
        addressRetentionDays,
        order.paymentMethod().value(),
        order.subtotalInCents(),
        order.deliveryFeeInCents(),
        order.totalInCents(),
        DeliveryPolicy.CURRENCY,
        new EstimatedDeliveryMinutes(
            DeliveryPolicy.ESTIMATE.minMinutes(), DeliveryPolicy.ESTIMATE.maxMinutes()),
        order.createdAt());
  }
}
