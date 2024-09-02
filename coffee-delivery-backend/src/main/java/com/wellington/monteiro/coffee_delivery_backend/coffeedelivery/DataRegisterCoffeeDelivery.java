package com.wellington.monteiro.coffee_delivery_backend.coffeedelivery;

import com.wellington.monteiro.coffee_delivery_backend.enums.CoffeeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DataRegisterCoffeeDelivery(@NotBlank String name, @NotBlank double price,
                                         @NotBlank String image, @NotBlank String description, @NotNull CoffeeType coffeeType) {
}
