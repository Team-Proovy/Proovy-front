// run SSE 연결 수명 재현 하네스 (task 1.99에서 만들고 2.17에서 macOS·정리).
// 같은 Note에서 흐름을 N회씩 반복하며 브라우저 요청·연결 수를 기록한다. 제품 코드가 아니다(빌드·테스트 대상 아님).
//
//   A  질문 → 완료 → 다음 질문
//   C  완료 뒤 새로고침
//   B  진행 중 새로고침 (Brain을 HOLD_MS 동안 pause → 새로고침 → restore GET /events 확인 → unpause)
//   T  실패로 끝난 run 뒤 같은 Note 다음 질문 (Brain을 FAIL_HOLD_MS 동안 pause → Server stream idle timeout(30s) 실패)
//
// 사용은 run-flows.sh를 거친다(README). 직접 실행할 때 env:
//   OUT(필수) TOKEN(필수) BASE=http://localhost:5173 FLOWS=A,C,B N=5 HOLD_MS=3000 GAP_MS=3000 FAIL_HOLD_MS=40000
//   COMPOSE_DIR=scripts/local-stack COMPOSE_PROJECT=proovy-local UPSTREAM_PORT=8080
//   BROWSER_CHANNEL=chromium|chrome  (chrome = 설치된 Google Chrome)  HEADLESS=0  (화면 있는 브라우저)
//   HAR=1 (OUT/session.har, Authorization header가 들어가므로 공유 금지)  NETLOG=1 (OUT/netlog.json, Chrome socket pool 상태)
//   PLAYWRIGHT_MODULE=<playwright 패키지 경로>  (이 저장소는 playwright를 의존성으로 두지 않는다)
//
// 기록(OUT/):
//   requests.tsv  CDP Network 요청별 시작·header·끝·status·connectionId·Last-Event-ID·실패 사유
//   samples.tsv   500ms마다 apiInflight(브라우저의 끝나지 않은 /api 요청)·sseInflight(그중 run SSE)·
//                 browserToVite(Vite 쪽 ESTABLISHED 소켓)·viteToServer(host에서 UPSTREAM_PORT로 나가는 ESTABLISHED)·
//                 dockerSide(host에서 UPSTREAM_PORT를 받는 쪽 ESTABLISHED: macOS Docker Desktop backend, Linux docker-proxy)·
//                 serverEstablished(Server 컨테이너 /proc/net/tcp :8080 ESTABLISHED)
//   events.log    화면 안내("연결이 끊…"/"다시 연결")·문서 로드 실패·console.error
//   summary.txt   실패 목록
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);

const env = process.env;
const OUT = env.OUT;
if (!OUT || !env.TOKEN) throw new Error("OUT·TOKEN env가 필요하다");
const BASE = env.BASE || "http://localhost:5173";
const N = Number(env.N || 5);
const FLOWS = (env.FLOWS || "A,C,B").split(",");
const HOLD_MS = Number(env.HOLD_MS || 3000);
const GAP_MS = Number(env.GAP_MS || 3000);
const FAIL_HOLD_MS = Number(env.FAIL_HOLD_MS || 40000);
const COMPOSE_DIR =
  env.COMPOSE_DIR || new URL("../local-stack", import.meta.url).pathname;
const COMPOSE_PROJECT = env.COMPOSE_PROJECT || "proovy-local";
const SERVER_CONTAINER = env.SERVER_CONTAINER || `${COMPOSE_PROJECT}-server-1`;
const UPSTREAM_PORT = env.UPSTREAM_PORT || "8080";
const VITE_PORT = new URL(BASE).port || "80";
fs.mkdirSync(OUT, { recursive: true });

const t0 = Date.now();
const ts = () => ((Date.now() - t0) / 1000).toFixed(2);
const events = [];
const say = (...a) => {
  const line = `${ts()} ${a.join(" ")}`;
  console.log(line);
  events.push(line);
};

