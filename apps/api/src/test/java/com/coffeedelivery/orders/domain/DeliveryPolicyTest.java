package com.coffeedelivery.orders.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * Pins the delivery rules: a change to the fee, the estimate, or the currency must be deliberate.
 */
class DeliveryPolicyTest {

  @Test
  void theDeliveryFeeIsThreeFiftyInCents() {
    assertThat(DeliveryPolicy.DELIVERY_FEE_IN_CENTS).isEqualTo(350);
  }

  @Test
  void theEstimateIsTwentyToThirtyMinutes() {
    assertThat(DeliveryPolicy.ESTIMATE.minMinutes()).isEqualTo(20);
    assertThat(DeliveryPolicy.ESTIMATE.maxMinutes()).isEqualTo(30);
  }

  @Test
  void theCurrencyIsUsDollars() {
    assertThat(DeliveryPolicy.CURRENCY).isEqualTo("USD");
  }
}
