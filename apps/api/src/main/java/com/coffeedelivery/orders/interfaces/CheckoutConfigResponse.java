package com.coffeedelivery.orders.interfaces;

import com.coffeedelivery.orders.domain.CheckoutConfig;
import com.coffeedelivery.orders.domain.PaymentMethod;
import java.util.List;

record CheckoutConfigResponse(
    String currency,
    int deliveryFeeInCents,
    EstimatedDeliveryMinutes estimatedDeliveryMinutes,
    List<String> paymentMethods) {

  record EstimatedDeliveryMinutes(int min, int max) {}

  static CheckoutConfigResponse from(CheckoutConfig config) {
    return new CheckoutConfigResponse(
        config.currency(),
        config.deliveryFeeInCents(),
        new EstimatedDeliveryMinutes(
            config.estimate().minMinutes(), config.estimate().maxMinutes()),
        config.paymentMethods().stream().map(PaymentMethod::value).toList());
  }
}
