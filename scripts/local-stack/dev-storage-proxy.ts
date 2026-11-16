import type { ProxyOptions } from "vite";

const SAFE_BUCKET_PATTERN = /^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$/;
const RESERVED_PREFIXES = new Set([
  "api",
  "app",
  "assets",
  "oauth",
  "src",
  "__local-stack",
]);

function validateStorageBucket(bucket: string): string {
  const trimmed = bucket.trim();
  if (
    !SAFE_BUCKET_PATTERN.test(trimmed) ||
    trimmed.includes("..") ||
    RESERVED_PREFIXES.has(trimmed)
  ) {
    throw new Error(
      `Invalid DEV_STORAGE_BUCKET "${bucket}": must match ${SAFE_BUCKET_PATTERN.source} and not reserve an app/API prefix`,
    );
  }
  return trimmed;
}

function validateStorageTarget(target: string): string {
  let parsed: URL;
  try {
    parsed = new URL(target.trim());
  } catch {
    throw new Error(
      `Invalid DEV_STORAGE_PROXY_TARGET "${target}": must be an http/https URL`,
    );
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `Invalid DEV_STORAGE_PROXY_TARGET "${target}": only http/https are supported`,
    );
  }
  if (
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (parsed.pathname && parsed.pathname !== "/")
  ) {
    throw new Error(
      `Invalid DEV_STORAGE_PROXY_TARGET "${target}": must be an origin without path, query, or credentials`,
    );
  }
  return parsed.origin;
}

export function localStorageProxy(target: string): ProxyOptions {
  return {
    target: validateStorageTarget(target),
    // Host 헤더를 원래 HTTPS DNS host로 유지해 Signed URL V4 서명 host 및 emulator public-host와 일치시킨다.
    changeOrigin: false,
  };
}

export function resolveLocalStorageProxy(
  env: Record<string, string | undefined>,
): Record<string, ProxyOptions> {
  const rawTarget = env.DEV_STORAGE_PROXY_TARGET?.trim() ?? "";
  const rawBucket = env.DEV_STORAGE_BUCKET?.trim() ?? "";
  if (!rawTarget && !rawBucket) {
    return {};
  }
  if (!rawTarget || !rawBucket) {
    throw new Error(
      "DEV_STORAGE_PROXY_TARGET and DEV_STORAGE_BUCKET must both be set when enabling the local storage proxy",
    );
  }
  const bucket = validateStorageBucket(rawBucket);
  return {
    [`/${bucket}`]: localStorageProxy(rawTarget),
  };
}
