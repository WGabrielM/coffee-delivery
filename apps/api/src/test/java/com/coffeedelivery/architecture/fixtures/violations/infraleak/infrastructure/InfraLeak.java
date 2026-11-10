package com.coffeedelivery.architecture.fixtures.violations.infraleak.infrastructure;

import com.coffeedelivery.architecture.fixtures.violations.infraleak.interfaces.Entry;

public class InfraLeak {

  public Entry entry() {
    return new Entry();
  }
}
