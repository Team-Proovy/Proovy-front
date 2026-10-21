// dev proxy ↔ Server 구간 TCP 중계(127.0.0.1:29692 → 8080). Vite의 DEV_API_PROXY_TARGET을 여기로 둔다.
// POST :29693/cut?mode=reset  열린 run SSE upstream 소켓을 RST로 끊는다(Server 재시작·망 단절)
// POST :29693/cut?mode=stall  열린 run SSE upstream 소켓을 닫지 않고 더 전달하지 않는다(half-open, FIN·RST 없음)
// GET  :29693/state           열린 SSE 중계 수
import net from "net";
import http from "http";

const log = (...a) => console.log(new Date().toISOString(), ...a);
const sse = new Set();
let stale = 0;
net
  .createServer((client) => {
    const server = net.connect(8080, "127.0.0.1");
    const entry = { client, server, stalled: false, line: "" };
    client.once("data", (first) => {
      entry.line = first.toString("latin1").split("\r\n")[0];
      if (/^(POST \/api\/conversations |GET \/api\/ai-runs\/[^ ]*\/events)/.test(entry.line)) {
        sse.add(entry);
        log("sse open", entry.line);
      }
      server.write(first);
      client.on("data", (d) => { if (!entry.stalled) server.write(d); });
      server.on("data", (d) => { if (!entry.stalled) client.write(d); });
    });
    const end = () => {
      if (sse.delete(entry)) log("sse close", entry.line, entry.stalled ? "(stalled)" : "");
      client.destroy();
      server.destroy();
    };
    client.on("error", end); client.on("close", end);
    server.on("error", end);
    server.on("close", () => {
      // stall: Server가 terminal 뒤 닫아도 dev proxy 쪽에는 FIN을 보내지 않는다(진짜 half-open)
      if (entry.stalled && !client.destroyed) { log("server closed under stall (hidden)", entry.line); return; }
      // STALE: Server가 닫아도 host 쪽 소켓은 열어 둔다(FIN을 전달하지 않는 포트 전달). 다음 요청이 오면 RST.
      if (process.env.STALE && !entry.stalled && !client.destroyed) {
        sse.delete(entry);
        stale += 1;
        client.removeAllListeners("data");
        client.on("data", () => { log("stale reuse -> RST", entry.line); client.resetAndDestroy(); });
        return;
      }
      end();
    });
  })
  .listen(29692, "127.0.0.1");

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/state") return res.end(JSON.stringify({ stale, sse: sse.size, stalled: [...sse].filter((e) => e.stalled).length }) + "\n");
    const mode = url.searchParams.get("mode") || "reset";
    const targets = [...sse].filter((e) => !e.stalled);
    for (const e of targets) {
      if (mode === "stall") e.stalled = true;
      else e.client.resetAndDestroy();
    }
    log("cut", mode, targets.length);
    res.end(`cut ${mode} ${targets.length}\n`);
  })
  .listen(29693, "127.0.0.1");
log("relay ready");