// --- 연결 수 표본 (Linux ss, macOS lsof) --------------------------------------
const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (e) {
    return e.stdout ?? "";
  }
};
// [local, peer] 쌍 목록
const established = () => {
  if (os.platform() === "darwin") {
    return run("lsof", ["-nP", "-iTCP", "-sTCP:ESTABLISHED"])
      .split("\n")
      .map((l) => l.match(/(\S+)->(\S+) \(ESTABLISHED\)/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]);
  }
  return run("ss", ["-Htn", "state", "established"])
    .split("\n")
    .filter(Boolean)
    .map((l) => l.trim().split(/\s+/).slice(-2));
};
const port = (addr) => addr.slice(addr.lastIndexOf(":") + 1);
const serverTcp = () => {
  const out = run("docker", [
    "exec",
    SERVER_CONTAINER,
    "sh",
    "-c",
    "cat /proc/net/tcp /proc/net/tcp6",
  ]);
  if (!out) return -1;
  // local port 8080(1F90), state 01(ESTABLISHED)
  return out.split("\n").filter((l) => {
    const f = l.trim().split(/\s+/);
    return f[1]?.endsWith(":1F90") && f[3] === "01";
  }).length;
};

const inflight = new Map(); // CDP requestId → {url, method, start, ...}
const requests = [];
const samples = [];
let phase = "init";
const isRunSse = (r) =>
  (r.method === "POST" && /\/api\/conversations$/.test(r.url)) ||
  /\/api\/ai-runs\/[^/]+\/events/.test(r.url);
const sampler = setInterval(() => {
  const api = [...inflight.values()].filter((r) =>
    /^\/api\//.test(new URL(r.url).pathname),
  );
  const tcp = established();
  samples.push({
    t: ts(),
    phase,
    apiInflight: api.length,
    sseInflight: api.filter(isRunSse).length,
    browserToVite: tcp.filter(([local]) => port(local) === VITE_PORT).length,
    viteToServer: tcp.filter(([, peer]) => port(peer) === UPSTREAM_PORT).length,
    dockerSide: tcp.filter(([local]) => port(local) === UPSTREAM_PORT).length,
    serverEstablished: serverTcp(),
  });
}, 500);

// --- 브라우저 ---------------------------------------------------------------
const browser = await chromium.launch({
  timeout: 600000,
  headless: env.HEADLESS !== "0",
  args: [
    "--disable-dev-shm-usage",
    ...(env.NETLOG === "1"
      ? [`--log-net-log=${OUT}/netlog.json`, "--net-log-capture-mode=Default"]
      : []),
  ],
  ...(env.BROWSER_CHANNEL && { channel: env.BROWSER_CHANNEL }),
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 860 },
  locale: "ko-KR",
  ...(env.HAR === "1" && {
    recordHar: { path: `${OUT}/session.har`, content: "omit" },
  }),
});
await context.addInitScript((t) => {
  if (!localStorage.getItem("accessToken")) {
    localStorage.setItem("accessToken", t);
    localStorage.setItem("refreshToken", "local-unused");
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          user: { userId: 0, nickname: "local" },
          isAuthenticated: true,
        },
        version: 0,
      }),
    );
  }
}, env.TOKEN);
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Network.enable");
const short = (u) =>
  u
    .replace(BASE, "")
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, (m) => m.slice(0, 8));
cdp.on("Network.requestWillBeSent", (e) => {
  if (
    !/^\/api\//.test(new URL(e.request.url).pathname) &&
    e.type !== "Document"
  )
    return;
  inflight.set(e.requestId, {
    url: e.request.url,
    method: e.request.method,
    start: ts(),
    type: e.type,
    lastEventId: e.request.headers["Last-Event-ID"],
  });
});
cdp.on("Network.responseReceived", (e) => {
  const r = inflight.get(e.requestId);
  if (r)
    Object.assign(r, {
      status: e.response.status,
      headersAt: ts(),
      connectionId: e.response.connectionId,
    });
});
const finish = (e, how) => {
  const r = inflight.get(e.requestId);
  if (!r) return;
  inflight.delete(e.requestId);
  Object.assign(r, { end: ts(), how });
  if (e.errorText) r.error = e.errorText + (e.canceled ? " (canceled)" : "");
  requests.push({ ...r, url: short(r.url) });
  if (r.type === "Document" && how === "failed")
    say("DOCUMENT LOAD FAILED", r.url, r.error);
};
cdp.on("Network.loadingFinished", (e) => finish(e, "finished"));
cdp.on("Network.loadingFailed", (e) => finish(e, "failed"));
page.on("console", (m) => {
  if (m.type() === "error")
    events.push(`${ts()} console.error ${m.text().slice(0, 200)}`);
});
page.on("pageerror", (e) =>
  events.push(`${ts()} pageerror ${e.message.slice(0, 200)}`),
);

