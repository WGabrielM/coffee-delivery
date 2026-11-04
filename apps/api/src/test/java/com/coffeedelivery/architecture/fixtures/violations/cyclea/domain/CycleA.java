package com.coffeedelivery.architecture.fixtures.violations.cyclea.domain;

import com.coffeedelivery.architecture.fixtures.violations.cycleb.domain.CycleB;

public class CycleA {

  public CycleB other() {
    return new CycleB();
  }
}
