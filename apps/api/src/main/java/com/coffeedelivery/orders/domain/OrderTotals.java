package com.coffeedelivery.orders.domain;

import java.util.List;

/**
 * The amounts of an order, in whole cents: the subtotal is the sum of the line totals, the fee
 * comes from {@link DeliveryPolicy}, and the total is the subtotal plus the fee. This is the one
 * rule of the totals: {@link Order#place} uses it for the order that is stored, and the quote of
 * the checkout (spec 039) uses it for the numbers shown before the order, so the two cannot differ.
 */
public record OrderTotals(int subtotalInCents, int deliveryFeeInCents, int totalInCents) {

  /**
   * The totals of these lines. The ZIP code is accepted so a later fee by zone needs no change in
   * the callers; today the fee is the same for every ZIP code, and for none ({@code null}).
   */
  public static OrderTotals of(List<OrderItem> items, String zipCode) {
    int subtotal = items.stream().mapToInt(OrderItem::lineTotalInCents).sum();
    int fee = DeliveryPolicy.deliveryFeeInCents(zipCode);
    return new OrderTotals(subtotal, fee, subtotal + fee);
  }
}
