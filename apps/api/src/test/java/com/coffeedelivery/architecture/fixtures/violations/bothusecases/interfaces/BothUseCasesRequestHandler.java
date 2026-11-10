package com.coffeedelivery.architecture.fixtures.violations.bothusecases.interfaces;

import com.coffeedelivery.architecture.fixtures.violations.bothusecases.application.FirstUseCase;
import com.coffeedelivery.architecture.fixtures.violations.bothusecases.application.SecondUseCase;

/** A handler that depends on two use cases. */
public class BothUseCasesRequestHandler {

  private final FirstUseCase first = new FirstUseCase();
  private final SecondUseCase second = new SecondUseCase();

  public void handle() {
    first.execute();
    second.execute();
  }
}
