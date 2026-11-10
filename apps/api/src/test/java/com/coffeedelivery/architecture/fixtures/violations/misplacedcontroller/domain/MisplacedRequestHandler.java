package com.coffeedelivery.architecture.fixtures.violations.misplacedcontroller.domain;

import org.springframework.web.bind.annotation.RestController;

/** A controller outside interfaces. */
@RestController
public class MisplacedRequestHandler {

  public void handle() {}
}
