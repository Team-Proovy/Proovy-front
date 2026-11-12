// SSE 연결 수명 진단용 Vite 설정: 저장소 vite.config.ts에 dev proxy 이벤트 기록만 덧붙인다.
// 사용(저장소 루트): PROXY_TRACE_LOG=<파일> pnpm exec vite --config scripts/sse-lifecycle/vite.trace.config.ts
// 기록: 요청별 start · upstream.response(status) · upstream.end · upstream.res.close complete · res.close(브라우저 쪽 종료)
import fs from "fs";
import {
  defineConfig,
  mergeConfig,
  type ProxyOptions,
  type UserConfig,
} from "vite";
import base from "../../vite.config";

const LOG = process.env.PROXY_TRACE_LOG ?? "proxy-trace.log";
let seq = 0;
const log = (...parts: unknown[]) =>
  fs.appendFileSync(LOG, `${new Date().toISOString()} ${parts.join(" ")}\n`);

export default defineConfig((env) => {
  const resolved = (
    typeof base === "function" ? base(env) : base
  ) as UserConfig;
  const proxy = resolved.server?.proxy?.["/api"] as ProxyOptions;
  const previous = proxy.configure;
  return mergeConfig(resolved, {
    server: {
      proxy: {
        "/api": {
          ...proxy,
          configure: (server, options) => {
            previous?.(server, options);
            server.on("proxyReq", (proxyReq, req, res) => {
              const tag = `#${++seq} ${req.method} ${req.url}`;
              log("start", tag);
              res.on("close", () =>
                log("res.close", tag, `finished=${res.writableFinished}`),
              );
              proxyReq.on("close", () => log("upstream.close", tag));
              proxyReq.on("response", (proxyRes) => {
                log("upstream.response", tag, proxyRes.statusCode);
                proxyRes.on("end", () => log("upstream.end", tag));
                proxyRes.on("close", () =>
                  log(
                    "upstream.res.close",
                    tag,
                    `complete=${proxyRes.complete}`,
                  ),
                );
                proxyRes.on("error", (e) =>
                  log("upstream.res.error", tag, e.message),
                );
              });
            });
            server.on("error", (err, req) =>
              log("proxy.error", req.url, err.message),
            );
          },
        } satisfies ProxyOptions,
      },
    },
  });
});
