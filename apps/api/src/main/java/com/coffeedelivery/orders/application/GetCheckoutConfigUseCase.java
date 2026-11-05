package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.domain.CheckoutConfig;
import com.coffeedelivery.orders.domain.DeliveryPolicy;
import com.coffeedelivery.orders.domain.PaymentMethod;
import java.util.List;
import org.springframework.stereotype.Service;

/** Reads the checkout configuration from the domain rules (no database, no flag). */
@Service
public class GetCheckoutConfigUseCase {

  public CheckoutConfig execute() {
    return new CheckoutConfig(
        DeliveryPolicy.CURRENCY,
        DeliveryPolicy.DELIVERY_FEE_IN_CENTS,
        DeliveryPolicy.ESTIMATE,
        List.of(PaymentMethod.values()));
  }
}
