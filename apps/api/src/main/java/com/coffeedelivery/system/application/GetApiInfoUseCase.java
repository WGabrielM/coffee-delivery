package com.coffeedelivery.system.application;

import com.coffeedelivery.system.domain.ApiInfo;
import org.springframework.stereotype.Service;

@Service
public class GetApiInfoUseCase {

  public ApiInfo execute() {
    return new ApiInfo("coffee-delivery-api", "v1");
  }
}
