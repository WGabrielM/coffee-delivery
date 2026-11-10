package com.coffeedelivery.orders.application;

/**
 * How long an order keeps the address of the customer: {@code days} after it was created, the
 * address is cleared. The value comes from {@code orders.retention.days} (a whole number of at
 * least 1), so a wrong setting stops the application at startup.
 */
public record RetentionPolicy(int days) {

  public RetentionPolicy {
    if (days < 1) {
      throw new IllegalArgumentException(
          "orders.retention.days must be a whole number of at least 1, but it is " + days);
    }
  }
}
