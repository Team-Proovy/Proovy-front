// 1.99 재현 전용(commit 금지): 저장소 vite.config.ts에 dev proxy 계측만 덧붙인다.
import { defineConfig, mergeConfig, type ProxyOptions } from "vite";
import fs from "fs";
import base from "./vite.config";

const LOG = process.env.PROXY_TRACE_LOG ?? "/tmp/proxy-trace.log";
let seq = 0;
const log = (...parts: unknown[]) =>
  fs.appendFileSync(LOG, `${new Date().toISOString()} ${parts.join(" ")}\n`);

export default defineConfig((env) => {
  const resolved = typeof base === "function" ? base(env) : base;
  const proxy = (resolved as { server: { proxy: Record<string, ProxyOptions> } })
    .server.proxy["/api"];
  const previous = proxy.configure;
  return mergeConfig(resolved, {
    server: {
      proxy: {
        "/api": {
          ...proxy,
          configure: (server, options) => {
            previous?.(server, options);
            server.on("proxyReq", (proxyReq, req, res) => {
              const id = ++seq;
              const tag = `#${id} ${req.method} ${req.url}`;
              log("start", tag);
              res.on("close", () =>
                log("res.close", tag, `finished=${res.writableFinished}`),
              );
              proxyReq.on("close", () => log("upstream.close", tag));
              proxyReq.on("response", (proxyRes) => {
                log("upstream.response", tag, proxyRes.statusCode);
                proxyRes.on("end", () => log("upstream.end", tag));
                proxyRes.on("close", () =>
                  log("upstream.res.close", tag, `complete=${proxyRes.complete}`),
                );
                proxyRes.on("error", (e) => log("upstream.res.error", tag, e.message));
              });
            });
            server.on("error", (err, req) => log("proxy.error", req.url, err.message));
          },
        },
      },
    },
  });
});
