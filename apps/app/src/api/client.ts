// Typed fetch client for the Coffee Delivery API.
// Paths are relative to /api/v1 (pass "" for the API root). Errors follow the project's shape:
// { "error": { "code", "message", "fields" } }, see .docs/CONVENTIONS.md.

export const API_BASE = "/api/v1";

export type FieldErrors = Record<string, string>;

export interface ApiErrorInit {
  status: number;
  code: string;
  message: string;
  fields?: FieldErrors | undefined;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: FieldErrors | undefined;

  constructor({ status, code, message, fields }: ApiErrorInit) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export interface RequestOptions {
  signal?: AbortSignal | undefined;
  /** Extra request headers, such as `Idempotency-Key`. */
  headers?: Record<string, string> | undefined;
}

const NETWORK_ERROR_MESSAGE = "Could not reach the server. Check your connection and try again.";
const UNEXPECTED_ERROR_MESSAGE = "Something went wrong. Please try again.";

export function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>("GET", path, undefined, options);
}

export function apiPost<T>(path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
  return request<T>("POST", path, body, options);
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body: unknown,
  { signal, headers: extraHeaders }: RequestOptions,
): Promise<T> {
  const headers = new Headers({ Accept: "application/json", ...extraHeaders });
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(body);
  }
  if (signal) init.signal = signal;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError({ status: 0, code: "network_error", message: NETWORK_ERROR_MESSAGE });
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  const detail = await readErrorDetail(response);
  if (!detail) {
    return new ApiError({
      status: response.status,
      code: "unexpected_error",
      message: UNEXPECTED_ERROR_MESSAGE,
    });
  }
  return new ApiError({ status: response.status, ...detail });
}

async function readErrorDetail(
  response: Response,
): Promise<{ code: string; message: string; fields?: FieldErrors } | undefined> {
  try {
    const body: unknown = await response.json();
    const error = (body as { error?: unknown } | null)?.error as
      | { code?: unknown; message?: unknown; fields?: unknown }
      | undefined;
    if (typeof error?.code !== "string" || typeof error.message !== "string") return undefined;
    const fields = isFieldErrors(error.fields) ? error.fields : undefined;
    return fields
      ? { code: error.code, message: error.message, fields }
      : { code: error.code, message: error.message };
  } catch {
    return undefined;
  }
}

function isFieldErrors(value: unknown): value is FieldErrors {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}
