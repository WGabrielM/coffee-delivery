package com.coffeedelivery.architecture.fixtures.violations.handlerandjob.infrastructure;

import com.coffeedelivery.architecture.fixtures.violations.handlerandjob.application.HandlerAndJobUseCase;

public class HandlerAndJobJob {

  private final HandlerAndJobUseCase useCase = new HandlerAndJobUseCase();

  public void run() {
    useCase.execute();
  }
}
