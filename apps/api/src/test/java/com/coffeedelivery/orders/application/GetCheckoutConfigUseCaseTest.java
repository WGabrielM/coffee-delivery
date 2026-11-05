package com.coffeedelivery.orders.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.coffeedelivery.orders.domain.CheckoutConfig;
import com.coffeedelivery.orders.domain.PaymentMethod;
import java.util.List;
import org.junit.jupiter.api.Test;

class GetCheckoutConfigUseCaseTest {

  @Test
  void returnsTheFeeTheEstimateAndThePaymentMethodsOfTheDomainRules() {
    CheckoutConfig config = new GetCheckoutConfigUseCase().execute();

    assertThat(config.currency()).isEqualTo("USD");
    assertThat(config.deliveryFeeInCents()).isEqualTo(350);
    assertThat(config.estimate().minMinutes()).isEqualTo(20);
    assertThat(config.estimate().maxMinutes()).isEqualTo(30);
    assertThat(config.paymentMethods())
        .isEqualTo(
            List.of(PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.CASH));
  }
}
