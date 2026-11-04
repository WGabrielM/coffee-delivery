package com.coffeedelivery.architecture.fixtures.clean.alpha.application;

import com.coffeedelivery.architecture.fixtures.clean.alpha.domain.Thing;

public class MakeThingUseCase {

  public Thing execute() {
    return new Thing("thing");
  }
}
