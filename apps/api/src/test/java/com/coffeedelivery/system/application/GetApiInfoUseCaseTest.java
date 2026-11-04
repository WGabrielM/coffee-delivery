package com.coffeedelivery.system.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.coffeedelivery.system.domain.ApiInfo;
import org.junit.jupiter.api.Test;

class GetApiInfoUseCaseTest {

  @Test
  void returnsTheApiNameAndVersion() {
    ApiInfo info = new GetApiInfoUseCase().execute();

    assertThat(info.name()).isEqualTo("coffee-delivery-api");
    assertThat(info.version()).isEqualTo("v1");
  }
}
