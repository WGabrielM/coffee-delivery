package com.coffeedelivery.architecture.fixtures.clean.alpha.interfaces;

import com.coffeedelivery.architecture.fixtures.clean.alpha.application.MakeThingUseCase;
import com.coffeedelivery.architecture.fixtures.clean.alpha.domain.Thing;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MakeThingRequestHandler {

  private final MakeThingUseCase useCase = new MakeThingUseCase();

  public Thing handle() {
    return useCase.execute();
  }
}
