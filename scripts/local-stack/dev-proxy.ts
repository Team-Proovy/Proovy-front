import type { ProxyOptions } from "vite";

export function localApiProxy(
  target: string,
  rewriteOrigin: boolean,
): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    ...(rewriteOrigin
      ? ({
          configure(proxy) {
            proxy.on("proxyReq", (request) =>
              request.setHeader("Origin", new URL(target).origin),
            );
          },
        } satisfies Partial<ProxyOptions>)
      : {}),
  };
}
