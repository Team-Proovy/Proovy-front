// dev proxy ↔ Server 구간 TCP 중계(127.0.0.1:RELAY_PORT(29692) → UPSTREAM_PORT(8080)). Vite DEV_API_PROXY_TARGET을 http://localhost:29692로 둔다.
// 제어 포트는 RELAY_PORT+1. STALE=1이면 Server가 닫은 소켓을 host 쪽에 열어 두고(FIN 미전달) 다음 요청에 RST한다.
// POST :<RELAY_PORT+1>/cut?mode=reset  run SSE를 나르는 연결에서 dev proxy 쪽 소켓에 RST를 보내고 Server 쪽 소켓도 닫는다
//                                      (dev proxy가 보기엔 upstream RST: Server 재시작·망 단절)
// POST :<RELAY_PORT+1>/cut?mode=stall  run SSE를 나르는 연결을 닫지 않고 더 전달하지 않는다(half-open, FIN·RST 없음)
// dev proxy는 keep-alive로 한 TCP 연결에 여러 요청을 보낸다. 그래서 첫 요청이 아니라 dev proxy가 보내는 chunk마다
// 요청 줄을 보고 지금 그 연결이 run SSE를 나르는지 다시 정한다(http-proxy는 요청 header를 한 chunk로 쓴다).
// GET  :<RELAY_PORT+1>/state           열린 SSE 중계 수
import net from "net";
import http from "http";

const RELAY_PORT = Number(process.env.RELAY_PORT || 29692);
const UPSTREAM_PORT = Number(process.env.UPSTREAM_PORT || 8080);

const log = (...a) => console.log(new Date().toISOString(), ...a);
const sse = new Set();
let stale = 0;
net
  .createServer((client) => {
    const server = net.connect(UPSTREAM_PORT, "127.0.0.1");
    const entry = { client, server, stalled: false, line: "" };
    const classify = (chunk) => {
      const line = chunk.toString("latin1").split("\r\n")[0];
      if (!/^[A-Z]+ \S+ HTTP\/1\.[01]$/.test(line)) return; // 요청 본문 조각
      const isSse =
        /^(POST \/api\/conversations |GET \/api\/ai-runs\/[^ ]*\/events)/.test(
          line,
        );
      if (isSse) {
        entry.line = line;
        sse.add(entry);
        log("sse open", line);
      } else if (sse.delete(entry)) {
        log("sse done (next request on same connection)", entry.line);
      }
    };
    client.on("data", (d) => {
      if (entry.stalled) return;
      classify(d);
      server.write(d);
    });
    server.on("data", (d) => {
      if (!entry.stalled) client.write(d);
    });
    const end = () => {
      if (sse.delete(entry))
        log("sse close", entry.line, entry.stalled ? "(stalled)" : "");
      client.destroy();
      server.destroy();
    };
    client.on("error", end);
    client.on("close", end);
    server.on("error", end);
    server.on("close", () => {
      // stall: Server가 terminal 뒤 닫아도 dev proxy 쪽에는 FIN을 보내지 않는다(진짜 half-open)
      if (entry.stalled && !client.destroyed) {
        log("server closed under stall (hidden)", entry.line);
        return;
      }
      // STALE: Server가 닫아도 host 쪽 소켓은 열어 둔다(FIN을 전달하지 않는 포트 전달). 다음 요청이 오면 RST.
      if (process.env.STALE === "1" && !entry.stalled && !client.destroyed) {
        sse.delete(entry);
        stale += 1;
        client.removeAllListeners("data");
        client.on("data", () => {
          log("stale reuse -> RST", entry.line);
          client.resetAndDestroy();
        });
        return;
      }
      end();
    });
  })
  .listen(RELAY_PORT, "127.0.0.1");

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/state")
      return res.end(
        JSON.stringify({
          stale,
          sse: sse.size,
          stalled: [...sse].filter((e) => e.stalled).length,
        }) + "\n",
      );
    const mode = url.searchParams.get("mode") || "reset";
    const targets = [...sse].filter((e) => !e.stalled);
    for (const e of targets) {
      if (mode === "stall") e.stalled = true;
      else {
        e.client.resetAndDestroy();
        e.server.destroy();
      }
    }
    log("cut", mode, targets.length);
    res.end(`cut ${mode} ${targets.length}\n`);
  })
  .listen(RELAY_PORT + 1, "127.0.0.1");
log("relay ready");
