package com.coffeedelivery.architecture.fixtures.violations.misplacedservice.interfaces;

import org.springframework.stereotype.Service;

/** A service outside application. */
@Service
public class MisplacedUseCase {

  public void execute() {}
}
