import { coffeeId } from "./catalog.js";

// A valid order of 1 Latte and 2 Cuban at 990 cents each plus the 350 cents fee: a total of 3320.
export const ORDER_TOTAL_IN_CENTS = 3320;

export function newOrderBody() {
  return {
    items: [
      { coffeeId: coffeeId("latte"), quantity: 1 },
      { coffeeId: coffeeId("cuban"), quantity: 2 },
    ],
    address: {
      zipCode: "01310-100",
      street: "Paulista Avenue",
      number: "1000",
      complement: "Apt 12",
      neighborhood: "Bela Vista",
      city: "Sao Paulo",
      state: "SP",
    },
    paymentMethod: "credit_card",
  };
}