// --- 화면 helper --------------------------------------------------------------
const input = () => page.locator("[contenteditable=true]").first();
const answers = () => page.locator("[aria-label='AI 응답']").count();
const boxes = () => page.locator("ol[aria-label='진행 상황']").count();
const failures = [];
const fail = (flow, i, what) => {
  failures.push(`${flow}${i} ${what}`);
  say("FAIL", flow + i, what);
};
const noticeSeen = new Set();
const noticeWatch = setInterval(async () => {
  try {
    const text = await page.locator("body").innerText({ timeout: 300 });
    for (const line of text.match(/[^\n]*(연결이 끊|다시 연결)[^\n]*/g) ?? []) {
      const k = `${phase}|${line}`;
      if (!noticeSeen.has(k)) {
        noticeSeen.add(k);
        say("NOTICE", phase, line);
      }
    }
  } catch {
    // 새로고침 중에는 body를 읽지 못한다
  }
}, 300);

const typeAndSend = async (text) => {
  await input().waitFor({ timeout: 180000 });
  await input().click();
  await page.keyboard.type(text);
  await page.getByRole("button", { name: "전송" }).click();
};
const waitAnswers = async (n, timeout = 60000) => {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if ((await answers()) >= n) return true;
    await page.waitForTimeout(250);
  }
  return false;
};
const reload = async (flow, i) => {
  try {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    return true;
  } catch (e) {
    fail(flow, i, `reload: ${e.message.split("\n")[0]}`);
    return false;
  }
};
const compose = (...args) =>
  execFileSync("docker", ["compose", "-p", COMPOSE_PROJECT, ...args], {
    cwd: COMPOSE_DIR,
    stdio: "pipe",
  });
const eventsRequests = () =>
  [...inflight.values(), ...requests].filter((r) => /\/events/.test(r.url))
    .length;

