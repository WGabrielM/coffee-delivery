package com.coffeedelivery.architecture.fixtures.violations.shareduse.interfaces;

import com.coffeedelivery.architecture.fixtures.violations.shareduse.application.SharedUseCase;

public class SecondSharedRequestHandler {

  private final SharedUseCase useCase = new SharedUseCase();

  public void handle() {
    useCase.execute();
  }
}
