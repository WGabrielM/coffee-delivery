import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApiError } from "../api/client";
import { useCart } from "../features/cart/cart-context";
import { AppProviders, createQueryClient } from "./providers";

function Probe() {
  const client = useQueryClient();
  return <p>{client instanceof QueryClient ? "client ready" : "no client"}</p>;
}

function CartProbe() {
  const { totalQuantity } = useCart();
  return <p>{`${totalQuantity} in the cart`}</p>;
}

describe("AppProviders", () => {
  it("gives children a TanStack Query client", () => {
    render(
      <AppProviders>
        <Probe />
      </AppProviders>,
    );

    expect(screen.getByText("client ready")).toBeInTheDocument();
  });

  it("gives children the cart", () => {
    render(
      <AppProviders>
        <CartProbe />
      </AppProviders>,
    );

    expect(screen.getByText("0 in the cart")).toBeInTheDocument();
  });
});

function retry() {
  const option = createQueryClient().getDefaultOptions().queries?.retry;
  if (typeof option !== "function") throw new Error("retry must be a function");
  return option;
}

describe("createQueryClient", () => {
  it("does not retry a client error", () => {
    const error = new ApiError({ status: 400, code: "validation_failed", message: "Invalid." });

    expect(retry()(0, error)).toBe(false);
  });

  it("retries a network failure and a server error, twice at most", () => {
    const network = new ApiError({ status: 0, code: "network_error", message: "Offline." });
    const server = new ApiError({ status: 503, code: "unexpected_error", message: "Down." });

    expect(retry()(0, network)).toBe(true);
    expect(retry()(1, server)).toBe(true);
    expect(retry()(2, server)).toBe(false);
  });

  it("creates a separate client each time", () => {
    expect(createQueryClient()).not.toBe(createQueryClient());
  });
});
