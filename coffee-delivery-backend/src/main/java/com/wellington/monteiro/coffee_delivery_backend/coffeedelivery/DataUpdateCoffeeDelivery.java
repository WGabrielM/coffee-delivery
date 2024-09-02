package com.wellington.monteiro.coffee_delivery_backend.coffeedelivery;

import com.wellington.monteiro.coffee_delivery_backend.enums.CoffeeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DataUpdateCoffeeDelivery(@NotNull Long id, String name, @NotNull double price,
                                       @NotBlank String description, @NotNull CoffeeType coffeeType) {
}
