import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

import { cartReducer, totalQuantity, type CartLine } from "./cart-reducer";
import { loadCart, saveCart } from "./cart-storage";

export type Cart = {
  /** The lines in the order the coffees were first added. */
  readonly lines: readonly CartLine[];
  /** The number of coffees (the sum of the quantities), not the number of lines. */
  readonly totalQuantity: number;
  add: (coffeeId: string, quantity: number) => void;
  setQuantity: (coffeeId: string, quantity: number) => void;
  remove: (coffeeId: string) => void;
  clear: () => void;
};

const CartContext = createContext<Cart | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(cartReducer, undefined, loadCart);

  // The cart is saved after a change, not on start: a value that could not be read is left alone
  // until the visitor changes the cart. The ref also keeps StrictMode from saving twice.
  const saved = useRef<readonly CartLine[]>(lines);
  useEffect(() => {
    if (saved.current === lines) return;
    saved.current = lines;
    saveCart(lines);
  }, [lines]);

  const add = useCallback(
    (coffeeId: string, quantity: number) => dispatch({ type: "add", coffeeId, quantity }),
    [],
  );
  const setQuantity = useCallback(
    (coffeeId: string, quantity: number) => dispatch({ type: "setQuantity", coffeeId, quantity }),
    [],
  );
  const remove = useCallback((coffeeId: string) => dispatch({ type: "remove", coffeeId }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const cart = useMemo<Cart>(
    () => ({ lines, totalQuantity: totalQuantity(lines), add, setQuantity, remove, clear }),
    [lines, add, setQuantity, remove, clear],
  );

  return <CartContext value={cart}>{children}</CartContext>;
}

export function useCart(): Cart {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside a CartProvider.");
  return cart;
}
