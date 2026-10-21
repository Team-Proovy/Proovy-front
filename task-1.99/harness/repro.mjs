// 1.99 재현·인수 하네스. 같은 Note에서 세 흐름(A 다음 질문, B 진행 중 새로고침, C 완료 뒤 새로고침)을 N회씩 반복한다.
// 기록: CDP Network(요청별 시작·끝·status·실패), 250ms마다 열린 /api 요청 수(브라우저)·TCP 연결 수(브라우저→Vite,
// Vite→Server, Server 컨테이너 :8080), 화면 안내·문서 로드 실패.
// 사용: OUT=<dir> BASE=http://localhost:5199 TOKEN=<access token> N=5 FLOWS=A,C,B node repro.mjs
import { chromium } from "playwright";
import { execFileSync } from "child_process";
import fs from "fs";

const OUT = process.env.OUT;
const BASE = process.env.BASE || "http://localhost:5199";
const N = Number(process.env.N || 5);
const FLOWS = (process.env.FLOWS || "A,C,B").split(",");
const COMPOSE_DIR = process.env.COMPOSE_DIR;
const HOLD_MS = Number(process.env.HOLD_MS || 1500);
const GAP_MS = Number(process.env.GAP_MS || 1500);
const CHANNEL = process.env.CHANNEL; // "chromium" = 새 headless(전체 Chrome)
const SERVER_CONTAINER = process.env.SERVER_CONTAINER || "proovy-local-server-1";
fs.mkdirSync(OUT, { recursive: true });

const t0 = Date.now();
const ts = () => ((Date.now() - t0) / 1000).toFixed(2);
const events = [];
const say = (...a) => {
  const line = `${ts()} ${a.join(" ")}`;
  console.log(line);
  events.push(line);
};

// --- 연결 수 표본 -------------------------------------------------------------
const ssCount = (filter) => {
  try {
    const out = execFileSync("ss", ["-Htn", "state", "established", filter], { encoding: "utf8" });
    return out.split("\n").filter(Boolean).length;
  } catch {
    return -1;
  }
};
const serverTcp = () => {
  try {
    const out = execFileSync("docker", ["exec", SERVER_CONTAINER, "sh", "-c", "cat /proc/net/tcp /proc/net/tcp6"], { encoding: "utf8" });
    // local port 8080(1F90), state 01(ESTABLISHED)
    return out.split("\n").filter((l) => /:1F90 /.test(l.split(/\s+/)[2] + " ") && l.split(/\s+/)[4] === "01").length;
  } catch {
    return -1;
  }
};

const inflight = new Map(); // CDP requestId → {url, method, start}
const requests = []; // 완료 기록
const samples = [];
let phase = "init";
const sampler = setInterval(() => {
  const api = [...inflight.values()].filter((r) => r.url.includes("/api/"));
  samples.push({
    t: ts(),
    phase,
    apiInflight: api.length,
    sseInflight: api.filter((r) => (r.method === "POST" && /\/api\/conversations$/.test(r.url)) || /\/api\/ai-runs\/[^/]+\/events/.test(r.url)).length,
    browserToVite: ssCount("dport = :5199"),
    viteToServer: ssCount("dport = :8080"),
    serverEstablished: serverTcp(),
  });
}, 500);

