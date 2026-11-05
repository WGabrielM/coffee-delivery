package com.coffeedelivery.orders.application;

import java.util.UUID;

/** What the orders slice needs to know about a coffee to sell it. */
public record CoffeePrice(UUID id, String name, int priceInCents) {}
