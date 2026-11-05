package com.coffeedelivery.shared.error;

/** The stable, snake_case error codes of the API. Add a code here and in .docs/CONVENTIONS.md. */
public enum ErrorCode {
  VALIDATION_FAILED("validation_failed"),
  NOT_FOUND("not_found"),
  METHOD_NOT_ALLOWED("method_not_allowed"),
  UNPROCESSABLE_CONTENT("unprocessable_content"),
  UNSUPPORTED_MEDIA_TYPE("unsupported_media_type"),
  BAD_REQUEST("bad_request"),
  UNEXPECTED_ERROR("unexpected_error");

  private final String value;

  ErrorCode(String value) {
    this.value = value;
  }

  public String value() {
    return value;
  }
}
