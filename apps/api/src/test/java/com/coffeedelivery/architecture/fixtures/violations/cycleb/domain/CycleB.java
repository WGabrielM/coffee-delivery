package com.coffeedelivery.architecture.fixtures.violations.cycleb.domain;

import com.coffeedelivery.architecture.fixtures.violations.cyclea.domain.CycleA;

public class CycleB {

  public CycleA other() {
    return new CycleA();
  }
}