// --- 브라우저 ---------------------------------------------------------------
const browser = await chromium.launch({ timeout: 600000, args: ["--disable-dev-shm-usage"], ...(CHANNEL && { channel: CHANNEL }) });
const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: "ko-KR" });
await context.addInitScript((t) => {
  if (!localStorage.getItem("accessToken")) {
    localStorage.setItem("accessToken", t);
    localStorage.setItem("refreshToken", "local-unused");
    localStorage.setItem("auth-storage", JSON.stringify({ state: { user: { userId: 0, nickname: "local" }, isAuthenticated: true }, version: 0 }));
  }
}, process.env.TOKEN);
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Network.enable");
const short = (u) => u.replace(BASE, "").replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, (m) => m.slice(0, 8));
cdp.on("Network.requestWillBeSent", (e) => {
  if (!/\/api\/|^https?:\/\/localhost:\d+\/app/.test(e.request.url) && e.type !== "Document") return;
  inflight.set(e.requestId, { url: e.request.url, method: e.request.method, start: ts(), type: e.type, lastEventId: e.request.headers["Last-Event-ID"] });
});
cdp.on("Network.responseReceived", (e) => {
  const r = inflight.get(e.requestId);
  if (r) { r.status = e.response.status; r.headersAt = ts(); r.connectionId = e.response.connectionId; }
});
const finish = (e, how) => {
  const r = inflight.get(e.requestId);
  if (!r) return;
  inflight.delete(e.requestId);
  r.end = ts();
  r.how = how;
  if (e.errorText) r.error = e.errorText + (e.canceled ? " (canceled)" : "");
  requests.push({ ...r, url: short(r.url) });
  if (r.type === "Document" && how === "failed") say("DOCUMENT LOAD FAILED", r.url, r.error);
};
cdp.on("Network.loadingFinished", (e) => finish(e, "finished"));
cdp.on("Network.loadingFailed", (e) => finish(e, "failed"));
page.on("console", (m) => { if (m.type() === "error") events.push(`${ts()} console.error ${m.text().slice(0, 200)}`); });

// --- 화면 helper --------------------------------------------------------------
const input = () => page.locator("[contenteditable=true]").first();
const answers = () => page.locator("[aria-label='AI 응답']").count();
const boxes = () => page.locator("ol[aria-label='진행 상황']").count();
const DISCONNECT = /연결이 끊겨|연결이 끊겼|답변 연결이 끊겼|질문 전송 연결이 끊겼/;
const failures = [];
const fail = (flow, i, what) => { failures.push(`${flow}${i} ${what}`); say("FAIL", flow + i, what); };
let noticeSeen = new Set();
const noticeWatch = setInterval(async () => {
  try {
    const text = await page.locator("body").innerText({ timeout: 300 });
    const m = text.match(/[^\n]*(연결이 끊|다시 연결)[^\n]*/g);
    if (m) for (const line of m) { const k = `${phase}|${line}`; if (!noticeSeen.has(k)) { noticeSeen.add(k); say("NOTICE", phase, line); } }
  } catch {}
}, 300);

const typeAndSend = async (text) => {
  await input().waitFor({ timeout: 180000 });
  await input().click();
  await page.keyboard.type(text);
  await page.getByRole("button", { name: "전송" }).click();
};
const waitAnswers = async (n, timeout = 60000) => {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if ((await answers()) >= n) return true; await page.waitForTimeout(250); }
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
const compose = (...args) => execFileSync("docker", ["compose", ...args], { cwd: COMPOSE_DIR, stdio: "pipe" });
const startDisconnectCount = () => [...noticeSeen].filter((k) => k.startsWith(phase + "|")).length;

