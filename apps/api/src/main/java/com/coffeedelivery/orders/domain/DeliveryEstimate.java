package com.coffeedelivery.orders.domain;

/** How long a delivery is expected to take, in minutes. */
public record DeliveryEstimate(int minMinutes, int maxMinutes) {}
