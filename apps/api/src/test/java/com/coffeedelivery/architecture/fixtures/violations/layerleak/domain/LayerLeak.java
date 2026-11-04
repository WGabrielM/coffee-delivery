package com.coffeedelivery.architecture.fixtures.violations.layerleak.domain;

import com.coffeedelivery.architecture.fixtures.violations.layerleak.application.Helper;

public class LayerLeak {

  public Helper helper() {
    return new Helper();
  }
}
