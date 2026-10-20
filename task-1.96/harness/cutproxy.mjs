// 브라우저 ↔ Vite 사이 TCP 중계(127.0.0.1:5197 → 5196). run SSE 연결(POST /api/conversations, GET /api/ai-runs/*/events)만
// 골라 끊는다. POST :29691/cut?ms=N → 열린 SSE 소켓을 끊고 N ms 동안 새 /api 연결을 끊는다(HMR·모듈 요청은 그대로).
import net from "net"; import http from "http";
const sse = new Set(); let blockedUntil = 0; let cuts = 0;
net.createServer((c) => {
  const s = net.connect(5196, "127.0.0.1");
  c.once("data", (first) => {
    const line = first.toString("latin1").split("\r\n")[0];
    const isApi = / \/api\//.test(line);
    if (isApi && Date.now() < blockedUntil) { c.destroy(); s.destroy(); return; }
    if (/^(POST \/api\/conversations |GET \/api\/ai-runs\/[^ ]*\/events)/.test(line)) { sse.add(c); console.log(new Date().toISOString(), "sse", line); }
    s.write(first); c.pipe(s); s.pipe(c);
  });
  const end = () => { sse.delete(c); c.destroy(); s.destroy(); };
  c.on("error", end); s.on("error", end); c.on("close", end); s.on("close", end);
}).listen(5197, "127.0.0.1");
http.createServer((req, res) => {
  const ms = Number(new URL(req.url, "http://x").searchParams.get("ms") || 0);
  blockedUntil = Date.now() + ms; const n = sse.size; cuts++;
  for (const c of sse) c.resetAndDestroy ? c.resetAndDestroy() : c.destroy(); sse.clear();
  console.log(new Date().toISOString(), "cut", n); res.end(`cut ${n}\n`);
}).listen(29691, "127.0.0.1");
