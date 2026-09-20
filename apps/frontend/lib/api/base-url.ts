export const DEFAULT_API_BASE_URL = "http://localhost:6137";
export const API_PATH_PREFIX = "/api/v1";

/**
 * Path of the deployment config the web server generates at container start.
 *
 * The API base URL cannot be baked in at build time: one image is deployed
 * against different backends by changing environment variables only.
 */
export const RUNTIME_CONFIG_PATH = "/runtime-config.json";

export type RuntimeConfig = {
  apiBaseUrl?: string;
};

type RuntimeConfigCandidate = {
  apiBaseUrl?: unknown;
};

export function cleanBaseUrl(value?: string | null, fallback = DEFAULT_API_BASE_URL): string {
  const raw = (value ?? fallback).trim();
  const base = raw || fallback;
  return base.replace(/\/+$/, "");
}

export function normalizeApiBaseUrl(value?: string | null): string {
  const base = cleanBaseUrl(value);

  if (base === API_PATH_PREFIX || base.endsWith(API_PATH_PREFIX)) {
    return base;
  }

  if (/^https?:\/\//.test(base) || base.startsWith("/")) {
    return `${base}${API_PATH_PREFIX}`;
  }

  return base;
}

export function backendOriginFromBaseUrl(value?: string | null): string {
  const base = cleanBaseUrl(value);

  try {
    return new URL(base).origin;
  } catch {
    if (base === API_PATH_PREFIX) return "/";
    if (base.endsWith(API_PATH_PREFIX)) {
      const withoutApiPath = base.slice(0, -API_PATH_PREFIX.length);
      return withoutApiPath || "/";
    }
    return base;
  }
}

function parseRuntimeConfig(value: unknown): RuntimeConfig {
  const candidate = value as RuntimeConfigCandidate | null;
  return typeof candidate?.apiBaseUrl === "string" ? { apiBaseUrl: candidate.apiBaseUrl } : {};
}

let runtimeConfig: RuntimeConfig = {};

/**
 * Load the deployment config. Awaited once before the app renders, so every
 * later resolveApiBaseUrl / resolveWebSocketUrl call stays synchronous.
 *
 * A failure is not fatal: the default base URL still points at a local
 * backend, which is what a developer running without the config file wants.
 */
export async function initRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    const response = await fetch(RUNTIME_CONFIG_PATH, { cache: "no-store" });
    if (response.ok) {
      runtimeConfig = parseRuntimeConfig(await response.json());
    }
  } catch {
    // Keep the defaults.
  }

  return runtimeConfig;
}

/** Overrides the loaded config. For tests. */
export function setRuntimeConfig(config: RuntimeConfig): void {
  runtimeConfig = config;
}

export function getRuntimeConfig(): RuntimeConfig {
  return runtimeConfig;
}

export function resolveApiBaseUrl(explicit?: string): string {
  return normalizeApiBaseUrl(explicit ?? getRuntimeConfig().apiBaseUrl ?? DEFAULT_API_BASE_URL);
}

export function resolveWebSocketUrl(explicit?: string): string {
  const configuredBaseUrl = explicit ?? getRuntimeConfig().apiBaseUrl ?? DEFAULT_API_BASE_URL;
  const backendOrigin = backendOriginFromBaseUrl(configuredBaseUrl);
  const baseForUrl = /^https?:\/\//.test(backendOrigin)
    ? backendOrigin
    : typeof window !== "undefined"
      ? window.location.origin
      : DEFAULT_API_BASE_URL;
  const url = new URL("/ws/events", baseForUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}
