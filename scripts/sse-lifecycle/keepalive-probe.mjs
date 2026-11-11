// 사용: PORT=8080 WAIT_S=90 SERVER_CONTAINER=proovy-local-server-1 node keepalive-probe.mjs
// host → Docker publish(127.0.0.1:PORT) keep-alive 소켓이 Server의 idle close(FIN)를 받는지 본다. (lsof를 쓰므로 macOS 전용, Linux는 ss -tn로 같은 것을 본다)
import http from "http";
import { execFileSync } from "child_process";
const PORT = Number(process.env.PORT || 8080);
const WAIT = Number(process.env.WAIT_S || 90);
const t0 = Date.now();
const ts = () => ((Date.now() - t0) / 1000).toFixed(1);
const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });
const get = () =>
  new Promise((res) => {
    const r = http.get(
      { host: "127.0.0.1", port: PORT, path: "/actuator/health", agent },
      (resp) => {
        resp.resume();
        resp.on("end", () =>
          res(`status ${resp.statusCode} reused=${r.reusedSocket}`),
        );
      },
    );
    r.on("error", (e) =>
      res(`error ${e.code || e.message} reused=${r.reusedSocket}`),
    );
    r.on("socket", (s) => {
      if (!s.__tagged) {
        s.__tagged = true;
        const lp = () => s.localPort;
        s.on("end", () => console.log(ts(), "socket end(FIN) local", lp()));
        s.on("close", () => console.log(ts(), "socket close local", lp()));
      }
    });
  });
const lsof = () => {
  try {
    return execFileSync("lsof", ["-nP", `-iTCP:${PORT}`], { encoding: "utf8" })
      .split("\n")
      .slice(1)
      .filter(Boolean)
      .map((l) =>
        l.split(/\s+/).slice(0, 2).concat(l.split(/\s+/).slice(-2)).join(" "),
      )
      .join(" | ");
  } catch {
    return "-";
  }
};
const srv = () => {
  try {
    return execFileSync(
      "docker",
      [
        "exec",
        process.env.SERVER_CONTAINER || "proovy-local-server-1",
        "sh",
        "-c",
        "cat /proc/net/tcp /proc/net/tcp6 | awk '$2 ~ /:1F90$/ && $4 != \"0A\" {print $4}' | sort | uniq -c | tr '\\n' ' '",
      ],
      { encoding: "utf8" },
    );
  } catch {
    return "-";
  }
};
console.log(ts(), "first", await get());
for (let i = 0; i < WAIT; i += 10) {
  await new Promise((r) => setTimeout(r, 10000));
  console.log(ts(), "host:", lsof(), "|| container states:", srv());
}
console.log(ts(), "second", await get());
console.log(ts(), "third", await get());
process.exit(0);
