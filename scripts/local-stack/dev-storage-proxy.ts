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

function isObjectRequest(rawUrl: string, prefix: string): boolean {
  let path = rawUrl.split("?", 1)[0];
  // Inspect decoding variants without rewriting the signed request itself.
  for (let depth = 0; depth < 5; depth += 1) {
    if (
      !path.startsWith(prefix) ||
      path.length === prefix.length ||
      path.includes("\\") ||
      /[\u0000-\u001f\u007f]/.test(path) ||
      path.split("/").some((part) => part === "." || part === "..")
    )
      return false;
    let decoded: string;
    try {
      decoded = decodeURIComponent(path);
    } catch {
      return false;
    }
    if (decoded === path) return true;
    path = decoded;
  }
  return false;
}

export function localStorageProxy(
  target: string,
  bucket: string,
): ProxyOptions {
  const proxyTarget = validateStorageTarget(target);
  const prefix = `/${validateStorageBucket(bucket)}/`;
  return {
    target: proxyTarget,
    // Preserve the signed Host, raw object path, query and body.
    changeOrigin: false,
    bypass(request) {
      if (
        !["GET", "PUT", "HEAD"].includes(request.method ?? "") ||
        !isObjectRequest(request.url ?? "", prefix)
      )
        return false;
    },
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
    [`/${bucket}/`]: localStorageProxy(rawTarget, bucket),
  };
}