try {
  phase = "first";
  await page.goto(`${BASE}/app/home`, { waitUntil: "domcontentloaded", timeout: 120000 });
  if (process.env.PRE_SW) {
    // 예전 fixture 모드에서 남은 MSW worker 재현: 등록만 하고 mocking은 켜지 않는다(server 모드)
    say("sw", await page.evaluate(async () => { const r = await navigator.serviceWorker.register("/mockServiceWorker.js"); await navigator.serviceWorker.ready; return r.active?.state; }));
    await page.reload({ waitUntil: "domcontentloaded", timeout: 120000 });
    say("sw controller", await page.evaluate(() => !!navigator.serviceWorker.controller));
  }
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
        if (!(await waitAnswers(expected + 1))) fail(flow, i, `답변 ${expected + 1}개가 되지 않음 (now ${await answers()})`);
        expected = await answers();
        await page.waitForTimeout(GAP_MS); // 완료 뒤 안내가 뜨는지 본다(사람이 다음 질문을 쓰는 시간)
      } else if (flow === "C") {
        if (!(await reload(flow, i))) { await page.goto(page.url()).catch(() => {}); continue; }
        if (!(await waitAnswers(expected, 30000))) fail(flow, i, `새로고침 뒤 이력 답변 ${expected}개가 아님 (now ${await answers()})`);
        await page.waitForTimeout(GAP_MS);
        if ((await boxes()) < expected) say("note", phase, "boxes", await boxes());
      } else if (flow === "B") {
        // Brain을 멈춰 run을 진행 중으로 잡는다. Server의 Brain stream timeout(~30초) 전에 풀어야 run이 실패하지 않는다.
        compose("pause", "brain");
        const pausedAt = Date.now();
        let afterBoxes = -1;
        let eventsBefore = requests.length;
        try {
          await typeAndSend(`${i + 3}x-${i}=0을 풀어줘`);
          await page.waitForTimeout(HOLD_MS);
          eventsBefore = [...inflight.values(), ...requests].filter((r) => /\/events/.test(r.url)).length;
          if (!(await reload(flow, i))) { await page.goto(page.url()).catch(() => {}); }
          // 새로고침 뒤 restore가 진행 중 run에 붙는 것(GET /events)을 기다린다
          const end = Date.now() + 20000;
          while (Date.now() < end && [...inflight.values(), ...requests].filter((r) => /\/events/.test(r.url)).length <= eventsBefore) await page.waitForTimeout(200);
          const attached = [...inflight.values(), ...requests].filter((r) => /\/events/.test(r.url)).length > eventsBefore;
          say("in-progress reload", phase, `restore GET /events ${attached}`, `answers ${await answers()}`, `held ${Date.now() - pausedAt}ms`);
          if (!attached) fail(flow, i, "새로고침 뒤 진행 중 run에 붙지 않음");
          if ((await answers()) > expected) fail(flow, i, "검증 전 본문이 보임");
        } finally {
          compose("unpause", "brain");
        }
        if (!(await waitAnswers(expected + 1, 60000))) fail(flow, i, `unpause 뒤 답변 ${expected + 1}개가 되지 않음 (now ${await answers()})`);
        expected = await answers();
        await page.waitForTimeout(GAP_MS);
        afterBoxes = await boxes();
        // 완료 이력은 박스 없이 답변만, 이 화면에서 받은 run은 박스 하나 — 같은 run의 박스가 둘이면 중복이다
        if (afterBoxes !== 1) fail(flow, i, `진행 상황 박스 ${afterBoxes}개(기대 1: 이어 받은 run 하나)`);
      }
      const notices = [...noticeSeen].filter((k) => k.startsWith(phase + "|"));
      if (notices.length) fail(flow, i, `연결 끊김 안내: ${notices.map((k) => k.split("|")[1]).join(" / ")}`);
      const last = samples.at(-1);
      say("end", phase, JSON.stringify(last));
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
  for (const r of inflight.values()) requests.push({ ...r, url: short(r.url), end: null, how: "open-at-exit" });
  await page.screenshot({ path: `${OUT}/final.png` }).catch(() => {});
  fs.writeFileSync(`${OUT}/requests.tsv`, ["start\theadersAt\tend\thow\tstatus\tconn\tmethod\ttype\turl\tlastEventId\terror", ...requests.sort((a, b) => a.start - b.start).map((r) => [r.start, r.headersAt ?? "", r.end ?? "", r.how, r.status ?? "", r.connectionId ?? "", r.method, r.type, r.url, r.lastEventId ?? "", r.error ?? ""].join("\t"))].join("\n") + "\n");
  fs.writeFileSync(`${OUT}/samples.tsv`, ["t\tphase\tapiInflight\tsseInflight\tbrowserToVite\tviteToServer\tserverEstablished", ...samples.map((s) => [s.t, s.phase, s.apiInflight, s.sseInflight, s.browserToVite, s.viteToServer, s.serverEstablished].join("\t"))].join("\n") + "\n");
  fs.writeFileSync(`${OUT}/events.log`, events.join("\n") + "\n");
  fs.writeFileSync(`${OUT}/summary.txt`, `failures ${failures.length}\n${failures.join("\n")}\n`);
  console.log("FAILURES", failures.length);
  await browser.close();
}
