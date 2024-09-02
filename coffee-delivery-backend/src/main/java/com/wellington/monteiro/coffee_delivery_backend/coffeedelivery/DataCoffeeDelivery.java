package com.wellington.monteiro.coffee_delivery_backend.coffeedelivery;

import com.wellington.monteiro.coffee_delivery_backend.entity.CoffeeDelivery;
import com.wellington.monteiro.coffee_delivery_backend.enums.CoffeeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DataCoffeeDelivery(@NotBlank String name, @NotNull double price,
                                 @NotBlank String description, @NotNull CoffeeType coffeeType) {

    public DataCoffeeDelivery(CoffeeDelivery coffeeDelivery) {
        this(coffeeDelivery.getName(), coffeeDelivery.getPrice(), coffeeDelivery.getDescription(),coffeeDelivery.getCoffeeType());
    }
}
