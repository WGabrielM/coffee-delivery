package com.coffeedelivery.orders.domain;

/**
 * The delivery rules, in one place: the checkout page reads them (spec 007) and the order total
 * uses them (spec 010). The fee is fixed: it does not depend on the address, the cart, or the time.
 */
public final class DeliveryPolicy {

  public static final String CURRENCY = "USD";
  public static final int DELIVERY_FEE_IN_CENTS = 350;
  public static final DeliveryEstimate ESTIMATE = new DeliveryEstimate(20, 30);

  private DeliveryPolicy() {}
}
