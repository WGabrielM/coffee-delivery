package com.coffeedelivery.shared.error;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
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
  void aValidationFailedExceptionIsABadRequestWithItsFields() throws Exception {
    mvc.perform(get("/invalid"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("validation_failed"))
        .andExpect(jsonPath("$.error.message").value("The request has invalid fields."))
        .andExpect(jsonPath("$.error.fields.tags").value("Unknown tag: hot."))
        .andExpect(jsonPath("$.error.fields.other").value("Another problem."));
  }

  @Test
  void anUnprocessableContentExceptionIs422WithItsFields() throws Exception {
    mvc.perform(get("/unprocessable"))
        .andExpect(status().isUnprocessableContent())
        .andExpect(jsonPath("$.error.code").value("unprocessable_content"))
        .andExpect(jsonPath("$.error.message").isNotEmpty())
        .andExpect(jsonPath("$.error.fields.items").value("These coffees are not in the catalog."));
  }

  @Test
  void aNotFoundExceptionIs404WithoutFields() throws Exception {
    mvc.perform(get("/missing"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error.code").value("not_found"))
        .andExpect(jsonPath("$.error.message").value("The requested resource was not found."))
        .andExpect(jsonPath("$.error.fields").doesNotExist());
  }

  @Test
  void aValueOfTheWrongTypeNamesItsJsonPathInsteadOfTheBody() throws Exception {
    mvc.perform(
            post("/typed").contentType(MediaType.APPLICATION_JSON).content("{\"count\":\"abc\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("validation_failed"))
        .andExpect(jsonPath("$.error.fields.count").isNotEmpty())
        .andExpect(jsonPath("$.error.fields.body").doesNotExist());
  }

  @Test
  void theJsonPathOfANestedValueIncludesTheArrayIndex() throws Exception {
    mvc.perform(
            post("/typed")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"children\":[{\"count\":1},{\"count\":\"x\"}]}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.fields['children[1].count']").isNotEmpty());
  }

  @Test
  void aTypeErrorMessageNeverCarriesInternals() throws Exception {
    MvcResult result =
        mvc.perform(
                post("/typed")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"count\":\"abc\"}"))
            .andReturn();

    assertThat(result.getResponse().getContentAsString())
        .doesNotContain("java.lang")
        .doesNotContain("Integer")
        .doesNotContain("com.coffeedelivery");
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

    record Typed(Integer count, java.util.List<Typed> children) {}

    @PostMapping("/typed")
    Typed typed(@RequestBody Typed typed) {
      return typed;
    }

    @GetMapping("/unprocessable")
    String unprocessable() {
      throw new UnprocessableContentException(
          Map.of("items", "These coffees are not in the catalog."));
    }

    @GetMapping("/missing")
    String missing() {
      throw new NotFoundException();
    }

    @GetMapping("/invalid")
    String invalid() {
      Map<String, String> fields = new java.util.LinkedHashMap<>();
      fields.put("tags", "Unknown tag: hot.");
      fields.put("other", "Another problem.");
      throw new ValidationFailedException(fields);
    }

    @GetMapping("/boom")
    String boom() {
      throw new IllegalStateException("secret internal detail");
    }
  }
}
