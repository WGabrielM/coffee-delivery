package com.coffeedelivery.architecture.fixtures.violations.appleak.application;

import com.coffeedelivery.architecture.fixtures.violations.appleak.infrastructure.Store;

public class AppLeak {

  public Store store() {
    return new Store();
  }
}
