/**
 * Centralized API client for the Simatei Motorworld Flask API.
 * Base URL comes from VITE_API_BASE_URL and already contains the /api prefix.
 */

const BASE_URL = (
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "http://localhost:5000/api"
).replace(/\/$/, "");

export const API_BASE_URL = BASE_URL;

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  fieldErrors?: FieldErrors | undefined;
  detailsText?: string | undefined;

  constructor(message: string, status: number, fieldErrors?: FieldErrors, detailsText?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.detailsText = detailsText;
  }
}

let tokenGetter: () => string | null = () => null;
let unauthorizedHandler: () => void = () => {};

export function registerTokenGetter(fn: () => string | null) {
  tokenGetter = fn;
}

export function registerUnauthorizedHandler(fn: () => void) {
  unauthorizedHandler = fn;
}

function normalizeError(status: number, body: unknown): ApiError {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    const rawMessage =
      (typeof b["error"] === "string" && b["error"]) ||
      (typeof b["msg"] === "string" && b["msg"]) ||
      (typeof b["message"] === "string" && b["message"]) ||
      null;

    let fieldErrors: FieldErrors | undefined;
    let detailsText: string | undefined;
    const details = b["details"];
    if (details && typeof details === "object" && !Array.isArray(details)) {
      fieldErrors = {};
      for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
        if (Array.isArray(value)) fieldErrors[key] = value.map(String);
        else if (value != null) fieldErrors[key] = [String(value)];
      }
    } else if (typeof details === "string") {
      detailsText = details;
    }

    return new ApiError(rawMessage ?? defaultMessage(status), status, fieldErrors, detailsText);
  }
  return new ApiError(defaultMessage(status), status);
}

function defaultMessage(status: number): string {
  switch (status) {
    case 400:
      return "The request could not be processed. Please check the details and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "We couldn't find what you were looking for.";
    case 409:
      return "This action conflicts with something that already exists.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  /** Attach the token when available, but do not require it (public + optional auth). */
  optionalAuth?: boolean;
  params?: QueryParams;
  signal?: AbortSignal;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false, optionalAuth = false, params, signal } = options;

  const headers: Record<string, string> = {};
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";

  if (auth || optionalAuth) {
    const token = tokenGetter();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(params)}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: isFormData ? body : JSON.stringify(body) }),
      ...(signal ? { signal } : {}),
    });
  } catch {
    throw new ApiError(
      "Cannot reach the Simatei Motorworld server. Check that the API is running.",
      0,
    );
  }

  const text = await response.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = undefined;
    }
  }

  if (!response.ok) {
    if (response.status === 401) unauthorizedHandler();
    throw normalizeError(response.status, parsed);
  }

  return (parsed ?? {}) as T;
}

export async function checkHealth(): Promise<boolean> {
  const healthUrl = BASE_URL.replace(/\/api$/, "") + "/health";
  try {
    const res = await fetch(healthUrl);
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data.status === "ok";
  } catch {
    return false;
  }
}

/** Human-friendly message for any thrown error. Never leaks stack traces. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message && error.message.length < 200) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function fieldErrorsOf(error: unknown): FieldErrors {
  return error instanceof ApiError && error.fieldErrors ? error.fieldErrors : {};
}
