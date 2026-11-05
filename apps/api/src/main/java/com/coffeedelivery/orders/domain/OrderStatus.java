package com.coffeedelivery.orders.domain;

import java.util.Arrays;
import java.util.Optional;

/** The state of an order. Only {@code confirmed} exists: there is no tracking or cancellation. */
public enum OrderStatus {
  CONFIRMED("confirmed");

  private final String value;

  OrderStatus(String value) {
    this.value = value;
  }

  /** The name used in the API and in the database. */
  public String value() {
    return value;
  }

  public static Optional<OrderStatus> fromValue(String value) {
    return Arrays.stream(values()).filter(status -> status.value.equals(value)).findFirst();
  }
}
