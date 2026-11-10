package com.coffeedelivery.architecture.fixtures.violations.floating.domain;

/** A rate passed as a float. */
public class UsesFloatParameter {

  public int apply(int cents, float rate) {
    return Math.round(cents * rate);
  }
}
