package com.coffeedelivery.architecture.fixtures.violations.wrongcontroller.interfaces;

import org.springframework.web.bind.annotation.RestController;

/** A controller that is not named *RequestHandler. */
@RestController
public class ThingController {

  public void handle() {}
}
