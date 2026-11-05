package com.coffeedelivery.shared.error;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * The one place that turns exceptions into the project's error shape. Later endpoints inherit it.
 * Messages are fixed sentences: they never carry exception messages or stack traces.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorBody> handleUnreadableBody(HttpMessageNotReadableException exception) {
    ErrorBody body =
        ErrorBody.withFields(
            ErrorCode.VALIDATION_FAILED,
            "The request body is missing or is not valid JSON.",
            Map.of("body", "Send a valid JSON body."));
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
  }

  @ExceptionHandler(ValidationFailedException.class)
  public ResponseEntity<ErrorBody> handleValidationFailed(ValidationFailedException exception) {
    ErrorBody body =
        ErrorBody.withFields(
            ErrorCode.VALIDATION_FAILED, exception.getMessage(), exception.fields());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorBody> handleAny(Exception exception) {
    if (exception instanceof ErrorResponse errorResponse) {
      return handleFrameworkError(errorResponse);
    }
    log.error("Unhandled exception", exception);
    return unexpected(HttpStatus.INTERNAL_SERVER_ERROR);
  }

  private ResponseEntity<ErrorBody> handleFrameworkError(ErrorResponse errorResponse) {
    HttpStatusCode status = errorResponse.getStatusCode();
    if (status.is5xxServerError()) {
      log.error("Server error from the framework: {}", status);
      return unexpected(status);
    }
    ErrorBody body =
        switch (status.value()) {
          case 400 ->
              ErrorBody.withFields(
                  ErrorCode.VALIDATION_FAILED,
                  "The request is invalid.",
                  Map.of("request", "Check the request and try again."));
          case 404 -> ErrorBody.of(ErrorCode.NOT_FOUND, "The requested resource was not found.");
          case 405 ->
              ErrorBody.of(
                  ErrorCode.METHOD_NOT_ALLOWED, "This method is not allowed for the resource.");
          case 415 ->
              ErrorBody.of(
                  ErrorCode.UNSUPPORTED_MEDIA_TYPE, "The request content type is not supported.");
          default -> ErrorBody.of(ErrorCode.BAD_REQUEST, "The request could not be processed.");
        };
    return ResponseEntity.status(status).headers(errorResponse.getHeaders()).body(body);
  }

  private static ResponseEntity<ErrorBody> unexpected(HttpStatusCode status) {
    return ResponseEntity.status(status)
        .body(ErrorBody.of(ErrorCode.UNEXPECTED_ERROR, "An unexpected error occurred."));
  }
}
