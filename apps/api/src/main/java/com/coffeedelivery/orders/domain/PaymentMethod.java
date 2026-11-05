package com.coffeedelivery.orders.domain;

import java.util.Arrays;
import java.util.Optional;

/** How the customer pays on delivery. The product never takes payment data. */
public enum PaymentMethod {
  CREDIT_CARD("credit_card"),
  DEBIT_CARD("debit_card"),
  CASH("cash");

  private final String value;

  PaymentMethod(String value) {
    this.value = value;
  }

  /** The name used in the API and in the database. */
  public String value() {
    return value;
  }

  /** The method with this exact wire value, if any. */
  public static Optional<PaymentMethod> fromValue(String value) {
    return Arrays.stream(values()).filter(method -> method.value.equals(value)).findFirst();
  }
}
