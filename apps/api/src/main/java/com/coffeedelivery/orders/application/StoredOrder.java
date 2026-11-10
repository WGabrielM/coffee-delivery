package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.domain.Order;

/** An order found by its idempotency key, with the fingerprint of the request that created it. */
public record StoredOrder(Order order, String requestFingerprint) {}
