package com.coffeedelivery.orders.application;

import java.time.Instant;

/** Where the address of an old order is cleared. */
public interface OrderAddressRetention {

  /**
   * Clears the address of every order created before {@code cutoff} that still has one, in one
   * statement, and records {@code clearedAt}. Items, totals, payment method, and dates stay. A
   * second call finds nothing to clear. Returns how many orders were cleared.
   */
  int clearAddressesCreatedBefore(Instant cutoff, Instant clearedAt);
}
