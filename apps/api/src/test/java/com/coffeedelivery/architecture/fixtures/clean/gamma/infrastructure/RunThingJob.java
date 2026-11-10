package com.coffeedelivery.architecture.fixtures.clean.gamma.infrastructure;

import com.coffeedelivery.architecture.fixtures.clean.gamma.application.RunThingUseCase;

/** A scheduled job is the one entry point of its use case. */
public class RunThingJob {

  private final RunThingUseCase useCase = new RunThingUseCase();

  public void run() {
    useCase.execute();
  }
}
