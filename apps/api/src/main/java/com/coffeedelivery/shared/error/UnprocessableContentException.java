package com.coffeedelivery.shared.error;

import java.io.Serial;
import java.util.Map;

/**
 * The request is valid but its content cannot be used, for example an order for a coffee that does
 * not exist: {@code 422 unprocessable_content} with the fields.
 */
public class UnprocessableContentException extends FieldsException {

  @Serial private static final long serialVersionUID = 1L;

  public UnprocessableContentException(Map<String, String> fields) {
    super("The request is valid but its content cannot be used.", fields);
  }
}
