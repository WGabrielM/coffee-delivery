package com.coffeedelivery.orders.domain;

import java.util.List;

/** What the checkout page needs to show before an order exists. */
public record CheckoutConfig(
    String currency,
    int deliveryFeeInCents,
    DeliveryEstimate estimate,
    List<PaymentMethod> paymentMethods) {

  public CheckoutConfig {
    paymentMethods = List.copyOf(paymentMethods);
  }
}
