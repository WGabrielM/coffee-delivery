package com.coffeedelivery.support;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Routes that exist only in tests, so the end-to-end tests can reach error paths that no business
 * endpoint produces yet. It is not part of the application: it lives in the test sources.
 */
@RestController
@RequestMapping("/api/v1/test-support")
public class TestSupportController {

  public record Payload(String name) {}

  @PostMapping("/echo")
  public Payload echo(@RequestBody Payload payload) {
    return payload;
  }

  @GetMapping("/boom")
  public String boom() {
    throw new IllegalStateException("secret internal detail");
  }
}
