import type { ReactNode } from "react";

import { deliveryIllustration, type IconName } from "../../../assets";
import { Icon } from "../../../components/icon/Icon";
import type { Order } from "../../checkout/api";
import { PAYMENT_METHODS } from "../../checkout/payment-methods";

const circles = {
  purple: "bg-purple",
  yellow: "bg-yellow",
  "yellow-dark": "bg-yellow-dark",
} as const;

type RowProps = {
  icon: IconName;
  tone: keyof typeof circles;
  children: ReactNode;
};

/** A line of the card: a 32 px round icon and two lines of text. */
function Row({ icon, tone, children }: RowProps) {
  return (
    <li className="flex items-center gap-3">
      <span
        data-icon-circle
        className={`inline-flex size-8 shrink-0 items-center justify-center rounded-round text-white ${circles[tone]}`}
      >
        <Icon name={icon} className="size-4" />
      </span>
      <p className="type-text-regular-m text-text">{children}</p>
    </li>
  );
}

const bold = "type-text-bold-m";

/** The label of a payment method, from the app's own map; a code it does not know is shown as is. */
function paymentLabel(code: string): string {
  return Object.hasOwn(PAYMENT_METHODS, code)
    ? PAYMENT_METHODS[code as keyof typeof PAYMENT_METHODS].label
    : code;
}

/**
 * The confirmation of an order: the title, the line under it, a card with where the order goes, when
 * it should arrive, and how to pay, and the delivery illustration at the right. The card is 526 px
 * wide with a 1 px gradient border from yellow to purple: a wrapper with the gradient and 1 px of
 * padding holds the inner card, whose corners are 1 px smaller so the border keeps the 6/36/6/36
 * shape. No price, item, or total is shown (the design has none), and the complement is left out.
 */
export function OrderConfirmation({ order }: { order: Order }) {
  const { address, estimatedDeliveryMinutes, paymentMethod } = order;
  return (
    <>
      <h1 className="type-title-l text-yellow-dark">Uhu! Order confirmed</h1>
      <p className="type-text-regular-l text-subtitle">
        Now just wait and your coffee will soon be with you
      </p>
      {/* Below 1024 px the card is above the illustration; from there they share the row. */}
      <div className="mt-10 grid grid-cols-1 items-end gap-10 lg:grid-cols-[526px_minmax(0,492px)] lg:justify-between lg:gap-0">
        <div className="w-full max-w-131.5 rounded-order-card bg-linear-to-br from-yellow to-purple p-px">
          <ul
            aria-label="Order details"
            className="flex flex-col gap-8 rounded-[5px_35px_5px_35px] bg-background p-6 sm:p-10"
          >
            <Row icon="map-pin-fill" tone="purple">
              Delivery to{" "}
              <span className={bold}>
                {address.street}, {address.number}
              </span>
              <br />
              {address.neighborhood} - {address.city}, {address.state}
            </Row>
            <Row icon="timer-fill" tone="yellow">
              Estimated delivery
              <br />
              <span className={bold}>
                {estimatedDeliveryMinutes.min} min - {estimatedDeliveryMinutes.max} min
              </span>
            </Row>
            <Row icon="currency-dollar" tone="yellow-dark">
              Payment on delivery
              <br />
              <span className={bold}>{paymentLabel(paymentMethod)}</span>
            </Row>
          </ul>
        </div>
        <img
          src={deliveryIllustration}
          alt=""
          width={492}
          height={293}
          className="mx-auto h-auto w-full max-w-123 lg:mx-0"
        />
      </div>
    </>
  );
}
