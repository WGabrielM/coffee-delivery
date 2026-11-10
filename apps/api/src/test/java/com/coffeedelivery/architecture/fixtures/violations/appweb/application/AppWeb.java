package com.coffeedelivery.architecture.fixtures.violations.appweb.application;

import org.springframework.http.HttpStatus;

/** Application code that reaches for the web: only Spring stereotypes are allowed. */
public class AppWeb {

  public HttpStatus status() {
    return HttpStatus.OK;
  }
}
