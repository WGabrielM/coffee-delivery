package com.coffeedelivery.architecture.fixtures.violations.springleak.domain;

import org.springframework.context.ApplicationContext;

public class SpringLeak {

  private ApplicationContext context;

  public ApplicationContext context() {
    return context;
  }
}
