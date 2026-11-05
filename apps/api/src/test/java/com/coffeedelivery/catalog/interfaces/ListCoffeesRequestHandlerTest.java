package com.coffeedelivery.catalog.interfaces;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coffeedelivery.catalog.application.CatalogFixtures;
import com.coffeedelivery.catalog.application.InMemoryCoffeeRepository;
import com.coffeedelivery.catalog.application.ListCoffeesUseCase;
import com.coffeedelivery.catalog.domain.Coffee;
import com.coffeedelivery.catalog.domain.Tag;
import com.coffeedelivery.shared.error.ApiExceptionHandler;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ListCoffeesRequestHandlerTest {

  private static final UUID ID = UUID.fromString("11111111-2222-3333-4444-555555555555");

  @Test
  void answersTheCoffeesWithPricesInCentsAndOrderedTags() throws Exception {
    Coffee cuban =
        new Coffee(
            ID,
            "cuban",
            "Cuban",
            "Iced espresso drink with rum, cream and mint",
            990,
            List.of(
                new Tag("special", "Special"),
                new Tag("alcoholic", "Alcoholic"),
                new Tag("iced", "Iced")));

    mvc(List.of(cuban))
        .perform(get("/api/v1/coffees"))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.coffees.length()").value(1))
        .andExpect(jsonPath("$.coffees[0].id").value(ID.toString()))
        .andExpect(jsonPath("$.coffees[0].slug").value("cuban"))
        .andExpect(jsonPath("$.coffees[0].name").value("Cuban"))
        .andExpect(
            jsonPath("$.coffees[0].description")
                .value("Iced espresso drink with rum, cream and mint"))
        .andExpect(jsonPath("$.coffees[0].priceInCents").value(990))
        .andExpect(jsonPath("$.coffees[0].tags[0].slug").value("special"))
        .andExpect(jsonPath("$.coffees[0].tags[0].name").value("Special"))
        .andExpect(jsonPath("$.coffees[0].tags[1].slug").value("alcoholic"))
        .andExpect(jsonPath("$.coffees[0].tags[2].slug").value("iced"));
  }

  @Test
  void answersAnEmptyListWhenTheCatalogIsEmpty() throws Exception {
    mvc(List.of())
        .perform(get("/api/v1/coffees"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.coffees").isArray())
        .andExpect(jsonPath("$.coffees.length()").value(0));
  }

  @Test
  void aMissingOrBlankTagsParameterListsEverything() throws Exception {
    MockMvc mvc = mvc(CatalogFixtures.catalog());

    mvc.perform(get("/api/v1/coffees")).andExpect(jsonPath("$.coffees.length()").value(4));
    mvc.perform(get("/api/v1/coffees").param("tags", ""))
        .andExpect(jsonPath("$.coffees.length()").value(4));
    mvc.perform(get("/api/v1/coffees").param("tags", "  "))
        .andExpect(jsonPath("$.coffees.length()").value(4));
  }

  @Test
  void aCommaSeparatedListFiltersWithAndLogic() throws Exception {
    mvc(CatalogFixtures.catalog())
        .perform(get("/api/v1/coffees").param("tags", "special,iced"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.coffees.length()").value(1))
        .andExpect(jsonPath("$.coffees[0].slug").value("cuban"))
        .andExpect(jsonPath("$.coffees[0].tags.length()").value(3));
  }

  @Test
  void spacesAroundSlugsAndEmptyElementsAreIgnored() throws Exception {
    mvc(CatalogFixtures.catalog())
        .perform(get("/api/v1/coffees").param("tags", " special , ,iced,"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.coffees.length()").value(1));
  }

  @Test
  void aTagCombinationWithNoCoffeeIsAnEmptyList() throws Exception {
    mvc(CatalogFixtures.catalog())
        .perform(get("/api/v1/coffees").param("tags", "traditional,alcoholic"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.coffees.length()").value(0));
  }

  @Test
  void anUnknownTagIsABadRequestNamingTheTag() throws Exception {
    mvc(CatalogFixtures.catalog())
        .perform(get("/api/v1/coffees").param("tags", "special,hot"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("validation_failed"))
        .andExpect(
            jsonPath("$.error.fields.tags").value(org.hamcrest.Matchers.containsString("hot")));
  }

  @Test
  void repeatedTagsParametersAreRejected() throws Exception {
    mvc(CatalogFixtures.catalog())
        .perform(get("/api/v1/coffees").param("tags", "special").param("tags", "iced"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("validation_failed"))
        .andExpect(jsonPath("$.error.fields.tags").isNotEmpty());
  }

  private static MockMvc mvc(List<Coffee> coffees) {
    return MockMvcBuilders.standaloneSetup(
            new ListCoffeesRequestHandler(
                new ListCoffeesUseCase(new InMemoryCoffeeRepository(coffees))))
        .setControllerAdvice(new ApiExceptionHandler())
        .build();
  }
}
