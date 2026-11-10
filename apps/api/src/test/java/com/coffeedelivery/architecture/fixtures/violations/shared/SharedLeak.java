package com.coffeedelivery.architecture.fixtures.violations.shared;

import com.coffeedelivery.architecture.fixtures.violations.appleak.infrastructure.Store;

/** Shared code that knows a slice. */
public class SharedLeak {

  public Store store() {
    return new Store();
  }
}
