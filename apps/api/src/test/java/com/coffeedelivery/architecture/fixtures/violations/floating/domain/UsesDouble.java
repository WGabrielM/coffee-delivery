package com.coffeedelivery.architecture.fixtures.violations.floating.domain;

/** A price as a double. */
public class UsesDouble {

  private final double price = 9.9;

  public double price() {
    return price;
  }
}
