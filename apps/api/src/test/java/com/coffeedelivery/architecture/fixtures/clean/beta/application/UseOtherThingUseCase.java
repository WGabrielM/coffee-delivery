package com.coffeedelivery.architecture.fixtures.clean.beta.application;

import com.coffeedelivery.architecture.fixtures.clean.alpha.domain.Thing;

public class UseOtherThingUseCase {

  public Thing execute() {
    return new Thing("other");
  }
}