try {
  phase = "first";
  await page.goto(`${BASE}/app/home`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await typeAndSend("x^2-5x+6=0을 풀어줘");
  await page.waitForURL(/\/app\/chat\/\d+/, { timeout: 120000 });
  if (!(await waitAnswers(1))) fail("first", 0, "첫 답변 없음");
  say("note", page.url());
  let expected = await answers();

  for (const flow of FLOWS) {
    for (let i = 1; i <= N; i++) {
      phase = `${flow}${i}`;
      say("begin", phase, "answers", expected);
      if (flow === "A") {
        await typeAndSend(`${i + 1}x+${i}=0을 풀어줘`);
        if (!(await waitAnswers(expected + 1)))
          fail(
            flow,
            i,
            `답변 ${expected + 1}개가 되지 않음 (now ${await answers()})`,
          );
        expected = await answers();
        await page.waitForTimeout(GAP_MS); // 사람이 다음 질문을 쓰는 시간 동안 안내가 뜨는지 본다
      } else if (flow === "C") {
        if (!(await reload(flow, i))) {
          await page.goto(page.url()).catch(() => {});
          continue;
        }
        if (!(await waitAnswers(expected, 30000)))
          fail(
            flow,
            i,
            `새로고침 뒤 이력 답변 ${expected}개가 아님 (now ${await answers()})`,
          );
        await page.waitForTimeout(GAP_MS);
      } else if (flow === "B") {
        // Server의 Brain stream idle timeout(30s) 전에 unpause해야 run이 실패하지 않는다.
        compose("pause", "brain");
        const pausedAt = Date.now();
        try {
          await typeAndSend(`${i + 3}x-${i}=0을 풀어줘`);
          await page.waitForTimeout(HOLD_MS);
          const before = eventsRequests();
          if (!(await reload(flow, i)))
            await page.goto(page.url()).catch(() => {});
          const end = Date.now() + 20000;
          while (Date.now() < end && eventsRequests() <= before)
            await page.waitForTimeout(200);
          const attached = eventsRequests() > before;
          say(
            "in-progress reload",
            phase,
            `restore GET /events ${attached}`,
            `answers ${await answers()}`,
            `held ${Date.now() - pausedAt}ms`,
          );
          if (!attached) fail(flow, i, "새로고침 뒤 진행 중 run에 붙지 않음");
          if ((await answers()) > expected)
            fail(flow, i, "검증 전 본문이 보임");
        } finally {
          compose("unpause", "brain");
        }
        if (!(await waitAnswers(expected + 1, 60000)))
          fail(
            flow,
            i,
            `unpause 뒤 답변 ${expected + 1}개가 되지 않음 (now ${await answers()})`,
          );
        expected = await answers();
        await page.waitForTimeout(GAP_MS);
        // 완료 이력은 박스 없이 답변만, 이 화면에서 이어 받은 run은 박스 하나
        const afterBoxes = await boxes();
        if (afterBoxes !== 1)
          fail(
            flow,
            i,
            `진행 상황 박스 ${afterBoxes}개(기대 1: 이어 받은 run 하나)`,
          );
      } else if (flow === "T") {
        compose("pause", "brain");
        try {
          await typeAndSend(`${i + 5}x-${i}=0을 풀어줘`);
          await page.waitForTimeout(FAIL_HOLD_MS);
        } finally {
          compose("unpause", "brain");
        }
        await page.waitForTimeout(GAP_MS);
        say("after failed run", phase, `answers ${await answers()}`);
        expected = await answers();
        await typeAndSend(`${i + 6}x+${i}=0을 풀어줘`);
        if (!(await waitAnswers(expected + 1)))
          fail(
            flow,
            i,
            `실패 run 뒤 다음 질문 답변 없음 (now ${await answers()})`,
          );
        expected = await answers();
        await page.waitForTimeout(GAP_MS);
      } else {
        throw new Error(`모르는 흐름: ${flow}`);
      }
      const notices = [...noticeSeen].filter((k) => k.startsWith(phase + "|"));
      if (notices.length)
        fail(
          flow,
          i,
          `연결 끊김 안내: ${notices.map((k) => k.split("|")[1]).join(" / ")}`,
        );
      say("end", phase, JSON.stringify(samples.at(-1)));
    }
  }
} catch (e) {
  fail("harness", 0, e.message.split("\n")[0]);
  await page.screenshot({ path: `${OUT}/fail.png` }).catch(() => {});
} finally {
  phase = "done";
  await page.waitForTimeout(2000);
  clearInterval(noticeWatch);
  clearInterval(sampler);
  for (const r of inflight.values())
    requests.push({ ...r, url: short(r.url), end: null, how: "open-at-exit" });
  await page.screenshot({ path: `${OUT}/final.png` }).catch(() => {});
  const tsv = (header, rows) =>
    [
      header.join("\t"),
      ...rows.map((r) => header.map((h) => r[h] ?? "").join("\t")),
    ].join("\n") + "\n";
  fs.writeFileSync(
    `${OUT}/requests.tsv`,
    tsv(
      [
        "start",
        "headersAt",
        "end",
        "how",
        "status",
        "connectionId",
        "method",
        "type",
        "url",
        "lastEventId",
        "error",
      ],
      requests.sort((a, b) => a.start - b.start),
    ),
  );
  fs.writeFileSync(
    `${OUT}/samples.tsv`,
    tsv(
      [
        "t",
        "phase",
        "apiInflight",
        "sseInflight",
        "browserToVite",
        "viteToServer",
        "dockerSide",
        "serverEstablished",
      ],
      samples,
    ),
  );
  fs.writeFileSync(`${OUT}/events.log`, events.join("\n") + "\n");
  fs.writeFileSync(
    `${OUT}/summary.txt`,
    `failures ${failures.length}\n${failures.join("\n")}\n`,
  );
  console.log("FAILURES", failures.length);
  await context.close().catch(() => {});
  await browser.close();
}
