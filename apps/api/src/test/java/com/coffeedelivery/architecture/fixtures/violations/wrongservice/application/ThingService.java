package com.coffeedelivery.architecture.fixtures.violations.wrongservice.application;

import org.springframework.stereotype.Service;

/** A service that is not named *UseCase. */
@Service
public class ThingService {

  public void execute() {}
}
