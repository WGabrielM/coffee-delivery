package com.coffeedelivery.system.interfaces;

import com.coffeedelivery.system.application.GetApiInfoUseCase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GetApiInfoRequestHandler {

  private final GetApiInfoUseCase useCase;

  public GetApiInfoRequestHandler(GetApiInfoUseCase useCase) {
    this.useCase = useCase;
  }

  @GetMapping("/api/v1")
  public ApiInfoResponse handle() {
    return ApiInfoResponse.from(useCase.execute());
  }
}
