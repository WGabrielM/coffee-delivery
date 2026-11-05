package com.coffeedelivery.shared.error;

import java.io.Serial;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Thrown when a request is well formed but a field is not acceptable. {@link ApiExceptionHandler}
 * turns it into {@code 400 validation_failed}. The fields map a JSON path to an en-US message a
 * person can read.
 */
public class ValidationFailedException extends RuntimeException {

  @Serial private static final long serialVersionUID = 1L;

  // Not serialized: the fields only matter while the request is being handled.
  private final transient Map<String, String> fields;

  public ValidationFailedException(Map<String, String> fields) {
    super("The request has invalid fields.");
    this.fields = Collections.unmodifiableMap(new LinkedHashMap<>(fields));
  }

  public Map<String, String> fields() {
    return fields;
  }
}
