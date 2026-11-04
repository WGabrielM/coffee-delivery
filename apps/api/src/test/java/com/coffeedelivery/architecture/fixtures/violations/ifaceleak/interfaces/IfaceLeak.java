package com.coffeedelivery.architecture.fixtures.violations.ifaceleak.interfaces;

import com.coffeedelivery.architecture.fixtures.violations.ifaceleak.infrastructure.Db;

public class IfaceLeak {

  public Db db() {
    return new Db();
  }
}
