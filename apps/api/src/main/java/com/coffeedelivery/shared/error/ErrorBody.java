package com.coffeedelivery.shared.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

/** The body of every error response: {@code {"error": {"code", "message", "fields"}}}. */
public record ErrorBody(ErrorDetail error) {

  public static ErrorBody of(ErrorCode code, String message) {
    return new ErrorBody(new ErrorDetail(code.value(), message, null));
  }

  /** Only validation failures carry fields, keyed by JSON path. */
  public static ErrorBody withFields(ErrorCode code, String message, Map<String, String> fields) {
    return new ErrorBody(new ErrorDetail(code.value(), message, fields));
  }

  @JsonInclude(JsonInclude.Include.NON_NULL)
  public record ErrorDetail(String code, String message, Map<String, String> fields) {}
}
