import { chromium } from "playwright";
import fs from "fs";
export const S = process.env.S;
export const BASE = "http://localhost:5198";
export async function launch(name) {
  const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "ko-KR" });
  const token = fs.readFileSync(`${S}/token`, "utf8").trim();
  await context.addInitScript((t) => {
    if (!localStorage.getItem("accessToken")) {
      localStorage.setItem("accessToken", t);
      localStorage.setItem("auth-storage", JSON.stringify({ state: { user: { userId: 0, nickname: "local" }, isAuthenticated: true }, version: 0 }));
    }
  }, token);
  const page = await context.newPage();
  const net = [];
  page.on("request", (r) => net.push({ t: Date.now(), method: r.method(), url: r.url(), lastEventId: r.headers()["last-event-id"] }));
  page.on("response", (r) => { const e = net.findLast((n) => n.url === r.url() && n.status === undefined); if (e) e.status = r.status(); });
  page.on("console", (m) => { if (m.type() === "error") net.push({ t: Date.now(), console: m.text() }); });
  const shot = (label) => page.screenshot({ path: `${S}/shots/${name}-${label}.png` });
  const apiLog = () => { for (const n of net.filter(n => n.console || n.url?.includes("/api/ai-runs") || n.url?.includes("/api/conversations"))) console.log(new Date(n.t).toISOString().slice(14,23), n.console ? "CONSOLE " + n.console.slice(0,150) : `${n.method} ${n.status} ${n.url.replace(BASE, "")} ${n.lastEventId ?? ""}`); };
  const done = async () => { await browser.close(); };
  return { page, net, shot, done, apiLog };
}
export const input = (page) => page.locator("[contenteditable=true]").first();
export async function typeAndSend(page, text) {
  await input(page).click();
  await page.keyboard.type(text);
  await page.getByRole("button", { name: "전송" }).click();
}
export async function openHome(page) {
  await page.goto(`${BASE}/app/home`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await input(page).waitFor({ timeout: 60000 });
}
export const rows = (page) => page.locator("ol[aria-label='진행 상황'] > li").allInnerTexts();
export const answers = (page) => page.locator("[aria-label='AI 응답']").count();
