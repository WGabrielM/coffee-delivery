package com.coffeedelivery.architecture.fixtures.violations.handlerandjob.interfaces;

import com.coffeedelivery.architecture.fixtures.violations.handlerandjob.application.HandlerAndJobUseCase;

public class HandlerAndJobRequestHandler {

  private final HandlerAndJobUseCase useCase = new HandlerAndJobUseCase();

  public void handle() {
    useCase.execute();
  }
}
