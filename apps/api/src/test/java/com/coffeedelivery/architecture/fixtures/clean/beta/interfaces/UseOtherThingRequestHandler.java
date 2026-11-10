package com.coffeedelivery.architecture.fixtures.clean.beta.interfaces;

import com.coffeedelivery.architecture.fixtures.clean.alpha.domain.Thing;
import com.coffeedelivery.architecture.fixtures.clean.beta.application.UseOtherThingUseCase;

public class UseOtherThingRequestHandler {

  private final UseOtherThingUseCase useCase = new UseOtherThingUseCase();

  public Thing handle() {
    return useCase.execute();
  }
}
