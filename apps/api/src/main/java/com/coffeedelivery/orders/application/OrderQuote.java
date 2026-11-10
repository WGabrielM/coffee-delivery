package com.coffeedelivery.orders.application;

import com.coffeedelivery.orders.domain.OrderItem;
import com.coffeedelivery.orders.domain.OrderTotals;
import java.util.List;

/** What an order would cost now: the priced lines, in the order sent, and the totals. */
public record OrderQuote(List<OrderItem> items, OrderTotals totals) {}
