package com.coffeedelivery.orders.interfaces;

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

  static OrderResponse from(Order order) {
    return new OrderResponse(
        order.id().toString(),
        order.status().value(),
        order.items().stream().map(ItemResponse::from).toList(),
        new AddressResponse(
            order.address().zipCode(),
            order.address().street(),
            order.address().number(),
            order.address().complement(),
            order.address().neighborhood(),
            order.address().city(),
            order.address().state()),
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
