package com.coffeedelivery.shared.error;

import java.io.Serial;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Base of the exceptions that carry field messages: a JSON path mapped to an en-US sentence a
 * person can read. {@link ApiExceptionHandler} turns each subclass into its HTTP status.
 */
public abstract class FieldsException extends RuntimeException {

  @Serial private static final long serialVersionUID = 1L;

  // Not serialized: the fields only matter while the request is being handled.
  private final transient Map<String, String> fields;

  protected FieldsException(String message, Map<String, String> fields) {
    super(message);
    this.fields = Collections.unmodifiableMap(new LinkedHashMap<>(fields));
  }

  public Map<String, String> fields() {
    return fields;
  }
}
