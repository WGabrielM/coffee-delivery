package com.coffeedelivery.orders.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import org.junit.jupiter.api.Test;

class PaymentMethodTest {

  @Test
  void theMethodsAreCreditCardDebitCardAndCashInThatOrder() {
    assertThat(Arrays.stream(PaymentMethod.values()).map(PaymentMethod::value))
        .containsExactly("credit_card", "debit_card", "cash");
  }

  @Test
  void aMethodIsFoundByItsWireValue() {
    assertThat(PaymentMethod.fromValue("debit_card")).contains(PaymentMethod.DEBIT_CARD);
    assertThat(PaymentMethod.fromValue("cash")).contains(PaymentMethod.CASH);
  }

  @Test
  void anUnknownOrDifferentlyCasedValueIsNotAMethod() {
    assertThat(PaymentMethod.fromValue("bitcoin")).isEmpty();
    assertThat(PaymentMethod.fromValue("CASH")).isEmpty();
    assertThat(PaymentMethod.fromValue(null)).isEmpty();
  }
}
