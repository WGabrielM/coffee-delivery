package com.coffeedelivery.system.interfaces;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coffeedelivery.system.application.GetApiInfoUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class GetApiInfoRequestHandlerTest {

  private final MockMvc mvc =
      MockMvcBuilders.standaloneSetup(new GetApiInfoRequestHandler(new GetApiInfoUseCase()))
          .build();

  @Test
  void answersTheApiNameAndVersion() throws Exception {
    mvc.perform(get("/api/v1"))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.name").value("coffee-delivery-api"))
        .andExpect(jsonPath("$.version").value("v1"));
  }
}
