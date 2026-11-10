package com.coffeedelivery.architecture.fixtures.violations.floating.domain;

import java.math.BigDecimal;

/** An amount as a BigDecimal. */
public class UsesBigDecimal {

  public BigDecimal amount() {
    return BigDecimal.ONE;
  }
}
