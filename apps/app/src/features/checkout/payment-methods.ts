import type { SelectOptionItem } from "../../components/select-option/SelectOptionGroup";

/**
 * The label and the icon of each payment method, by the code the API uses. This is the one place
 * the app knows the methods: the list that is shown comes from `GET /api/v1/checkout-config`, and a
 * code that is not here is ignored.
 */
export const PAYMENT_METHODS = {
  credit_card: { label: "Credit card", icon: "credit-card" },
  debit_card: { label: "Debit card", icon: "bank" },
  cash: { label: "Cash", icon: "money" },
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const PAYMENT_METHOD_CODES = Object.keys(PAYMENT_METHODS) as [
  PaymentMethod,
  ...PaymentMethod[],
];

function isKnown(code: string): code is PaymentMethod {
  return Object.hasOwn(PAYMENT_METHODS, code);
}

/** The options for the codes of the config, in its order, without the unknown ones or repeats. */
export function paymentOptions(codes: readonly string[]): SelectOptionItem<PaymentMethod>[] {
  return [...new Set(codes)]
    .filter(isKnown)
    .map((code) => ({ value: code, ...PAYMENT_METHODS[code] }));
}
