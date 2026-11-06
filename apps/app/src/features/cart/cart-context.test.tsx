import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CartProvider, useCart } from "./cart-context";
import { CART_STORAGE_KEY } from "./cart-storage";

const latte = "0b0d6a3e-6f1c-4a52-8a7c-3d1f4f0f8c11";
const espresso = "2f6ffcd1-99dc-4734-83ea-6f17e7929870";

function wrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

function stored(): unknown {
  return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "null");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useCart", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.lines).toEqual([]);
    expect(result.current.totalQuantity).toBe(0);
  });

  it("adds, sets the quantity, removes, and clears", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.add(latte, 2));
    act(() => result.current.add(espresso, 1));
    expect(result.current.lines).toEqual([
      { coffeeId: latte, quantity: 2 },
      { coffeeId: espresso, quantity: 1 },
    ]);
    expect(result.current.totalQuantity).toBe(3);

    act(() => result.current.setQuantity(espresso, 5));
    expect(result.current.totalQuantity).toBe(7);

    act(() => result.current.remove(latte));
    expect(result.current.lines).toEqual([{ coffeeId: espresso, quantity: 5 }]);

    act(() => result.current.clear());
    expect(result.current.lines).toEqual([]);
    expect(result.current.totalQuantity).toBe(0);
  });

  it("keeps the same actions between renders, so a component can depend on them", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const first = result.current;

    act(() => result.current.add(latte, 1));

    expect(result.current.add).toBe(first.add);
    expect(result.current.setQuantity).toBe(first.setQuantity);
    expect(result.current.remove).toBe(first.remove);
    expect(result.current.clear).toBe(first.clear);
  });

  it("throws a clear error outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => renderHook(() => useCart())).toThrow("useCart must be used inside a CartProvider");
  });
});

describe("CartProvider persistence", () => {
  it("saves after every change", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.add(latte, 2));
    expect(stored()).toEqual([{ coffeeId: latte, quantity: 2 }]);

    act(() => result.current.setQuantity(latte, 4));
    expect(stored()).toEqual([{ coffeeId: latte, quantity: 4 }]);

    act(() => result.current.clear());
    expect(stored()).toEqual([]);
  });

  it("keeps a change after the provider is mounted again", () => {
    const first = renderHook(() => useCart(), { wrapper });
    act(() => first.result.current.add(latte, 2));
    act(() => first.result.current.add(espresso, 1));
    first.unmount();

    const second = renderHook(() => useCart(), { wrapper });

    expect(second.result.current.lines).toEqual([
      { coffeeId: latte, quantity: 2 },
      { coffeeId: espresso, quantity: 1 },
    ]);
    expect(second.result.current.totalQuantity).toBe(3);
  });

  it("loads a cart that was saved before the provider started, ignoring corrupt lines", () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([{ coffeeId: latte, quantity: 3 }, { coffeeId: "", quantity: 1 }, "junk"]),
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.lines).toEqual([{ coffeeId: latte, quantity: 3 }]);
  });

  it("does not write on start: a stored value is left alone until the cart changes", () => {
    localStorage.setItem(CART_STORAGE_KEY, "{not json");

    renderHook(() => useCart(), { wrapper });

    expect(localStorage.getItem(CART_STORAGE_KEY)).toBe("{not json");
  });

  it("does not write when an action changes nothing", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.remove(latte));
    act(() => result.current.clear());

    expect(setItem).not.toHaveBeenCalled();
  });

  it("saves once per change under StrictMode", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => (
        <StrictMode>
          <CartProvider>{children}</CartProvider>
        </StrictMode>
      ),
    });

    act(() => result.current.add(latte, 1));

    expect(stored()).toEqual([{ coffeeId: latte, quantity: 1 }]);
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it("keeps working in memory when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.add(latte, 2));
    act(() => result.current.add(latte, 1));

    expect(result.current.lines).toEqual([{ coffeeId: latte, quantity: 3 }]);
    expect(result.current.totalQuantity).toBe(3);
  });
});

function Counter({ label }: { label: string }) {
  const { totalQuantity, add } = useCart();
  return (
    <button type="button" onClick={() => add(latte, 1)}>
      {label}: {totalQuantity}
    </button>
  );
}

describe("CartProvider with components", () => {
  it("shares one cart with every component under it", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <Counter label="First" />
        <Counter label="Second" />
      </CartProvider>,
    );

    await user.click(screen.getByRole("button", { name: /First/ }));

    expect(screen.getByRole("button", { name: "First: 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Second: 1" })).toBeInTheDocument();
  });
});
