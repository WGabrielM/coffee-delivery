package com.coffeedelivery.architecture.fixtures.clean.alpha.infrastructure;

import com.coffeedelivery.architecture.fixtures.clean.alpha.domain.Thing;

public class ThingStore {

  public Thing load() {
    return new Thing("stored");
  }
}
