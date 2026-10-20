import { chromium } from "playwright";
import fs from "fs";
export const S = process.env.S;
export const BASE = process.env.BASE || "http://localhost:5196";
const CT = fs.readFileSync(`${S}/stack/control-token`, "utf8").trim();
export const BRAIN = "http://127.0.0.1:29680";
export const control = async (method, path, body) => {
  const r = await fetch(`${BRAIN}${path}`, { method, headers: { "X-Testkit-Control-Token": CT, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return r.json();
};
// 다음 POST /api/conversations의 requestId에 testkit plan을 건다(브라우저는 Server만 부른다; plan 등록은 하네스가 Brain control route로).
export async function launch(tokenFile, name) {
  const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "ko-KR" });
  const token = fs.readFileSync(tokenFile, "utf8").trim();
  await context.addInitScript((t) => {
    if (!localStorage.getItem("accessToken")) {
      localStorage.setItem("accessToken", t);
      localStorage.setItem("refreshToken", "local-unused");
      localStorage.setItem("auth-storage", JSON.stringify({ state: { user: { userId: 0, nickname: "local" }, isAuthenticated: true }, version: 0 }));
    }
  }, token);
  const page = await context.newPage();
  const net = [];
  page.on("request", (r) => net.push({ t: Date.now(), method: r.method(), url: r.url(), body: r.method() === "POST" ? r.postData() : undefined, lastEventId: r.headers()["last-event-id"] }));
  page.on("response", (r) => { const e = net.findLast((n) => n.url === r.url() && n.status === undefined); if (e) e.status = r.status(); });
  page.on("console", (m) => { if (m.type() === "error") net.push({ t: Date.now(), console: m.text() }); });
  const plans = [];
  const shot = async (label) => page.screenshot({ path: `${S}/shots/${name}-${label}.png`, fullPage: false });
  const done = async () => { fs.writeFileSync(`${S}/shots/${name}-network.json`, JSON.stringify(net, null, 1)); await browser.close(); };
  return { browser, context, page, net, plans, shot, done };
}
export async function planNext(page, plan) {
  await page.route("**/api/conversations", async (route) => {
    const { requestId } = JSON.parse(route.request().postData());
    await control("PUT", `/__testkit__/v1/plans/${requestId}`, plan);
    page.__lastRequestId = requestId;
    await route.continue();
  }, { times: 1 });
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
export const activityRows = (page) => page.locator("ol[aria-label] > li").allInnerTexts();
export const panelText = async (page) => (await page.locator("body").innerText());
export async function waitText(page, text, timeout = 30000) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout });
}
export function wrap(fn) {
  return async (...a) => { try { await fn(...a); } catch (e) { console.log("FAIL", e.message.split("\n")[0]); } };
}
