package com.coffeedelivery.shared.error;

import java.io.Serial;

/** The resource does not exist: {@code 404 not_found}. */
public class NotFoundException extends RuntimeException {

  @Serial private static final long serialVersionUID = 1L;

  public NotFoundException() {
    super("The requested resource was not found.");
  }
}
