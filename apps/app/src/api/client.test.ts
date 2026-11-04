import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiGet, apiPost } from "./client";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function stubFetch(response: () => Response | Promise<Response>) {
  const fetchMock = vi.fn<typeof fetch>(async () => response());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiGet", () => {
  it("returns the parsed body of a 2xx response", async () => {
    const fetchMock = stubFetch(() => jsonResponse({ name: "coffee-delivery-api", version: "v1" }));

    const body = await apiGet<{ name: string; version: string }>("");

    expect(body).toEqual({ name: "coffee-delivery-api", version: "v1" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/v1");
    expect(init?.method).toBe("GET");
    expect(new Headers(init?.headers).get("Accept")).toBe("application/json");
  });

  it("puts the path after the /api/v1 base", async () => {
    const fetchMock = stubFetch(() => jsonResponse([]));

    await apiGet("/coffees?tags=special");

    expect(fetchMock.mock.calls[0]![0]).toBe("/api/v1/coffees?tags=special");
  });

  it("passes the abort signal to fetch", async () => {
    const fetchMock = stubFetch(() => jsonResponse({}));
    const controller = new AbortController();

    await apiGet("", { signal: controller.signal });

    expect(fetchMock.mock.calls[0]![1]?.signal).toBe(controller.signal);
  });

  it("returns undefined for 204 No Content", async () => {
    stubFetch(() => new Response(null, { status: 204 }));

    await expect(apiGet("/anything")).resolves.toBeUndefined();
  });

  it("throws an ApiError with status, code, message, and fields for the error shape", async () => {
    stubFetch(() =>
      jsonResponse(
        {
          error: {
            code: "validation_failed",
            message: "The request has invalid fields.",
            fields: { "address.zipCode": "Enter a ZIP code like 12345-678." },
          },
        },
        400,
      ),
    );

    const error = await apiGet("/orders").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
    const apiError = error as ApiError;
    expect(apiError.name).toBe("ApiError");
    expect(apiError.status).toBe(400);
    expect(apiError.code).toBe("validation_failed");
    expect(apiError.message).toBe("The request has invalid fields.");
    expect(apiError.fields).toEqual({ "address.zipCode": "Enter a ZIP code like 12345-678." });
  });

  it("leaves fields undefined when the error has none", async () => {
    stubFetch(() =>
      jsonResponse(
        { error: { code: "not_found", message: "The requested resource was not found." } },
        404,
      ),
    );

    const error = (await apiGet("/nope").catch((caught: unknown) => caught)) as ApiError;

    expect(error.status).toBe(404);
    expect(error.code).toBe("not_found");
    expect(error.fields).toBeUndefined();
  });

  it("turns an error response that is not in the project's shape into unexpected_error", async () => {
    stubFetch(() => new Response("<html>Bad gateway</html>", { status: 502 }));

    const error = (await apiGet("/coffees").catch((caught: unknown) => caught)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.code).toBe("unexpected_error");
    expect(error.message).not.toContain("<html>");
    expect(error.fields).toBeUndefined();
  });

  it("turns a network failure into network_error with status 0", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    const error = (await apiGet("").catch((caught: unknown) => caught)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.code).toBe("network_error");
    expect(error.message).toBe("Could not reach the server. Check your connection and try again.");
  });

  it("does not hide an abort as a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => {
        throw new DOMException("The operation was aborted.", "AbortError");
      }),
    );

    const error = await apiGet("").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(DOMException);
    expect((error as DOMException).name).toBe("AbortError");
  });
});

describe("apiPost", () => {
  it("sends the body as JSON and returns the parsed 201 body", async () => {
    const fetchMock = stubFetch(() => jsonResponse({ id: "abc" }, 201));

    const body = await apiPost<{ id: string }>("/orders", { items: [] });

    expect(body).toEqual({ id: "abc" });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/v1/orders");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ items: [] }));
    const headers = new Headers(init?.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Accept")).toBe("application/json");
  });

  it("throws an ApiError for a 422 response", async () => {
    stubFetch(() =>
      jsonResponse(
        { error: { code: "unprocessable_content", message: "A coffee does not exist." } },
        422,
      ),
    );

    const error = (await apiPost("/orders", {}).catch((caught: unknown) => caught)) as ApiError;

    expect(error.status).toBe(422);
    expect(error.code).toBe("unprocessable_content");
  });
});
