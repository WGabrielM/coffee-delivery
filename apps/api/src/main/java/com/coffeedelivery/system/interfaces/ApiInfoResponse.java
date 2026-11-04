package com.coffeedelivery.system.interfaces;

import com.coffeedelivery.system.domain.ApiInfo;

record ApiInfoResponse(String name, String version) {

  static ApiInfoResponse from(ApiInfo info) {
    return new ApiInfoResponse(info.name(), info.version());
  }
}
