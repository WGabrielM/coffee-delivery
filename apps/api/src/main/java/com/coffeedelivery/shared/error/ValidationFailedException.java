package com.coffeedelivery.shared.error;

import java.io.Serial;
import java.util.Map;

/** A field is missing or not acceptable: {@code 400 validation_failed} with the fields. */
public class ValidationFailedException extends FieldsException {

  @Serial private static final long serialVersionUID = 1L;

  public ValidationFailedException(Map<String, String> fields) {
    super("The request has invalid fields.", fields);
  }
}
