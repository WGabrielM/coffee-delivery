package com.coffeedelivery.orders.domain;

/**
 * Where the order goes. The values are trimmed and already checked by the time they get here; the
 * complement is optional ({@code null} when there is none).
 */
public record Address(
    String zipCode,
    String street,
    String number,
    String complement,
    String neighborhood,
    String city,
    String state) {}
