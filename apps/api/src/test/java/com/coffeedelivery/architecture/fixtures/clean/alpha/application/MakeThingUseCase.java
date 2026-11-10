package com.coffeedelivery.architecture.fixtures.clean.alpha.application;

import com.coffeedelivery.architecture.fixtures.clean.alpha.domain.Thing;
import org.springframework.stereotype.Service;

@Service
public class MakeThingUseCase {

  public Thing execute() {
    return new Thing("thing");
  }
}
