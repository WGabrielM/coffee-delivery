package com.coffeedelivery.shared.error;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

class ApiExceptionHandlerTest {

  private final MockMvc mvc =
      MockMvcBuilders.standaloneSetup(new Fixture())
          .setControllerAdvice(new ApiExceptionHandler())
          .build();

  @Test
  void invalidJsonIsAValidationFailureWithFields() throws Exception {
    mvc.perform(post("/echo").contentType(MediaType.APPLICATION_JSON).content("{not json"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("validation_failed"))
        .andExpect(jsonPath("$.error.message").isNotEmpty())
        .andExpect(jsonPath("$.error.fields.body").isNotEmpty());
  }

  @Test
  void aMissingBodyIsAValidationFailure() throws Exception {
    mvc.perform(post("/echo").contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("validation_failed"));
  }

  @Test
  void aNotFoundErrorKeepsItsStatusAndHasNoFields() throws Exception {
    MvcResult result =
        mvc.perform(get("/gone"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("not_found"))
            .andExpect(jsonPath("$.error.message").isNotEmpty())
            .andExpect(jsonPath("$.error.fields").doesNotExist())
            .andReturn();
    assertThat(result.getResponse().getContentAsString()).doesNotContain("fields");
  }

  @Test
  void aWrongMethodIsMethodNotAllowedWithTheAllowHeader() throws Exception {
    MvcResult result =
        mvc.perform(post("/only-get"))
            .andExpect(status().isMethodNotAllowed())
            .andExpect(jsonPath("$.error.code").value("method_not_allowed"))
            .andReturn();
    assertThat(result.getResponse().getHeader("Allow")).contains("GET");
  }

  @Test
  void aWrongMediaTypeIsUnsupportedMediaType() throws Exception {
    mvc.perform(post("/echo").contentType(MediaType.TEXT_PLAIN).content("hello"))
        .andExpect(status().isUnsupportedMediaType())
        .andExpect(jsonPath("$.error.code").value("unsupported_media_type"));
  }

  @Test
  void anUnexpectedExceptionIsAGenericServerErrorWithoutInternals() throws Exception {
    MvcResult result =
        mvc.perform(get("/boom"))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.error.code").value("unexpected_error"))
            .andExpect(jsonPath("$.error.fields").doesNotExist())
            .andReturn();
    assertThat(result.getResponse().getContentAsString())
        .doesNotContain("secret internal detail")
        .doesNotContain("IllegalStateException")
        .doesNotContain("at com.");
  }

  @Test
  void aServerErrorStatusFromTheFrameworkIsStillGeneric() throws Exception {
    mvc.perform(get("/unavailable"))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.error.code").value("unexpected_error"));
  }

  @RestController
  static class Fixture {

    record Payload(String name) {}

    @PostMapping("/echo")
    Payload echo(@RequestBody Payload payload) {
      return payload;
    }

    @GetMapping("/only-get")
    String onlyGet() {
      return "ok";
    }

    @GetMapping("/gone")
    String gone() {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "internal reason");
    }

    @GetMapping("/unavailable")
    String unavailable() {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "internal reason");
    }

    @GetMapping("/boom")
    String boom() {
      throw new IllegalStateException("secret internal detail");
    }
  }
}
