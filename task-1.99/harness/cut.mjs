// #315: dev proxy ↔ Server 구간 단절(upstream-relay.mjs) 뒤 브라우저가 재접속해 terminal을 받는지.
// 사용: OUT=<dir> BASE=http://localhost:5199 TOKEN=... MODE=reset|stall WAIT_MS=90000 COMPOSE_DIR=... node cut.mjs
import { chromium } from "playwright";
import { execFileSync } from "child_process";
import fs from "fs";

const { OUT, TOKEN, COMPOSE_DIR } = process.env;
const BASE = process.env.BASE || "http://localhost:5199";
const MODE = process.env.MODE || "reset";
const WAIT_MS = Number(process.env.WAIT_MS || 90000);
fs.mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const ts = () => ((Date.now() - t0) / 1000).toFixed(2);
const lines = [];
const say = (...a) => { const l = `${ts()} ${a.join(" ")}`; console.log(l); lines.push(l); };
const compose = (...a) => execFileSync("docker", ["compose", ...a], { cwd: COMPOSE_DIR, stdio: "pipe" });

const browser = await chromium.launch({ timeout: 600000, args: ["--disable-dev-shm-usage"], channel: "chromium" });
const context = await browser.newContext({ locale: "ko-KR" });
await context.addInitScript((t) => {
  localStorage.setItem("accessToken", t);
  localStorage.setItem("refreshToken", "local-unused");
  localStorage.setItem("auth-storage", JSON.stringify({ state: { user: { userId: 0, nickname: "local" }, isAuthenticated: true }, version: 0 }));
}, TOKEN);
const page = await context.newPage();
const net = [];
page.on("request", (r) => { if (/\/api\/(conversations|ai-runs)/.test(r.url())) net.push({ t: ts(), m: r.method(), u: r.url().replace(BASE, ""), id: r.headers()["last-event-id"] ?? "" }); });
page.on("requestfailed", (r) => { if (/\/api\/(conversations|ai-runs)/.test(r.url())) net.push({ t: ts(), m: "FAILED", u: r.url().replace(BASE, ""), id: r.failure()?.errorText }); });
page.on("requestfinished", (r) => { if (/\/api\/(conversations|ai-runs)/.test(r.url())) net.push({ t: ts(), m: "DONE", u: r.url().replace(BASE, ""), id: "" }); });
const answers = () => page.locator("[aria-label='AI 응답']").count();
const input = () => page.locator("[contenteditable=true]").first();
let result = "FAIL";
try {
  await page.goto(`${BASE}/app/home`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await input().waitFor({ timeout: 180000 });
  compose("pause", "brain");
  let cutAt;
  try {
    await input().click();
    await page.keyboard.type("x^2-5x+6=0을 풀어줘");
    await page.getByRole("button", { name: "전송" }).click();
    await page.waitForURL(/\/app\/chat\/\d+/, { timeout: 120000 });
    await page.waitForTimeout(3000);
    for (let i = 0; i < 60; i++) { const st = JSON.parse(await (await fetch("http://127.0.0.1:29693/state")).text()); if (st.sse >= 1) break; await page.waitForTimeout(250); }
    say("cut", (await (await fetch(`http://127.0.0.1:29693/cut?mode=${MODE}`, { method: "POST" })).text()).trim());
    cutAt = Date.now();
  } finally {
    compose("unpause", "brain"); // Server는 run을 끝내지만 끊긴 연결로는 브라우저에 가지 않는다
  }
  const end = Date.now() + WAIT_MS;
  let seen = new Set();
  while (Date.now() < end) {
    const text = await page.locator("body").innerText().catch(() => "");
    for (const m of text.match(/[^\n]*(연결이 끊|다시 연결)[^\n]*/g) ?? []) if (!seen.has(m)) { seen.add(m); say("notice", m); }
    if ((await answers()) >= 1) { result = `OK terminal ${((Date.now() - cutAt) / 1000).toFixed(1)}s after cut`; break; }
    await page.waitForTimeout(250);
  }
  say("result", result, "relay", (await (await fetch("http://127.0.0.1:29693/state")).text()).trim());
} catch (e) {
  say("error", e.message.split("\n")[0]);
} finally {
  for (const n of net) lines.push(`${n.t}\t${n.m}\t${n.u}\t${n.id}`);
  fs.writeFileSync(`${OUT}/cut-${MODE}.log`, lines.join("\n") + "\n");
  await page.screenshot({ path: `${OUT}/cut-${MODE}.png` }).catch(() => {});
  await browser.close();
}
