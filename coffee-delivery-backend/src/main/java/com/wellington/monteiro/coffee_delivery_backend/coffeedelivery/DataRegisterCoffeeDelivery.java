package com.wellington.monteiro.coffee_delivery_backend.coffeedelivery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DataRegisterCoffeeDelivery(@NotBlank String name, @NotNull double price,
                                         @NotBlank String image,@NotBlank String description) {
}
