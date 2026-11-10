import { CartGate } from "../features/checkout/cart-gate/CartGate";
import { AddressCard } from "../features/checkout/address-card/AddressCard";
import { CheckoutForm } from "../features/checkout/checkout-form/CheckoutForm";
import { OrderSummary } from "../features/checkout/order-summary/OrderSummary";
import { PaymentCard } from "../features/checkout/payment-card/PaymentCard";

/**
 * The checkout: the form on the left (the address card, spec 023, and the payment card, spec 024),
 * 640 px wide at x=160, and the summary of the cart on the right, 448 px wide at x=832, at 1440 px.
 * Both columns are inside one form, so the summary's Confirm order button can submit it (spec 025).
 * An empty cart shows only a message and a link to the coffees (`CartGate`), and no form. The page
 * reads no data and no cart: it composes features.
 */
export function CheckoutPage() {
  return (
    <div className="px-page pt-6 pb-16 sm:pt-10 lg:pt-9.75 lg:pb-20">
      <div className="mx-auto max-w-content">
        <h1 className="sr-only">Checkout</h1>
        <CartGate>
          <CheckoutForm>
            {/* One column below 1024 px; from there the columns share the width as 640 to 448 (the design). */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,640fr)_minmax(0,448fr)]">
              <section aria-labelledby="complete-order-heading" className="flex flex-col gap-4">
                <h2 id="complete-order-heading" className="type-title-xs text-subtitle">
                  Complete your order
                </h2>
                <div className="flex flex-col gap-3">
                  <AddressCard />
                  <PaymentCard />
                </div>
              </section>
              <OrderSummary />
            </div>
          </CheckoutForm>
        </CartGate>
      </div>
    </div>
  );
}
